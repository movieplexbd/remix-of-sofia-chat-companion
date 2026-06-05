/**
 * Phase 39 — Simulation Engine
 * Predict outcomes of different scenario parameters using a simple elasticity model.
 */
export interface Scenario {
  id: string;
  label: string;
  params: Record<string, number>;
}

export interface SimResult extends Scenario {
  predicted: number;
  impact: number;       // delta vs baseline
  rank: number;
}

export interface SimConfig {
  baseline: number;
  priceKey?: string;
  elasticity?: number;     // negative number, e.g. -1.2
  qualityKey?: string;
  qualityWeight?: number;
}

export function simulateScenario(s: Scenario, cfg: SimConfig): number {
  const { baseline, priceKey = 'price', elasticity = -1.0, qualityKey = 'quality', qualityWeight = 0.5 } = cfg;
  const price = s.params[priceKey];
  const quality = s.params[qualityKey] ?? 1;
  let predicted = baseline;
  if (typeof price === 'number' && price > 0) {
    predicted = baseline * Math.pow(price / (baseline ? 1 : 1), 0) * Math.pow(price, elasticity * 0.1);
  }
  predicted *= 1 + qualityWeight * (quality - 1);
  return Math.max(0, predicted);
}

export function compareOutcomes(scenarios: Scenario[], cfg: SimConfig): SimResult[] {
  const raw = scenarios.map(s => ({
    ...s,
    predicted: simulateScenario(s, cfg),
    impact: 0,
    rank: 0,
  }));
  raw.forEach(r => { r.impact = r.predicted - cfg.baseline; });
  return raw.sort((a, b) => b.predicted - a.predicted).map((r, i) => ({ ...r, rank: i + 1 }));
}

export function estimateImpact(predicted: number, baseline: number): number {
  if (!baseline) return 0;
  return (predicted - baseline) / baseline;
}
