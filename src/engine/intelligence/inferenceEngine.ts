/**
 * Phase 26 — Inference Engine
 * Derives new facts from existing graph relations via transitive chaining.
 * 100% local, no AI APIs.
 */
import type { KnowledgeGraph } from './knowledgeGraph';

const STORAGE_KEY = 'sofia_inferred_v1';

export interface InferredFact {
  a: string;
  b: string;
  via: string[];        // intermediate path
  confidence: number;   // 0..1, decays with hops
  ts: number;
}

export class InferenceEngine {
  private facts: InferredFact[] = [];
  constructor(private graph: KnowledgeGraph) { this.load(); }

  private load() {
    try { this.facts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { this.facts = []; }
  }
  private save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.facts.slice(-500))); } catch {/*ignore*/}
  }

  /** Chain A→B→C → infer A→C (transitive). Returns new fact count. */
  inferRelations(maxDepth = 3, maxPerNode = 6): number {
    const nodes = this.graph.serialize();
    const seen = new Set(this.facts.map(f => `${f.a}|${f.b}`));
    let added = 0;
    for (const start of nodes) {
      const reach = this.graph.traverse(start.name, maxDepth);
      let n = 0;
      for (const r of reach) {
        if (r.name === start.name) continue;
        const key = `${start.name.toLowerCase()}|${r.name.toLowerCase()}`;
        if (seen.has(key)) continue;
        // Skip direct neighbors — already in graph
        if (start.relations.map(x => x.toLowerCase()).includes(r.name.toLowerCase())) continue;
        const confidence = Math.max(0.2, 1 - 0.3 * maxDepth);
        this.facts.push({ a: start.name, b: r.name, via: [], confidence, ts: Date.now() });
        seen.add(key);
        added++;
        if (++n >= maxPerNode) break;
      }
    }
    this.save();
    return added;
  }

  /** Concrete generated conclusions for a given entity */
  generateConclusions(entity: string): InferredFact[] {
    const e = entity.toLowerCase();
    return this.facts.filter(f => f.a.toLowerCase() === e);
  }

  createIndirectLinks(entity: string): string[] {
    return this.generateConclusions(entity).map(f => f.b);
  }

  confidenceScoring(a: string, b: string): number {
    const f = this.facts.find(x => x.a.toLowerCase() === a.toLowerCase() && x.b.toLowerCase() === b.toLowerCase());
    return f?.confidence || 0;
  }

  list(): InferredFact[] { return this.facts; }
  clear() { this.facts = []; this.save(); }
}
