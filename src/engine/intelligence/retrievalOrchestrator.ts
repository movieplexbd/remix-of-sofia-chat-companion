/**
 * Phase 1 — Retrieval Orchestrator
 *
 * Combines all retrieval engines, calculates confidence scores,
 * dynamically adjusts engine weights, and ranks candidate responses.
 */

import { EngineName, getWeight, reinforce, penalize } from './adaptiveScoring';
import { RawCandidate, RankedResult, rank } from './rankingPipeline';
import { UnderstoodQuery } from './index';

export interface RetrievalMetrics {
  totalQueries: number;
  successRate: number;
  enginePerformance: Record<EngineName, number>;
}

export class RetrievalOrchestrator {
  private metrics: RetrievalMetrics = {
    totalQueries: 0,
    successRate: 0,
    enginePerformance: {} as Record<EngineName, number>
  };

  constructor() {
    this.loadMetrics();
  }

  private loadMetrics() {
    try {
      const saved = localStorage.getItem('sofia_retrieval_metrics');
      if (saved) this.metrics = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load retrieval metrics', e);
    }
  }

  private saveMetrics() {
    try {
      localStorage.setItem('sofia_retrieval_metrics', JSON.stringify(this.metrics));
    } catch (e) {
      console.error('Failed to save retrieval metrics', e);
    }
  }

  /**
   * Orchestrates the ranking process and calculates confidence
   */
  orchestrate(candidates: RawCandidate[], uq: UnderstoodQuery, context: any): RankedResult[] {
    this.metrics.totalQueries++;
    
    // 1. Initial Ranking using the existing pipeline
    const ranked = rank({
      candidates,
      currentTopic: context.currentTopic,
      topicTokens: context.topicTokens,
      expandedTokens: uq.expanded.all,
      exactTokens: uq.expanded.exact,
      graph: context.graph,
      allQueryTokens: uq.normalized.tokens,
    });

    // 2. Dynamic Weight Adjustment based on performance (simplified for Phase 1)
    // In a real scenario, this would look at recent success/failure
    
    this.saveMetrics();
    return ranked;
  }

  /**
   * Calculate confidence score for a result (0..1)
   */
  calculateConfidence(result: RankedResult): number {
    const baseScore = Math.min(1, result.finalScore / 10);
    const engineDiversity = result.engines.length / 3; // more engines = more confidence
    const feedbackBoost = result.breakdown.feedbackBoost;
    
    return Math.min(1, (baseScore * 0.5) + (engineDiversity * 0.3) + (feedbackBoost * 0.2));
  }

  /**
   * Track performance for future weight adjustments
   */
  trackPerformance(engine: EngineName, success: boolean) {
    if (success) {
      reinforce([engine] as any);
    } else {
      penalize([engine] as any);
    }
    
    const current = this.metrics.enginePerformance[engine] || 0.5;
    this.metrics.enginePerformance[engine] = success 
      ? Math.min(1, current + 0.05) 
      : Math.max(0, current - 0.05);
    
    this.saveMetrics();
  }
}
