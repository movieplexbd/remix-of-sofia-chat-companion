/**
 * Phase 40 — Meta Cognition Engine
 * Sofia knows what it knows. Per-domain confidence + learning priorities.
 */
const STORAGE_KEY = 'sofia_metacog_v1';

export interface DomainKnowledge {
  domain: string;
  coverage: number;     // 0..1
  confidence: number;   // 0..1
  samples: number;
}

export class MetaCognition {
  private domains = new Map<string, DomainKnowledge>();
  constructor() { this.load(); }

  private load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      for (const d of raw) this.domains.set(d.domain, d);
    } catch { /*ignore*/ }
  }
  private save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.domains.values()])); } catch {/*ignore*/}
  }

  /** Record an interaction for a domain (success score 0..1) */
  observe(domain: string, success: number) {
    if (!domain) return;
    const d = this.domains.get(domain) || { domain, coverage: 0, confidence: 0, samples: 0 };
    d.samples += 1;
    d.confidence = (d.confidence * (d.samples - 1) + success) / d.samples;
    d.coverage = Math.min(1, d.coverage + 0.02);
    this.domains.set(domain, d);
    this.save();
  }

  evaluateKnowledge(): DomainKnowledge[] {
    return [...this.domains.values()].sort((a, b) => b.confidence - a.confidence);
  }

  detectWeakAreas(threshold = 0.5): DomainKnowledge[] {
    return [...this.domains.values()]
      .filter(d => d.confidence < threshold)
      .sort((a, b) => a.confidence - b.confidence);
  }

  prioritizeLearning(top = 5): string[] {
    return this.detectWeakAreas().slice(0, top).map(d => d.domain);
  }

  clear() { this.domains.clear(); this.save(); }
}
