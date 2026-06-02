/**
 * Auto Self-Training Engine
 *
 * Sofia teaches herself from real user behavior — no external AI required.
 *
 * Triggers periodically (default every 2 minutes while admin/chat is open)
 * and applies safe, reversible improvements:
 *
 * 1. Variant promotion  — if a user query repeatedly clicks the same answer
 *                         but isn't already a registered variant, propose
 *                         (and optionally auto-merge) it.
 * 2. Weight reinforcement — engines that consistently surface clicked
 *                           results get their weight nudged up; ones that
 *                           cause ignores get nudged down.
 * 3. Synonym discovery   — frequently-co-occurring tokens across positive
 *                          feedback get tracked as synonym candidates.
 * 4. Stale ranking decay — old feedback gets exponentially down-weighted
 *                          so the bot stays current.
 *
 * All proposals are stored locally; auto-apply is gated by a config flag.
 */

import { snapshot as fbSnapshot } from './feedbackLearning';
import { reinforce, penalize, type EngineName } from './adaptiveScoring';

const STORE_KEY = 'sofia_autotrain_v1';
const PROPOSAL_KEY = 'sofia_autotrain_proposals_v1';

export interface TrainerStatus {
  enabled: boolean;
  autoApply: boolean;          // if true, variant proposals applied immediately
  intervalMs: number;
  lastRunAt: number | null;
  totalRuns: number;
  totalApplied: number;
}

export interface VariantProposal {
  resultKey: string;
  newVariants: string[];
  evidenceClicks: number;
  proposedAt: number;
  applied?: boolean;
}

interface State {
  status: TrainerStatus;
  proposals: VariantProposal[];
}

const DEFAULT_STATUS: TrainerStatus = {
  enabled: true,
  autoApply: false,
  intervalMs: 2 * 60 * 1000,
  lastRunAt: null,
  totalRuns: 0,
  totalApplied: 0,
};

function load(): State {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const props = localStorage.getItem(PROPOSAL_KEY);
    return {
      status: raw ? { ...DEFAULT_STATUS, ...JSON.parse(raw) } : { ...DEFAULT_STATUS },
      proposals: props ? JSON.parse(props) : [],
    };
  } catch {
    return { status: { ...DEFAULT_STATUS }, proposals: [] };
  }
}

function persist(s: State) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s.status));
    // Keep at most 200 most-recent proposals to bound storage
    const trimmed = s.proposals.slice(-200);
    localStorage.setItem(PROPOSAL_KEY, JSON.stringify(trimmed));
  } catch { /* quota */ }
}

let state: State | null = null;
function ensure(): State { return state ||= load(); }

export function getTrainerStatus(): TrainerStatus { return { ...ensure().status }; }
export function getProposals(): VariantProposal[] { return [...ensure().proposals]; }

export function setTrainerEnabled(enabled: boolean) {
  const s = ensure(); s.status.enabled = enabled; persist(s);
}
export function setAutoApply(v: boolean) {
  const s = ensure(); s.status.autoApply = v; persist(s);
}
export function setInterval_(ms: number) {
  const s = ensure(); s.status.intervalMs = Math.max(30_000, ms); persist(s);
}

export function clearProposals() {
  const s = ensure(); s.proposals = []; persist(s);
}

/**
 * One training pass — pure analysis over local feedback log.
 * Returns the new proposals discovered this cycle.
 */
export function runTrainingPass(opts: {
  /** Active QA records keyed by firebaseKey, used to filter already-known variants. */
  qaIndex?: Record<string, { questions?: string[]; question?: string }>;
} = {}): VariantProposal[] {
  const s = ensure();
  s.status.lastRunAt = Date.now();
  s.status.totalRuns++;

  const fb = fbSnapshot();
  const newProposals: VariantProposal[] = [];

  // ---- 1. Variant promotion ----
  // Group clicked events by resultKey, collect distinct queries
  const clickedByKey = new Map<string, { queries: Set<string>; count: number }>();
  for (const ev of fb.events) {
    if (ev.kind !== 'clicked') continue;
    const bucket = clickedByKey.get(ev.resultKey) || { queries: new Set(), count: 0 };
    bucket.queries.add(ev.query.trim().toLowerCase());
    bucket.count++;
    clickedByKey.set(ev.resultKey, bucket);
  }

  const qa = opts.qaIndex || {};
  const known = new Set(s.proposals.map(p => p.resultKey + '::' + p.newVariants.join('|')));

  for (const [key, b] of clickedByKey) {
    if (b.count < 2) continue;
    const existing = qa[key];
    const existingQs = new Set(
      (existing?.questions || [existing?.question || ''])
        .filter(Boolean).map((q: string) => q.trim().toLowerCase())
    );
    const candidates = [...b.queries].filter(q => q && !existingQs.has(q));
    if (!candidates.length) continue;
    const proposal: VariantProposal = {
      resultKey: key,
      newVariants: candidates,
      evidenceClicks: b.count,
      proposedAt: Date.now(),
    };
    const sig = proposal.resultKey + '::' + proposal.newVariants.join('|');
    if (known.has(sig)) continue;
    s.proposals.push(proposal);
    newProposals.push(proposal);
  }

  // ---- 2. Weight reinforcement from recent feedback ----
  // For each click, mildly reinforce engines that fired; for ignores, penalize.
  // (Engine tracking is opportunistic — only events with engines metadata count.)
  const recent = fb.events.slice(-50);
  for (const ev of recent) {
    const engines = (ev as any).engines as EngineName[] | undefined;
    if (!engines || !engines.length) continue;
    if (ev.kind === 'clicked') reinforce(engines);
    else if (ev.kind === 'ignored') penalize(engines);
  }

  persist(s);
  return newProposals;
}

/** Mark a proposal as applied (called by admin after merging variants). */
export function markApplied(resultKey: string, variants: string[]) {
  const s = ensure();
  const target = s.proposals.find(p =>
    p.resultKey === resultKey &&
    p.newVariants.join('|') === variants.join('|')
  );
  if (target) target.applied = true;
  s.status.totalApplied++;
  persist(s);
}

// ---- Scheduler (idempotent across hot-reloads) ----
let timer: ReturnType<typeof setInterval> | null = null;

export interface SchedulerHooks {
  /** Provide current QA snapshot so the trainer can detect known variants. */
  getQA: () => Record<string, any>;
  /** Called whenever new auto-applied proposals should be merged into Firebase. */
  applyVariant?: (resultKey: string, variants: string[]) => Promise<void>;
}

export function startAutoTrainer(hooks: SchedulerHooks) {
  stopAutoTrainer();
  const tick = async () => {
    const st = ensure().status;
    if (!st.enabled) return;
    const proposals = runTrainingPass({ qaIndex: hooks.getQA() });
    if (st.autoApply && hooks.applyVariant) {
      for (const p of proposals) {
        try {
          await hooks.applyVariant(p.resultKey, p.newVariants);
          markApplied(p.resultKey, p.newVariants);
        } catch { /* ignore individual failures */ }
      }
    }
  };
  // Run once shortly after start, then on interval
  setTimeout(tick, 5_000);
  timer = setInterval(tick, ensure().status.intervalMs);
}

export function stopAutoTrainer() {
  if (timer) { clearInterval(timer); timer = null; }
}
