/**
 * Phase 12 — Semantic Memory
 *
 * Store structured knowledge separately from episodic memory.
 * Allow concept-based retrieval.
 */

export interface SemanticFact {
  conceptId: string;
  property: string;
  value: any;
  confidence: number;
  lastUpdated: number;
}

export class SemanticMemory {
  private facts = new Map<string, SemanticFact[]>();
  private readonly STORAGE_KEY = 'sofia_semantic_memory_v1';

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data: [string, SemanticFact[]][] = JSON.parse(saved);
        this.facts = new Map(data);
      }
    } catch (e) {
      console.error('Failed to load semantic memory', e);
    }
  }

  private save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...this.facts.entries()]));
    } catch (e) {
      console.error('Failed to save semantic memory', e);
    }
  }

  storeFact(fact: Omit<SemanticFact, 'lastUpdated'>) {
    const conceptFacts = this.facts.get(fact.conceptId) || [];
    const existingIndex = conceptFacts.findIndex(f => f.property === fact.property);
    
    const newFact = { ...fact, lastUpdated: Date.now() };
    if (existingIndex >= 0) {
      conceptFacts[existingIndex] = newFact;
    } else {
      conceptFacts.push(newFact);
    }
    
    this.facts.set(fact.conceptId, conceptFacts);
    this.save();
  }

  getFacts(conceptId: string): SemanticFact[] {
    return this.facts.get(conceptId) || [];
  }

  query(conceptId: string, property: string): SemanticFact | undefined {
    return this.facts.get(conceptId)?.find(f => f.property === property);
  }
}
