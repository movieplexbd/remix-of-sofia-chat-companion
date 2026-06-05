/**
 * Phase 6 — User Feedback Learning
 *
 * Tracks per-result interactions (shown / clicked / ignored) in localStorage
 * and produces a multiplicative boost in [0.5, 2.0] that the ranker applies.
 *
 * Frequently selected → boost > 1
 * Repeatedly ignored  → boost < 1
 */

const STORAGE_KEY = 'sofia_feedback_v1';
const MAX_EVENTS = 500;

export type FeedbackKind = 'shown' | 'clicked' | 'ignored';

export interface FeedbackEvent {
  query: string;
  resultKey: string;   // QAItem.firebaseKey or stable id
  kind: FeedbackKind;
  ts: number;
}

interface FeedbackState {
  events: FeedbackEvent[];
  // Aggregated per-result counters
  agg: Record<string, { clicks: number; ignores: number; shown: number }>;
  successCount?: number;
  failureCount?: number;
}

function load(): FeedbackState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { events: [], agg: {}, successCount: 0, failureCount: 0 };
}

function save(s: FeedbackState) {
  try {
    if (s.events.length > MAX_EVENTS) s.events = s.events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* quota */ }
}

let state: FeedbackState | null = null;
function ensure(): FeedbackState { return state ||= load(); }

export function recordEvent(e: Omit<FeedbackEvent, 'ts'>) {
  const s = ensure();
  const full: FeedbackEvent = { ...e, ts: Date.now() };
  s.events.push(full);
  const a = s.agg[e.resultKey] ||= { clicks: 0, ignores: 0, shown: 0 };
  if (e.kind === 'clicked') a.clicks++;
  else if (e.kind === 'ignored') a.ignores++;
  else if (e.kind === 'shown') a.shown++;
  save(s);
}

/** Boost factor — 1.0 means neutral. */
export function feedbackBoost(resultKey?: string | null): number {
  if (!resultKey) return 1;
  const a = ensure().agg[resultKey];
  if (!a) return 1;
  const net = a.clicks - a.ignores * 0.5;
  // Map net into 0.5 .. 2.0 with diminishing returns
  const factor = 1 + Math.tanh(net / 5);
  return Math.max(0.5, Math.min(2.0, factor));
}

export function topClicked(limit = 5) {
  const a = ensure().agg;
  return Object.entries(a)
    .sort((x, y) => y[1].clicks - x[1].clicks)
    .slice(0, limit)
    .map(([key, v]) => ({ key, ...v }));
}

export function topQueries(limit = 5) {
  const counts: Record<string, number> = {};
  for (const e of ensure().events) counts[e.query] = (counts[e.query] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit)
    .map(([query, count]) => ({ query, count }));
}

export function recordOutcome(success: boolean) {
  const s = ensure();
  if (success) s.successCount = (s.successCount || 0) + 1;
  else s.failureCount = (s.failureCount || 0) + 1;
  save(s);
}

export function getStats() {
  const s = ensure();
  const succ = s.successCount || 0;
  const fail = s.failureCount || 0;
  const total = succ + fail;
  return {
    successRate: total > 0 ? (succ / total) : 0,
    total,
    success: succ,
    failure: fail,
  };
}

export function clearFeedback() {
  state = { events: [], agg: {}, successCount: 0, failureCount: 0 };
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function snapshot(): FeedbackState { return ensure(); }
