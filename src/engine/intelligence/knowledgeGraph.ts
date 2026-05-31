/**
 * Phase 2 — Knowledge Graph Engine (v2 — traversal + attributes)
 *
 * Full KG: Entity → Relations + Categories + Attributes
 * Supports BFS traversal, reverse lookup, attribute storage.
 */

export interface KGNode {
  name: string;
  categories: string[];
  relations: string[];    // names of related nodes
  attributes: Record<string, string>;  // key-value attributes
}

const STORAGE_KEY = 'sofia_kg_v2';

export class KnowledgeGraph {
  private nodes = new Map<string, KGNode>();

  constructor() { this.load(); }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data: KGNode[] = JSON.parse(raw);
        data.forEach(n => this.nodes.set(n.name.toLowerCase(), {
          ...n,
          attributes: n.attributes || {},
        }));
      }
    } catch { /* ignore */ }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.nodes.values()]));
    } catch { /* ignore */ }
  }

  addEntity(name: string, categories: string[] = [], relations: string[] = [], attributes: Record<string, string> = {}) {
    const key = name.toLowerCase();
    const existing = this.nodes.get(key);
    if (existing) {
      existing.categories = [...new Set([...existing.categories, ...categories])];
      existing.relations  = [...new Set([...existing.relations, ...relations])];
      existing.attributes = { ...existing.attributes, ...attributes };
    } else {
      this.nodes.set(key, { name, categories: [...categories], relations: [...relations], attributes: { ...attributes } });
    }
    this.save();
  }

  addRelation(a: string, b: string) {
    this.addEntity(a, [], [b]);
    this.addEntity(b, [], [a]);
  }

  /** Add or update a key-value attribute on an entity */
  setAttribute(entity: string, key: string, value: string) {
    const node = this.nodes.get(entity.toLowerCase());
    if (node) {
      node.attributes[key] = value;
      this.save();
    }
  }

  getAttribute(entity: string, key: string): string | undefined {
    return this.nodes.get(entity.toLowerCase())?.attributes[key];
  }

  deleteEntity(name: string) {
    this.nodes.delete(name.toLowerCase());
    // Remove from other nodes' relations
    for (const node of this.nodes.values()) {
      node.relations = node.relations.filter(r => r.toLowerCase() !== name.toLowerCase());
    }
    this.save();
  }

  get(name: string): KGNode | undefined { return this.nodes.get(name.toLowerCase()); }
  size() { return this.nodes.size; }
  serialize() { return [...this.nodes.values()]; }

  /** Reverse lookup: find all entities in a given category */
  reverseLookup(category: string): KGNode[] {
    const cat = category.toLowerCase();
    return [...this.nodes.values()].filter(n =>
      n.categories.some(c => c.toLowerCase() === cat)
    );
  }

  /** BFS graph traversal from a start entity up to `depth` hops */
  traverse(startName: string, depth = 2): KGNode[] {
    const visited = new Set<string>();
    const queue: Array<{ name: string; d: number }> = [{ name: startName.toLowerCase(), d: 0 }];
    const result: KGNode[] = [];

    while (queue.length) {
      const { name, d } = queue.shift()!;
      if (visited.has(name) || d > depth) continue;
      visited.add(name);

      const node = this.nodes.get(name);
      if (!node) continue;
      result.push(node);

      if (d < depth) {
        for (const rel of node.relations) {
          if (!visited.has(rel.toLowerCase())) {
            queue.push({ name: rel.toLowerCase(), d: d + 1 });
          }
        }
      }
    }
    return result;
  }

  /** Find entities present in the token stream */
  matchEntities(tokens: string[]): KGNode[] {
    const hits: KGNode[] = [];
    for (const t of tokens) {
      const n = this.nodes.get(t.toLowerCase());
      if (n) hits.push(n);
    }
    return hits;
  }

  /** 0..1 graph score: how well candidate's category/tags align with query entities */
  graphScore(tokens: string[], candidateCategory: string, candidateTags: string[] = []): number {
    const ents = this.matchEntities(tokens);
    if (!ents.length) return 0;
    const target = new Set([
      candidateCategory?.toLowerCase(),
      ...candidateTags.map(t => t.toLowerCase()),
    ]);
    let hit = 0;
    for (const e of ents) {
      for (const c of e.categories) if (target.has(c.toLowerCase())) { hit++; break; }
      // Also traverse 1 hop for related category coverage
      for (const rel of e.relations.slice(0, 3)) {
        const relNode = this.nodes.get(rel.toLowerCase());
        if (relNode) {
          for (const c of relNode.categories) if (target.has(c.toLowerCase())) { hit += 0.5; break; }
        }
      }
    }
    return Math.min(1, hit / ents.length);
  }
}

