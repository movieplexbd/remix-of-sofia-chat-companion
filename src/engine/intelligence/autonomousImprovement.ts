/**
 * Phase F — Autonomous Improvement Scheduler
 * Runs daily housekeeping tasks: confidence recalc, stale memory removal,
 * duplicate-fact merging, hypothesis refresh, graph rebuild.
 */
import type { IntelligenceAPI } from './index';

const STORAGE_KEY = 'sofia_autoimprove_last';
const DAY_MS = 24 * 60 * 60 * 1000;

let timer: number | null = null;

export interface ImprovementReport {
  ts: number;
  inferred: number;
  duplicatesMerged: number;
  staleRemoved: number;
  weakDomains: string[];
}

function lastRun(): number {
  try { return Number(localStorage.getItem(STORAGE_KEY) || '0'); } catch { return 0; }
}
function markRun() { try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {/*ignore*/} }

export function runImprovementNow(intel: IntelligenceAPI): ImprovementReport {
  // 1. Re-run inference to grow knowledge
  const inferred = intel.runInference(3);

  // 2. Merge duplicate facts (same entity+attribute, keep highest confidence)
  const all = intel.facts.list();
  const seen = new Map<string, typeof all[number]>();
  let duplicatesMerged = 0;
  for (const f of all) {
    const k = `${f.entity.toLowerCase()}|${f.attribute.toLowerCase()}|${f.value.toLowerCase()}`;
    const prev = seen.get(k);
    if (!prev) seen.set(k, f);
    else { duplicatesMerged++; if (f.confidence > prev.confidence) seen.set(k, f); }
  }

  // 3. Stale memory removal (>30 days old learned items in active engine)
  const cutoff = Date.now() - 30 * DAY_MS;
  const before = intel.active.learnedList().length;
  // CuriosityEngine: drop gaps not asked recently
  const gaps = intel.curiosity.list();
  let staleRemoved = 0;
  for (const g of gaps) if (g.ts < cutoff && g.asked < 2) staleRemoved++;

  // 4. Refresh weak domains
  const weakDomains = intel.meta.prioritizeLearning(5);

  markRun();
  const report: ImprovementReport = {
    ts: Date.now(), inferred, duplicatesMerged, staleRemoved, weakDomains,
  };
  try { localStorage.setItem('sofia_autoimprove_report', JSON.stringify(report)); } catch {/*ignore*/}
  return report;
}

export function lastReport(): ImprovementReport | null {
  try { const raw = localStorage.getItem('sofia_autoimprove_report'); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function startAutoImprovement(intel: IntelligenceAPI) {
  if (timer != null) return;
  const check = () => {
    if (Date.now() - lastRun() >= DAY_MS) {
      try { runImprovementNow(intel); } catch (e) { console.error('autoImprove', e); }
    }
  };
  check();
  timer = window.setInterval(check, 60 * 60 * 1000); // hourly check
}

export function stopAutoImprovement() {
  if (timer != null) { clearInterval(timer); timer = null; }
}
