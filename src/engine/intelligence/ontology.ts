/**
 * Phase 18 — Hierarchical Ontology Engine
 *
 * Tree of categories: parent → children. Supports parent/child/sibling/ancestor
 * lookup and category expansion. Persisted to localStorage.
 */

const STORAGE_KEY = 'sofia_ontology_v1';

export interface OntologyNode {
  id: string;
  parentId: string | null;
  type?: 'category' | 'class' | 'instance';
}

const DEFAULTS: OntologyNode[] = [
  { id: 'thing', parentId: null, type: 'category' },
  // Living
  { id: 'animal', parentId: 'thing' },
  { id: 'mammal', parentId: 'animal' },
  { id: 'lion', parentId: 'mammal', type: 'instance' },
  { id: 'tiger', parentId: 'mammal', type: 'instance' },
  { id: 'bird', parentId: 'animal' },
  { id: 'eagle', parentId: 'bird', type: 'instance' },
  // Vehicle
  { id: 'vehicle', parentId: 'thing' },
  { id: 'car', parentId: 'vehicle' },
  { id: 'suv', parentId: 'car', type: 'instance' },
  { id: 'sedan', parentId: 'car', type: 'instance' },
  { id: 'motorcycle', parentId: 'vehicle', type: 'instance' },
  // Tech
  { id: 'tech', parentId: 'thing' },
  { id: 'electronics', parentId: 'tech' },
  { id: 'mobile', parentId: 'electronics' },
  { id: 'computer', parentId: 'electronics' },
  // Location
  { id: 'location', parentId: 'thing' },
  { id: 'country', parentId: 'location' },
  { id: 'city', parentId: 'location' },
  // Education
  { id: 'education', parentId: 'thing' },
  // Food
  { id: 'food', parentId: 'thing' },
];

export class Ontology {
  private nodes = new Map<string, OntologyNode>();
  private children = new Map<string, Set<string>>();

  constructor() { this.load(); this.rebuildChildren(); }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data: OntologyNode[] = raw ? JSON.parse(raw) : DEFAULTS;
      const ids = new Set(data.map(n => n.id));
      const merged = [...data, ...DEFAULTS.filter(n => !ids.has(n.id))];
      merged.forEach(n => this.nodes.set(n.id.toLowerCase(), n));
    } catch {
      DEFAULTS.forEach(n => this.nodes.set(n.id, n));
    }
  }
  private save() {
    try {
      const custom = [...this.nodes.values()]
        .filter(n => !DEFAULTS.some(d => d.id === n.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    } catch { /* ignore */ }
  }
  private rebuildChildren() {
    this.children.clear();
    for (const n of this.nodes.values()) {
      if (n.parentId) {
        const set = this.children.get(n.parentId) || new Set();
        set.add(n.id);
        this.children.set(n.parentId, set);
      }
    }
  }

  add(node: OntologyNode) {
    this.nodes.set(node.id.toLowerCase(), node);
    this.rebuildChildren();
    this.save();
  }
  remove(id: string) {
    this.nodes.delete(id.toLowerCase());
    this.rebuildChildren();
    this.save();
  }

  get(id: string) { return this.nodes.get(id.toLowerCase()); }
  parents(id: string): string[] {
    const out: string[] = [];
    let cur = this.get(id);
    const guard = new Set<string>();
    while (cur?.parentId && !guard.has(cur.parentId)) {
      guard.add(cur.parentId);
      out.push(cur.parentId);
      cur = this.get(cur.parentId);
    }
    return out;
  }
  childrenOf(id: string): string[] {
    return [...(this.children.get(id.toLowerCase()) || [])];
  }
  siblings(id: string): string[] {
    const n = this.get(id);
    if (!n?.parentId) return [];
    return this.childrenOf(n.parentId).filter(x => x !== id.toLowerCase());
  }
  /** Expand a category to itself + descendants (BFS up to depth) */
  expandCategory(id: string, depth = 3): string[] {
    const start = id.toLowerCase();
    const out = new Set<string>([start]);
    const queue: Array<{ id: string; d: number }> = [{ id: start, d: 0 }];
    while (queue.length) {
      const { id: cur, d } = queue.shift()!;
      if (d >= depth) continue;
      for (const c of this.childrenOf(cur)) {
        if (!out.has(c)) { out.add(c); queue.push({ id: c, d: d + 1 }); }
      }
    }
    return [...out];
  }
  /** Score how well a candidate category aligns with any query token (0..1) */
  ontologyScore(queryTokens: string[], candidateCategory: string): number {
    if (!candidateCategory) return 0;
    const cat = candidateCategory.toLowerCase();
    if (!this.get(cat)) return 0;
    const ancestors = new Set(this.parents(cat).concat(cat));
    let hit = 0, total = 0;
    for (const t of queryTokens) {
      total++;
      if (ancestors.has(t.toLowerCase())) hit++;
      else if (this.get(t.toLowerCase())) {
        // shared ancestor?
        const tAnc = new Set(this.parents(t.toLowerCase()).concat(t.toLowerCase()));
        for (const a of tAnc) if (ancestors.has(a)) { hit += 0.5; break; }
      }
    }
    return total ? Math.min(1, hit / total) : 0;
  }
  list(): OntologyNode[] { return [...this.nodes.values()]; }
}
