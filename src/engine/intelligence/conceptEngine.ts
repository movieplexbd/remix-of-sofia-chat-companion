/**
 * Phase 17 — Semantic Concept Engine
 *
 * Groups cross-language aliases into named concepts (no embeddings).
 * Provides concept lookup, expansion, similarity, and related-concept discovery.
 */

const STORAGE_KEY = 'sofia_concepts_v1';

export interface Concept {
  id: string;
  aliases: string[];
  related: string[];           // related concept ids
  categories?: string[];
}

const DEFAULT_CONCEPTS: Concept[] = [
  { id: 'MOBILE_DEVICE', aliases: ['phone','mobile','smartphone','cellphone','ফোন','মোবাইল','সেলফোন','স্মার্টফোন'], related: ['COMPUTER','COMMUNICATION'], categories: ['tech'] },
  { id: 'COMPUTER',      aliases: ['laptop','computer','notebook','pc','ল্যাপটপ','কম্পিউটার'], related: ['MOBILE_DEVICE'], categories: ['tech'] },
  { id: 'VEHICLE',       aliases: ['car','automobile','vehicle','গাড়ি','গাড়ী','অটোমোবাইল'], related: ['TRANSPORT'], categories: ['transport'] },
  { id: 'TRANSPORT',     aliases: ['bus','train','বাস','ট্রেন','যানবাহন'], related: ['VEHICLE'] },
  { id: 'FOOD',          aliases: ['food','meal','খাবার','রান্না','recipe','dish'], related: ['RICE'], categories: ['food'] },
  { id: 'RICE',          aliases: ['rice','ভাত','চাল'], related: ['FOOD'], categories: ['food'] },
  { id: 'EDUCATION',     aliases: ['school','college','university','study','স্কুল','কলেজ','বিদ্যালয়','পড়া','শেখা'], related: ['BOOK'], categories: ['education'] },
  { id: 'BOOK',          aliases: ['book','বই','পাঠ্য'], related: ['EDUCATION'], categories: ['education'] },
  { id: 'GREETING',      aliases: ['hi','hello','hey','salam','সালাম','হাই','হ্যালো','নমস্কার','আদাব'], related: [] },
  { id: 'LOCATION_BD',   aliases: ['dhaka','ঢাকা','chittagong','চট্টগ্রাম','বাংলাদেশ','bangladesh'], related: [], categories: ['location'] },
];

export class ConceptEngine {
  private concepts = new Map<string, Concept>();
  private aliasIndex = new Map<string, string>(); // alias → conceptId

  constructor() { this.load(); this.reindex(); }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data: Concept[] = raw ? JSON.parse(raw) : DEFAULT_CONCEPTS;
      const ids = new Set(data.map(c => c.id));
      const merged = [...data, ...DEFAULT_CONCEPTS.filter(c => !ids.has(c.id))];
      merged.forEach(c => this.concepts.set(c.id, c));
    } catch {
      DEFAULT_CONCEPTS.forEach(c => this.concepts.set(c.id, c));
    }
  }

  private save() {
    try {
      const custom = [...this.concepts.values()]
        .filter(c => !DEFAULT_CONCEPTS.some(d => d.id === c.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    } catch { /* ignore */ }
  }

  private reindex() {
    this.aliasIndex.clear();
    for (const c of this.concepts.values()) {
      for (const a of c.aliases) this.aliasIndex.set(a.toLowerCase(), c.id);
    }
  }

  /** Find concept ids that any token belongs to */
  detect(tokens: string[]): string[] {
    const ids = new Set<string>();
    for (const t of tokens) {
      const id = this.aliasIndex.get(t.toLowerCase());
      if (id) ids.add(id);
    }
    return [...ids];
  }

  /** Expand tokens with sibling aliases of detected concepts */
  expand(tokens: string[], limit = 12): string[] {
    const out = new Set<string>();
    for (const id of this.detect(tokens)) {
      const c = this.concepts.get(id);
      if (!c) continue;
      for (const a of c.aliases) out.add(a.toLowerCase());
      for (const r of c.related) {
        const rc = this.concepts.get(r);
        if (rc) for (const a of rc.aliases.slice(0, 3)) out.add(a.toLowerCase());
      }
      if (out.size >= limit) break;
    }
    return [...out];
  }

  /** Concept-level similarity between two token sets (0..1) */
  similarity(aTokens: string[], bTokens: string[]): number {
    const a = new Set(this.detect(aTokens));
    const b = new Set(this.detect(bTokens));
    if (!a.size || !b.size) return 0;
    let inter = 0;
    for (const x of a) if (b.has(x)) inter++;
    return inter / Math.max(a.size, b.size);
  }

  getConcept(id: string) { return this.concepts.get(id); }
  list(): Concept[] { return [...this.concepts.values()]; }

  addConcept(c: Concept) {
    this.concepts.set(c.id, c);
    this.reindex();
    this.save();
  }
  removeConcept(id: string) {
    this.concepts.delete(id);
    this.reindex();
    this.save();
  }
}
