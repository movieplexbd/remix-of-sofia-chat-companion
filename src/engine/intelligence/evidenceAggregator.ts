/**
 * Phase 23 — Evidence Aggregator
 *
 * Collects per-result evidence from every signal source (engines, KG, concept,
 * ontology, reasoning, preference, popularity) into a single, explainable
 * structure that feeds the final re-ranker (Phase 24) and explanation
 * engine (Phase 25).
 */

import type { RankedResult } from './rankingPipeline';

export interface EvidenceItem {
  source: string;       // engine / KG / Concept / Ontology / Reasoning / Preference / Popularity
  signal: string;       // short label
  weight: number;       // contribution to final score
  detail?: string;
}

export interface AggregatedEvidence {
  resultKey: string;
  items: EvidenceItem[];
  totalWeight: number;
}

export function aggregate(
  result: RankedResult,
  extras: {
    conceptScore?: number;
    ontologyScore?: number;
    multiHop?: { boost: number; trace: string[] };
    topicBoost?: number;
    preference?: number;
    popularity?: number;
  } = {}
): AggregatedEvidence {
  const items: EvidenceItem[] = [];
  for (const e of new Set(result.engines)) {
    items.push({ source: 'Engine', signal: e, weight: 1 });
  }
  if (result.breakdown.contextBoost > 1.05) items.push({ source: 'Context', signal: 'topic-match', weight: result.breakdown.contextBoost - 1 });
  if (result.breakdown.synonymBoost > 1.02) items.push({ source: 'Synonym', signal: 'expansion-hit', weight: result.breakdown.synonymBoost - 1 });
  if (result.breakdown.graphBoost > 1.05) items.push({ source: 'KnowledgeGraph', signal: 'entity-link', weight: result.breakdown.graphBoost - 1 });
  if (result.breakdown.feedbackBoost > 1.05) items.push({ source: 'Feedback', signal: 'user-preferred', weight: result.breakdown.feedbackBoost - 1 });
  if (result.breakdown.voteBonus > 1.1) items.push({ source: 'Vote', signal: `${result.engines.length}-engines-agree`, weight: result.breakdown.voteBonus - 1 });

  if (extras.conceptScore && extras.conceptScore > 0) items.push({ source: 'Concept', signal: 'concept-overlap', weight: extras.conceptScore });
  if (extras.ontologyScore && extras.ontologyScore > 0) items.push({ source: 'Ontology', signal: 'category-ancestor', weight: extras.ontologyScore });
  if (extras.multiHop && extras.multiHop.boost > 1.01) items.push({ source: 'Reasoning', signal: 'multi-hop', weight: extras.multiHop.boost - 1, detail: extras.multiHop.trace.join(' → ') });
  if (extras.topicBoost && extras.topicBoost > 1.01) items.push({ source: 'Topic', signal: 'topic-match', weight: extras.topicBoost - 1 });
  if (extras.preference && extras.preference > 0) items.push({ source: 'Preference', signal: 'user-pref', weight: extras.preference });
  if (extras.popularity && extras.popularity > 0) items.push({ source: 'Popularity', signal: 'globally-popular', weight: extras.popularity });

  return {
    resultKey: result.item.firebaseKey,
    items,
    totalWeight: items.reduce((s, i) => s + i.weight, 0),
  };
}
