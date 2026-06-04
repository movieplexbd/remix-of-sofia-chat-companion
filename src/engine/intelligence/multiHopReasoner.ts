/**
 * Phase 19 — Multi-Hop Reasoning Engine
 *
 * BFS over the KnowledgeGraph relations to answer
 * "A belongs to which X?" style questions by chaining 2..N hops.
 */

import type { KnowledgeGraph, KGNode } from './knowledgeGraph';

export interface HopPath {
  path: string[];          // entity names from start → target
  confidence: number;      // decays with depth
  targetCategories: string[];
}

export class MultiHopReasoner {
  constructor(private graph: KnowledgeGraph, private maxDepth = 4) {}

  /** Find all reachable entities & their categories from a starting token */
  reach(start: string, depth = this.maxDepth): HopPath[] {
    const startNode = this.graph.get(start);
    if (!startNode) return [];
    const out: HopPath[] = [];
    const seen = new Set<string>([start.toLowerCase()]);
    const queue: Array<{ name: string; path: string[]; d: number }> = [
      { name: start.toLowerCase(), path: [start.toLowerCase()], d: 0 },
    ];
    while (queue.length) {
      const { name, path, d } = queue.shift()!;
      if (d >= depth) continue;
      const node = this.graph.get(name);
      if (!node) continue;
      for (const rel of node.relations) {
        const k = rel.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        const next = this.graph.get(k);
        const newPath = [...path, k];
        const conf = Math.pow(0.75, newPath.length - 1);
        out.push({
          path: newPath,
          confidence: conf,
          targetCategories: next?.categories || [],
        });
        queue.push({ name: k, path: newPath, d: d + 1 });
      }
    }
    return out;
  }

  /** Boost a candidate category by best multi-hop path from any query token */
  multiHopBoost(queryTokens: string[], candidateCategory: string): { boost: number; trace: string[] } {
    if (!candidateCategory) return { boost: 1, trace: [] };
    const cat = candidateCategory.toLowerCase();
    let best = 0;
    let bestPath: string[] = [];
    for (const t of queryTokens) {
      const paths = this.reach(t, this.maxDepth);
      for (const p of paths) {
        if (p.targetCategories.map(c => c.toLowerCase()).includes(cat)) {
          if (p.confidence > best) { best = p.confidence; bestPath = p.path; }
        }
      }
    }
    return { boost: 1 + best * 0.4, trace: bestPath };
  }
}
