/**
 * Firebase Training Sync
 *
 * Push/pull SHARED training data (concepts, ontology, facts, learned items,
 * reasoning rules) to Firebase under `training/*` so every user benefits.
 *
 * User-specific data (chat history, profile, character pick) stays local.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';
import { firebaseConfig } from '../constants/firebaseConfig';
import { getSharedIntel } from './sharedIntel';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getDatabase(app);

const PATHS = {
  concepts: 'training/concepts',
  ontology: 'training/ontology',
  facts: 'training/facts',
  learned: 'training/learned',
  traces: 'training/reasoningTraces',
  autoReport: 'training/autoReports',
  meta: 'training/metaCognition',
} as const;

const LAST_SYNC_KEY = 'sofia_training_last_sync';

export interface TrainingSnapshot {
  concepts: any[];
  ontology: any[];
  facts: any[];
  learned: any[];
  traces: any[];
  meta: any;
  ts: number;
}

export function getLastSync(): number {
  try { return Number(localStorage.getItem(LAST_SYNC_KEY) || '0'); } catch { return 0; }
}

export function buildLocalSnapshot(): TrainingSnapshot {
  const intel = getSharedIntel();
  const diag = intel.getDiagnostics();
  return {
    concepts: diag.concepts || [],
    ontology: diag.ontology || [],
    facts: diag.facts || [],
    learned: intel.active.learnedList() || [],
    traces: intel.getReasoningTraces().slice(0, 50),
    meta: { weights: diag.weights },
    ts: Date.now(),
  };
}

/** Push local intelligence → Firebase (shared). */
export async function pushToFirebase(): Promise<TrainingSnapshot> {
  const snap = buildLocalSnapshot();
  await Promise.all([
    set(ref(db, PATHS.concepts), snap.concepts),
    set(ref(db, PATHS.ontology), snap.ontology),
    set(ref(db, PATHS.facts), snap.facts),
    set(ref(db, PATHS.learned), snap.learned),
    set(ref(db, PATHS.traces), snap.traces),
    set(ref(db, PATHS.meta), { ...snap.meta, ts: snap.ts }),
  ]);
  try { localStorage.setItem(LAST_SYNC_KEY, String(snap.ts)); } catch {/*ignore*/}
  return snap;
}

/** Pull shared training data from Firebase → local intelligence (merge). */
export async function pullFromFirebase(): Promise<{
  concepts: number; ontology: number; facts: number; learned: number;
}> {
  const intel = getSharedIntel();
  const [cs, os, fs, ls] = await Promise.all([
    get(ref(db, PATHS.concepts)),
    get(ref(db, PATHS.ontology)),
    get(ref(db, PATHS.facts)),
    get(ref(db, PATHS.learned)),
  ]);

  let cN = 0, oN = 0, fN = 0, lN = 0;

  if (cs.exists()) {
    const arr = cs.val() || [];
    const existing = new Set(intel.concepts.list().map(c => c.id));
    for (const c of arr) {
      if (!c?.id || existing.has(c.id)) continue;
      intel.concepts.addConcept(c);
      cN++;
    }
  }
  if (os.exists()) {
    const arr = os.val() || [];
    for (const n of arr) {
      if (!n?.id) continue;
      if (!intel.ontology.get(n.id)) { intel.ontology.add(n); oN++; }
    }
  }
  if (fs.exists()) {
    const arr = fs.val() || [];
    const known = new Set(intel.facts.list().map(f => `${f.entity}|${f.attribute}|${f.value}`));
    for (const f of arr) {
      const k = `${f.entity}|${f.attribute}|${f.value}`;
      if (known.has(k)) continue;
      intel.facts.add({
        entity: f.entity, attribute: f.attribute, value: f.value,
        source: f.source || 'firebase', confidence: f.confidence || 0.7,
      });
      fN++;
    }
  }
  if (ls.exists()) {
    const arr = ls.val() || [];
    const known = new Set(intel.active.learnedList().map(x => x.topic));
    for (const x of arr) {
      if (x?.topic && !known.has(x.topic)) {
        intel.active.saveLearnedFact(x.topic, x.content || x.fact || 'imported');
        lN++;
      }
    }
  }

  try { localStorage.setItem(LAST_SYNC_KEY, String(Date.now())); } catch {/*ignore*/}
  return { concepts: cN, ontology: oN, facts: fN, learned: lN };
}

/** Push the latest autonomous-improvement report (for fleet observability). */
export async function pushImprovementReport(report: any) {
  try {
    const k = `r_${Date.now()}`;
    await set(ref(db, `${PATHS.autoReport}/${k}`), report);
  } catch (e) { console.error('pushImprovementReport', e); }
}
