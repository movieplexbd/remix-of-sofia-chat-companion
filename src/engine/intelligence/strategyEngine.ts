/**
 * Phase 38 — Strategy Engine
 * Compare options across cost / value / risk to recommend best path.
 */
export interface Option {
  id: string;
  name: string;
  cost: number;       // arbitrary unit, lower better
  value: number;      // higher better
  risk: number;       // 0..1, lower better
  effort?: number;    // 0..1
}

export interface RankedOption extends Option {
  roi: number;
  score: number;
  reasons: string[];
}

export function compareOptions(opts: Option[]): RankedOption[] {
  return opts
    .map(o => {
      const roi = calculateROI(o);
      const risk = evaluateRisk(o);
      const score = roi * (1 - risk * 0.6) - (o.effort || 0) * 0.2;
      const reasons: string[] = [];
      if (roi > 1.5) reasons.push('High ROI');
      if (risk < 0.3) reasons.push('Low risk');
      if (o.cost === 0) reasons.push('Free');
      return { ...o, roi, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export function calculateROI(o: Option): number {
  if (o.cost <= 0) return o.value * 1.5;
  return o.value / o.cost;
}

export function evaluateRisk(o: Option): number {
  return Math.max(0, Math.min(1, o.risk));
}

export function recommendStrategy(opts: Option[]): RankedOption | null {
  const ranked = compareOptions(opts);
  return ranked[0] || null;
}
