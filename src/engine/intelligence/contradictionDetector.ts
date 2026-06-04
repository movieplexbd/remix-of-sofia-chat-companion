/**
 * Phase 22 — Contradiction Detector
 *
 * Stores (entity, attribute, value, source) tuples and flags conflicts when
 * the same (entity, attribute) gets a different value.
 */

const STORAGE_KEY = 'sofia_facts_v1';

export interface Fact {
  id: string;
  entity: string;
  attribute: string;
  value: string;
  source: string;
  confidence: number;
  ts: number;
  resolved?: boolean;
}

export interface Conflict {
  attribute: string;
  entity: string;
  facts: Fact[];
}

function load(): Fact[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function save(facts: Fact[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(facts.slice(-500))); }
  catch { /* ignore */ }
}

export class ContradictionStore {
  private facts: Fact[] = load();

  add(f: Omit<Fact, 'id' | 'ts'>): { fact: Fact; conflict: Conflict | null } {
    const fact: Fact = { ...f, id: `f_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, ts: Date.now() };
    this.facts.push(fact);
    save(this.facts);
    const conflict = this.detectFor(fact);
    return { fact, conflict };
  }

  private detectFor(f: Fact): Conflict | null {
    const same = this.facts.filter(x =>
      x.entity.toLowerCase() === f.entity.toLowerCase() &&
      x.attribute.toLowerCase() === f.attribute.toLowerCase() &&
      x.value.toLowerCase() !== f.value.toLowerCase() &&
      !x.resolved
    );
    if (!same.length) return null;
    return { attribute: f.attribute, entity: f.entity, facts: [f, ...same] };
  }

  list(): Fact[] { return [...this.facts]; }
  conflicts(): Conflict[] {
    const grouped = new Map<string, Fact[]>();
    for (const f of this.facts) {
      if (f.resolved) continue;
      const k = `${f.entity.toLowerCase()}|${f.attribute.toLowerCase()}`;
      const arr = grouped.get(k) || [];
      arr.push(f);
      grouped.set(k, arr);
    }
    const out: Conflict[] = [];
    for (const [k, arr] of grouped) {
      const values = new Set(arr.map(a => a.value.toLowerCase()));
      if (values.size > 1) {
        const [entity, attribute] = k.split('|');
        out.push({ entity, attribute, facts: arr });
      }
    }
    return out;
  }
  resolve(id: string) {
    const f = this.facts.find(x => x.id === id);
    if (f) { f.resolved = true; save(this.facts); }
  }
  clear() { this.facts = []; save(this.facts); }
}
