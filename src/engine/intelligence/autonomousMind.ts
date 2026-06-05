/**
 * Sofia v6.5 — Autonomous Thinking Pipeline
 *
 * Orchestrates: Intent → Goal → Concept → KG → Inference → Hypothesis
 *               → Multi-Hop → Strategy → Simulation → Reflection → Meta-Cog
 *
 * Pure local. Returns a structured "mind trace" that callers can render or
 * blend into the answer.
 */
import { identifyIntent, createGoalTree, type GoalTree }      from './goalEngine';
import { createPlan, type Plan }                              from './plannerEngine';
import { generateHypothesis, type Hypothesis, type Signal }   from './hypothesisEngine';
import { generateStyleProfile, type StyleProfile }            from './emotionEngine';
import { validateAnswer, type ReflectionReport }              from './reflectionEngine';
import type { InferenceEngine }                               from './inferenceEngine';
import type { CuriosityEngine }                               from './curiosityEngine';
import type { ActiveLearningEngine }                          from './activeLearningEngine';
import type { MetaCognition }                                 from './metaCognition';
import type { ConceptEngine }                                 from './conceptEngine';
import type { MultiHopReasoner }                              from './multiHopReasoner';
import type { KnowledgeGraph }                                from './knowledgeGraph';

export interface MindTrace {
  intent: string;
  goalTree: GoalTree | null;
  plan: Plan | null;
  concepts: string[];
  style: StyleProfile;
  hypotheses: Hypothesis[];
  multiHopPaths: string[][];
  inferred: string[];
  clarification: string | null;
  reflection: ReflectionReport | null;
  weakDomains: string[];
}

export interface MindInput {
  query: string;
  tokens: string[];
  topScore: number;
  secondScore: number;
  candidateCount: number;
  answer: string;
  category?: string;
  contradictions?: number;
}

export interface MindDeps {
  graph: KnowledgeGraph;
  concepts: ConceptEngine;
  multiHop: MultiHopReasoner;
  inference: InferenceEngine;
  curiosity: CuriosityEngine;
  active: ActiveLearningEngine;
  meta: MetaCognition;
}

export function think(input: MindInput, deps: MindDeps): MindTrace {
  const intent = identifyIntent(input.query);
  const goalTree = intent === 'goal' || intent === 'plan' ? createGoalTree(input.query) : null;
  const plan = goalTree && goalTree.goal ? createPlan(goalTree) : null;

  const conceptIds = deps.concepts.detect(input.tokens);
  const style = generateStyleProfile(input.query);

  // Hypotheses from signals = concepts + matched category
  const signals: Signal[] = [
    ...conceptIds.map(c => ({ key: `concept:${c}`, weight: 1 })),
    ...(input.category ? [{ key: `cat:${input.category}`, weight: 0.8 }] : []),
  ];
  const hypotheses = generateHypothesis(signals).slice(0, 5);

  // Multi-hop traces (one per matched token, capped)
  const multiHopPaths: string[][] = [];
  for (const t of input.tokens.slice(0, 4)) {
    const paths = deps.multiHop.reach(t, 3).slice(0, 2);
    for (const p of paths) multiHopPaths.push(p.path);
    if (multiHopPaths.length >= 6) break;
  }

  // Inferences from any matched entity
  const inferred: string[] = [];
  for (const t of input.tokens) {
    const links = deps.inference.createIndirectLinks(t);
    if (links.length) inferred.push(...links.slice(0, 3));
    if (inferred.length >= 8) break;
  }

  // Reflection
  const reflection = validateAnswer({
    query: input.query,
    answer: input.answer,
    evidenceCount: input.candidateCount,
    candidateCount: input.candidateCount,
    topScore: input.topScore,
    secondScore: input.secondScore,
    contradictions: input.contradictions,
  });

  // Curiosity / active learning gating
  let clarification: string | null = null;
  if (reflection.confidence < 0.3 && input.query.length > 4) {
    const topic = input.tokens[0] || input.query.slice(0, 24);
    deps.curiosity.requestLearning(topic, 'bn');
    clarification = deps.active.askForClarification(topic, reflection.confidence, 'bn');
  }

  // Meta cognition update
  if (input.category) deps.meta.observe(input.category, reflection.confidence);
  const weakDomains = deps.meta.prioritizeLearning(3);

  return {
    intent,
    goalTree,
    plan,
    concepts: conceptIds,
    style,
    hypotheses,
    multiHopPaths,
    inferred: [...new Set(inferred)],
    clarification,
    reflection,
    weakDomains,
  };
}
