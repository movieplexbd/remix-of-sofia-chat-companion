/**
 * Phase 21 — Decision Engine
 * Analyzes Pros, Cons, and Risks of an answer or action.
 * Provides recommendations based on confidence scores.
 */

export interface Decision {
  pros: string[];
  cons: string[];
  risks: string[];
  confidence: number;
  recommendation: string;
}

export interface DecisionInput {
  query: string;
  answer: string;
  category?: string;
  confidence: number;
  evidenceCount: number;
}

export class DecisionEngine {
  analyze(input: DecisionInput): Decision {
    const pros: string[] = [];
    const cons: string[] = [];
    const risks: string[] = [];

    // Basic heuristic analysis
    if (input.evidenceCount > 2) {
      pros.push('Multiple evidence sources found');
    } else if (input.evidenceCount > 0) {
      pros.push('Supported by existing knowledge');
    }

    if (input.confidence > 0.8) {
      pros.push('High confidence in the information');
    } else if (input.confidence < 0.4) {
      cons.push('Low confidence score');
      risks.push('Information might be inaccurate or outdated');
    }

    if (input.evidenceCount === 0) {
      cons.push('No direct evidence found');
      risks.push('Generated response based on patterns rather than facts');
    }

    // Domain specific risks
    if (input.category === 'medical' || input.category === 'legal' || input.category === 'finance') {
      risks.push(`Sensitive domain (${input.category}): advice should be verified by a professional`);
    }

    const recommendation = this.generateRecommendation(input.confidence, risks);

    return {
      pros,
      cons,
      risks,
      confidence: input.confidence,
      recommendation
    };
  }

  private generateRecommendation(confidence: number, risks: string[]): string {
    if (confidence > 0.8 && risks.length === 0) {
      return 'Proceed with high confidence.';
    }
    if (confidence > 0.5) {
      return 'Proceed with caution. Verify key details.';
    }
    if (risks.some(r => r.includes('Sensitive domain'))) {
      return 'Consult a professional. Do not rely solely on this information.';
    }
    return 'Seek more information or clarification.';
  }
}
