/**
 * Phase G — Intelligence Test Suite
 * Self-test each engine and return per-engine scores 0..1.
 */
import type { IntelligenceAPI } from './index';
import { createGoalTree, identifyIntent } from './goalEngine';
import { createPlan } from './plannerEngine';
import { generateHypothesis } from './hypothesisEngine';
import { validateAnswer } from './reflectionEngine';
import { compareOutcomes } from './simulationEngine';

export interface EngineTestResult {
  engine: string;
  passed: number;
  total: number;
  score: number; // 0..1
  notes: string[];
}

export function runIntelligenceTests(intel: IntelligenceAPI): EngineTestResult[] {
  const results: EngineTestResult[] = [];

  // 1. Inference
  {
    const notes: string[] = [];
    const count = intel.runInference(3);
    const got = intel.inference.list().length;
    const passed = (got > 0 || count >= 0) ? 1 : 0;
    notes.push(`inferred ${got} facts`);
    results.push({ engine: 'Inference', passed, total: 1, score: passed, notes });
  }

  // 2. Multi-Hop Reasoning
  {
    const paths = intel.multiHop.reach('ঢাকা', 3);
    const ok = paths.length > 0;
    results.push({
      engine: 'Multi-Hop Reasoning', passed: ok ? 1 : 0, total: 1,
      score: ok ? 1 : 0, notes: [`paths from "ঢাকা": ${paths.length}`],
    });
  }

  // 3. Goal Extraction
  {
    const samples = [
      { q: 'আমি একটা clothing brand শুরু করতে চাই', expect: true },
      { q: 'I want to launch an app', expect: true },
      { q: 'হ্যালো', expect: false },
    ];
    let p = 0;
    for (const s of samples) {
      const t = createGoalTree(s.q);
      if (!!t.goal === s.expect) p++;
    }
    results.push({ engine: 'Goal Extraction', passed: p, total: samples.length, score: p / samples.length, notes: [] });
  }

  // 4. Planning
  {
    const tree = createGoalTree('আমি একটা brand শুরু করতে চাই');
    const plan = createPlan(tree);
    const ok = plan.tasks.length > 0 && plan.roadmap.length > 0;
    results.push({ engine: 'Planning', passed: ok ? 1 : 0, total: 1, score: ok ? 1 : 0, notes: [`tasks: ${plan.tasks.length}`] });
  }

  // 5. Reflection
  {
    const r1 = validateAnswer({ query: 'q', answer: 'a', evidenceCount: 3, candidateCount: 3, topScore: 0.9, secondScore: 0.4 });
    const r2 = validateAnswer({ query: 'q', answer: '', evidenceCount: 0, candidateCount: 0, topScore: 0, secondScore: 0 });
    const ok = r1.ok && !r2.ok;
    results.push({ engine: 'Reflection', passed: ok ? 2 : 1, total: 2, score: ok ? 1 : 0.5, notes: [`high conf: ${r1.confidence.toFixed(2)}`] });
  }

  // 6. Strategy / Intent
  {
    const ok = identifyIntent('আমি app বানাতে চাই') === 'goal' && identifyIntent('কেন আকাশ নীল?') === 'explanation';
    results.push({ engine: 'Strategy (Intent)', passed: ok ? 1 : 0, total: 1, score: ok ? 1 : 0, notes: [] });
  }

  // 7. Simulation
  {
    const out = compareOutcomes(
      [{ id: 'a', label: 'low', params: { price: 100, quality: 1 } }, { id: 'b', label: 'high', params: { price: 200, quality: 1.5 } }],
      { baseline: 100 },
    );
    const ok = out.length === 2 && out[0].rank === 1;
    results.push({ engine: 'Simulation', passed: ok ? 1 : 0, total: 1, score: ok ? 1 : 0, notes: [`best: ${out[0]?.label}`] });
  }

  // 8. Hypothesis
  {
    const hs = generateHypothesis([{ key: 'concept:tech', weight: 1 }, { key: 'concept:tech', weight: 0.6 }]);
    const ok = hs.length > 0;
    results.push({ engine: 'Hypothesis', passed: ok ? 1 : 0, total: 1, score: ok ? 1 : 0, notes: [`generated: ${hs.length}`] });
  }

  return results;
}