export function buildDefaultGraph(): KnowledgeGraph {
  const g = new KnowledgeGraph();
  if (g.size() > 0) return g;

  // Animals
  g.addEntity('lion',   ['animal', 'mammal', 'wildlife'], ['tiger', 'cheetah'], { habitat: 'savanna' });
  g.addEntity('tiger',  ['animal', 'mammal', 'wildlife'], ['lion'], { habitat: 'forest' });
  g.addEntity('সিংহ',   ['animal', 'mammal', 'wildlife'], ['বাঘ']);
  g.addEntity('বাঘ',    ['animal', 'mammal', 'wildlife'], ['সিংহ'], { habitat: 'বন' });

  // Bangladesh geography
  g.addEntity('ঢাকা',       ['location', 'city', 'capital'], ['বাংলাদেশ', 'চট্টগ্রাম'], { country: 'বাংলাদেশ', type: 'রাজধানী' });
  g.addEntity('বাংলাদেশ',    ['country', 'south_asia'],       ['ঢাকা', 'ভারত', 'মিয়ানমার'], { capital: 'ঢাকা' });
  g.addEntity('চট্টগ্রাম',   ['location', 'city', 'port'],    ['ঢাকা', 'বাংলাদেশ']);
  g.addEntity('Dhaka',      ['location', 'city', 'capital'], ['Bangladesh'], { country: 'Bangladesh' });
  g.addEntity('Bangladesh', ['country', 'south_asia'],       ['Dhaka', 'India'], { capital: 'Dhaka' });

  // Tech
  g.addEntity('phone',   ['tech', 'electronics', 'mobile'],   ['laptop', 'tablet'], { alias: 'mobile,smartphone' });
  g.addEntity('laptop',  ['tech', 'electronics', 'computer'], ['phone', 'desktop']);
  g.addEntity('ফোন',     ['tech', 'electronics', 'mobile'],   ['ল্যাপটপ'], { alias: 'মোবাইল,স্মার্টফোন' });
  g.addEntity('মোবাইল',  ['tech', 'electronics', 'mobile'],   ['ফোন']);

  // Clothing
  g.addEntity('shirt',  ['clothing', 'fashion', 'apparel'], ['pants', 'jacket']);
  g.addEntity('শার্ট',  ['clothing', 'fashion', 'apparel'], ['প্যান্ট']);
  g.addEntity('শাড়ি',   ['clothing', 'fashion', 'apparel', 'traditional'], ['কামিজ']);

  // Food
  g.addEntity('rice',   ['food', 'grain'],         ['fish', 'curry']);
  g.addEntity('ভাত',    ['food', 'grain'],         ['মাছ', 'তরকারি']);
  g.addEntity('মাছ',    ['food', 'protein'],       ['ভাত']);

  // Education
  g.addEntity('school',  ['education', 'institution'], ['college', 'university']);
  g.addEntity('স্কুল',   ['education', 'institution'], ['কলেজ', 'বিশ্ববিদ্যালয়']);
  g.addEntity('book',    ['education', 'reading'],     ['library']);
  g.addEntity('বই',      ['education', 'reading'],     ['পাঠাগার']);

  return g;
}
