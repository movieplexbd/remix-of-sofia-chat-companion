/**
 * Phase 33 — Hypothesis Engine
 * From observed signals, predict probable conclusions with confidence.
 */
export interface Hypothesis {
  statement: string;
  probability: number;   // 0..1
  evidence: string[];
}

export interface Signal { key: string; weight: number; }

export function generateHypothesis(signals: Signal[], domainHints: Record<string, string[]> = {}): Hypothesis[] {
  if (!signals.length) return [];
  const out: Hypothesis[] = [];
  const groups: Record<string, Signal[]> = {};
  for (const s of signals) {
    const k = s.key.split(':')[0] || s.key;
    (groups[k] ||= []).push(s);
  }
  for (const [k, list] of Object.entries(groups)) {
    const sum = list.reduce((a, b) => a + b.weight, 0);
    const evidence = list.map(l => l.key);
    const related = domainHints[k] || [];
    if (related.length) {
      for (const r of related) {
        out.push({
          statement: `User likely interested in "${r}" (signal: ${k})`,
          probability: calculateProbability(sum, list.length),
          evidence,
        });
      }
    } else {
      out.push({
        statement: `User shows interest pattern around "${k}"`,
        probability: calculateProbability(sum, list.length),
        evidence,
      });
    }
  }
  return rankHypotheses(out);
}

export function calculateProbability(sumWeight: number, count: number): number {
  // logistic squash
  const x = sumWeight + count * 0.3;
  return 1 / (1 + Math.exp(-0.6 * (x - 1.5)));
}

export function rankHypotheses(hs: Hypothesis[]): Hypothesis[] {
  return [...hs].sort((a, b) => b.probability - a.probability);
}
