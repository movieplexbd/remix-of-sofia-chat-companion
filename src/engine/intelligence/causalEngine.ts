/**
 * Phase 8 — Causal Reasoning Engine
 * 
 * Tracks Cause -> Effect relationships to allow causal chain inference.
 */

export interface CausalLink {
  cause: string;
  effect: string;
  confidence: number;
  mechanism?: string;
}

export class CausalEngine {
  private links: CausalLink[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem('sofia_causal_links');
      if (raw) this.links = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load causal links', e);
    }
  }

  private save() {
    localStorage.setItem('sofia_causal_links', JSON.stringify(this.links));
  }

  addLink(cause: string, effect: string, confidence: number = 0.8, mechanism?: string) {
    this.links.push({ 
      cause: cause.toLowerCase(), 
      effect: effect.toLowerCase(), 
      confidence, 
      mechanism 
    });
    this.save();
  }

  /**
   * Infer effects from a given cause
   */
  getEffects(cause: string): CausalLink[] {
    return this.links.filter(l => l.cause === cause.toLowerCase());
  }

  /**
   * Infer causes for a given effect
   */
  getCauses(effect: string): CausalLink[] {
    return this.links.filter(l => l.effect === effect.toLowerCase());
  }

  /**
   * Trace a causal chain: A -> B -> C
   */
  traceChain(startNode: string, depth: number = 3): string[][] {
    const chains: string[][] = [];
    
    const find = (current: string, path: string[], currentDepth: number) => {
      if (currentDepth >= depth) return;
      const effects = this.getEffects(current);
      if (effects.length === 0) {
        if (path.length > 1) chains.push([...path]);
        return;
      }
      
      effects.forEach(e => {
        if (!path.includes(e.effect)) {
          find(e.effect, [...path, e.effect], currentDepth + 1);
        }
      });
    };

    find(startNode.toLowerCase(), [startNode.toLowerCase()], 0);
    return chains;
  }

  list(): CausalLink[] {
    return this.links;
  }
}
