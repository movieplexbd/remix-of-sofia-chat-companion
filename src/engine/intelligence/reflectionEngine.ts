/**
 * Phase 36 — Self Reflection Engine
 * Validate an answer before output: conflicts, evidence, confidence, ambiguity.
 */
export interface ReflectionReport {
  ok: boolean;
  confidence: number;
  issues: string[];
  warnings: string[];
}

export interface AnswerContext {
  query: string;
  answer: string;
  evidenceCount: number;
  candidateCount: number;
  topScore: number;
  secondScore: number;
  contradictions?: number;
}

export function validateAnswer(ctx: AnswerContext): ReflectionReport {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!ctx.answer || ctx.answer.trim().length < 2) issues.push('empty_answer');
  if (ctx.evidenceCount === 0) warnings.push('no_evidence');
  if (ctx.candidateCount === 0) issues.push('no_candidates');

  const conflict = detectConflict(ctx);
  if (conflict) warnings.push('answer_ambiguous');

  // Phase 27 — Self-Critique
  const critique = selfCritique(ctx.query, ctx.answer);
  if (critique.contradiction) issues.push('logical_contradiction');
  if (critique.hallucinationRisk) warnings.push('hallucination_risk');

  const confidence = estimateConfidence(ctx) * (critique.contradiction ? 0.3 : 1);
  if (confidence < 0.3) warnings.push('low_confidence');

  return {
    ok: issues.length === 0,
    confidence,
    issues,
    warnings,
  };
}

export function selfCritique(query: string, answer: string) {
  const qTokens = query.toLowerCase().split(/\s+/);
  const aTokens = answer.toLowerCase().split(/\s+/);
  
  // Simple negation check
  const negations = ['no', 'not', 'never', 'না', 'নি', 'নেই'];
  const qNeg = qTokens.some(t => negations.includes(t));
  const aNeg = aTokens.some(t => negations.includes(t));
  
  return {
    contradiction: qNeg !== aNeg && query.length > 10 && answer.length > 10 && Math.random() < 0.1, // Stub for complex logic
    hallucinationRisk: answer.includes('http') || answer.includes('www')
  };
}

export function detectConflict(ctx: AnswerContext): boolean {
  if (ctx.secondScore <= 0) return false;
  return (ctx.topScore - ctx.secondScore) / ctx.topScore < 0.1;
}

export function verifyEvidence(ctx: AnswerContext): boolean {
  return ctx.evidenceCount > 0 && ctx.topScore > 0.2;
}

export function estimateConfidence(ctx: AnswerContext): number {
  const evidenceFactor = Math.min(1, ctx.evidenceCount / 3);
  const scoreFactor    = Math.min(1, ctx.topScore);
  const conflictPenalty = detectConflict(ctx) ? 0.7 : 1;
  const contraPenalty   = ctx.contradictions ? Math.max(0.5, 1 - ctx.contradictions * 0.15) : 1;
  return Math.max(0, Math.min(1, evidenceFactor * 0.4 + scoreFactor * 0.6) * conflictPenalty * contraPenalty);
}
