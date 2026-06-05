/**
 * Sofia Intelligence Layer v5 — public facade
 *
 * Existing phases preserved (1–15). New v5 phases added:
 *  Phase 17 — Semantic Concept Engine     (conceptEngine.ts)
 *  Phase 18 — Hierarchical Ontology       (ontology.ts)
 *  Phase 19 — Multi-Hop Reasoning         (multiHopReasoner.ts)
 *  Phase 20 — Topic Detection             (topicDetector.ts)
 *  Phase 21 — Fact Extraction             (knowledgeBuilder.ts, extended)
 *  Phase 22 — Contradiction Detector      (contradictionDetector.ts)
 *  Phase 23 — Evidence Aggregator         (evidenceAggregator.ts)
 *  Phase 24 — Intelligent Re-Ranking      (rankCandidates here)
 *  Phase 25 — Explainable Intelligence    (explain + evidence)
 *
 * Backward compatible: all earlier exports and the createIntelligence()
 * return shape are preserved — new fields are additive.
 */

import { detectIntent, type QueryMeta }           from './queryUnderstanding';
import { normalize, type NormalizeResult }         from './normalizer';
import { expandWithSynonyms, type ExpandedQuery }  from './synonymEngine';
import { buildDefaultGraph, KnowledgeGraph }       from './knowledgeGraph';
import { ContextMemory }                           from './contextMemory';
import { rank, type RawCandidate, type RankedResult } from './rankingPipeline';
import { reinforce, penalize, getAllWeights, resetWeights } from './adaptiveScoring';
import { recordEvent, feedbackBoost, topClicked, topQueries, clearFeedback, snapshot } from './feedbackLearning';
import { LRUCache }                                from './lruCache';
import { ReasoningEngine, type ReasoningResult }   from './reasoningEngine';
import { generateExplanation, type Explanation }   from './explanationEngine';
import { getSuggestions, recordQuery, getTrending, clearSuggestions, getSuggestionStats } from './suggestions';
import { buildKnowledgeFromText, buildFromQABatch } from './knowledgeBuilder';

// v5 additions
import { ConceptEngine }                from './conceptEngine';
import { Ontology }                     from './ontology';
import { MultiHopReasoner }             from './multiHopReasoner';
import { detectTopics, topicBoost, type TopicHit } from './topicDetector';
import { ContradictionStore }           from './contradictionDetector';
import { aggregate, type AggregatedEvidence } from './evidenceAggregator';

// v6.5 additions — Autonomous Mind
import { InferenceEngine }              from './inferenceEngine';
import { ActiveLearningEngine }         from './activeLearningEngine';
import { CuriosityEngine }              from './curiosityEngine';
import { MetaCognition }                from './metaCognition';
import { think, type MindTrace, type MindInput } from './autonomousMind';

export interface UnderstoodQuery {
  raw: string;
  meta: QueryMeta;
  normalized: NormalizeResult;
  expanded: ExpandedQuery;
  contextualText: string;
  reasoning: ReasoningResult;
  concepts: string[];        // detected concept ids (Phase 17)
  topics: TopicHit[];        // detected topics  (Phase 20)
  conceptExpansion: string[];// extra tokens added from concept aliases
}

export interface IntelligenceAPI {
  // Core
  understand: (text: string) => UnderstoodQuery;
  rankCandidates: (candidates: RawCandidate[], uq: UnderstoodQuery) => RankedResult[];
  explain: (result: RankedResult, uq: UnderstoodQuery, lang?: 'bn' | 'en') => Explanation;
  evidenceFor: (result: RankedResult, uq: UnderstoodQuery) => AggregatedEvidence;

  // Memory hooks
  recordTurn: (q: string, a: string, category: string, topicTokens: string[]) => void;

  // Feedback hooks
  recordShown:   (q: string, key: string | null) => void;
  recordClick:   (q: string, key: string | null, engines: string[]) => void;
  recordIgnore:  (q: string, key: string | null, engines: string[]) => void;

  // Suggestions
  getSuggestions: (prefix: string, allQA: Array<{ originalQuestions: string[] }>, limit?: number) => string[];
  getTrending: (limit?: number) => string[];
  recordQuery: (query: string) => void;

  // Knowledge / fact building
  buildKnowledge: (text: string) => void;
  buildFromQABatch: (items: Array<{ originalQuestions: string[]; answer: string }>, max?: number) => number;
  addFact: (entity: string, attribute: string, value: string, source?: string, confidence?: number) => void;

  // Cache
  cacheGet: (q: string) => RankedResult[] | undefined;
  cacheSet: (q: string, results: RankedResult[]) => void;
  clearCaches: () => void;

  // Diagnostics
  getDiagnostics: () => {
    weights: ReturnType<typeof getAllWeights>;
    memory: ReturnType<ContextMemory['snapshot']> & { usage: number };
    feedback: { topQueries: ReturnType<typeof topQueries>; topClicked: ReturnType<typeof topClicked>; full: ReturnType<typeof snapshot> };
    cache: { result: ReturnType<LRUCache<string, unknown>['stats']>; query: ReturnType<LRUCache<string, unknown>['stats']> };
    graphSize: number;
    graph: ReturnType<KnowledgeGraph['serialize']>;
    suggestions: ReturnType<typeof getSuggestionStats>;
    rules: ReturnType<ReasoningEngine['getRules']>;
    concepts: ReturnType<ConceptEngine['list']>;
    ontology: ReturnType<Ontology['list']>;
    facts: ReturnType<ContradictionStore['list']>;
    conflicts: ReturnType<ContradictionStore['conflicts']>;
  };
  resetLearning: () => void;

  // Sub-systems (direct access for admin tools)
  graph: KnowledgeGraph;
  memory: ContextMemory;
  reasoning: ReasoningEngine;
  concepts: ConceptEngine;
  ontology: Ontology;
  multiHop: MultiHopReasoner;
  facts: ContradictionStore;
}

export function createIntelligence(userSyn: Record<string, string[]> = {}): IntelligenceAPI {
  const graph    = buildDefaultGraph();
  const memory   = new ContextMemory();
  const reasoner = new ReasoningEngine();
  const concepts = new ConceptEngine();
  const ontology = new Ontology();
  const multiHop = new MultiHopReasoner(graph);
  const facts    = new ContradictionStore();
  const resultCache = new LRUCache<string, RankedResult[]>(80, 'results');
  const queryCache  = new LRUCache<string, UnderstoodQuery>(120, 'queries');

  function understand(text: string): UnderstoodQuery {
    const cached = queryCache.get(text);
    if (cached) return cached;

    const meta = detectIntent(text);
    const norm = normalize(text);
    const isFollowUp = meta.intent === 'followup' || norm.tokens.length <= 2;
    const contextualText = memory.resolveFollowUp(text, isFollowUp);
    const finalNorm = contextualText !== text ? normalize(contextualText) : norm;

    // Synonym + Concept expansion (Phase 3 + 17)
    const expanded = expandWithSynonyms(finalNorm.tokens, userSyn);
    const conceptIds = concepts.detect(finalNorm.tokens);
    const conceptExpansion = concepts.expand(finalNorm.tokens, 12)
      .filter(t => !expanded.all.includes(t));
    if (conceptExpansion.length) {
      expanded.expanded.push(...conceptExpansion);
      expanded.all = [...new Set([...expanded.all, ...conceptExpansion])];
    }

    // Reasoning + Topic detection
    const reasoning = reasoner.reason({
      query: text, intent: meta.intent, language: meta.language, tokens: norm.tokens,
    });
    const topics = detectTopics(text);

    const uq: UnderstoodQuery = {
      raw: text, meta, normalized: finalNorm, expanded, contextualText,
      reasoning, concepts: conceptIds, topics, conceptExpansion,
    };
    queryCache.set(text, uq);
    return uq;
  }

  function rankCandidates(candidates: RawCandidate[], uq: UnderstoodQuery): RankedResult[] {
    const ranked = rank({
      candidates,
      currentTopic: memory.getCurrentTopic(),
      topicTokens: memory.getTopicTokens(),
      expandedTokens: uq.expanded.all,
      exactTokens: uq.expanded.exact,
      graph,
      allQueryTokens: uq.normalized.tokens,
    });

    // Phase 24 — Intelligent Re-Ranking: layer concept/ontology/multi-hop/topic/reasoning
    return ranked.map(r => {
      const cat = r.item.category || '';
      const candidateTokens = [
        ...(r.item.processedQuestions || []).join(' ').split(/\s+/),
        ...(r.item.tags || []),
        cat,
      ].filter(Boolean);

      const conceptSim = concepts.similarity(uq.normalized.tokens, candidateTokens);
      const ontoScore  = ontology.ontologyScore(uq.normalized.tokens, cat);
      const multi      = multiHop.multiHopBoost(uq.normalized.tokens, cat);
      const tBoost     = topicBoost(uq.topics, cat);
      const ruleBoost  = reasoner.getCategoryBoost(uq.reasoning.conclusions, cat);

      const finalScore =
        r.finalScore *
        (1 + conceptSim * 0.3) *
        (1 + ontoScore * 0.25) *
        multi.boost *
        tBoost *
        ruleBoost;

      return { ...r, finalScore };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }

  function evidenceFor(result: RankedResult, uq: UnderstoodQuery): AggregatedEvidence {
    const cat = result.item.category || '';
    const candidateTokens = [
      ...(result.item.processedQuestions || []).join(' ').split(/\s+/),
      ...(result.item.tags || []), cat,
    ].filter(Boolean);
    return aggregate(result, {
      conceptScore: concepts.similarity(uq.normalized.tokens, candidateTokens),
      ontologyScore: ontology.ontologyScore(uq.normalized.tokens, cat),
      multiHop: multiHop.multiHopBoost(uq.normalized.tokens, cat),
      topicBoost: topicBoost(uq.topics, cat),
    });
  }

  function explain(result: RankedResult, uq: UnderstoodQuery, lang: 'bn' | 'en' = 'bn'): Explanation {
    const base = generateExplanation(result, uq.reasoning, lang);
    // Phase 25 enrichment — concept / ontology / multi-hop reasons
    const ev = evidenceFor(result, uq);
    for (const i of ev.items) {
      if (i.source === 'Concept' && i.weight > 0.1) {
        base.reasons.push(lang === 'bn' ? `🧩 Concept মিল (${(i.weight*100|0)}%)` : `🧩 Concept overlap (${(i.weight*100|0)}%)`);
      } else if (i.source === 'Ontology' && i.weight > 0.1) {
        base.reasons.push(lang === 'bn' ? `📚 Ontology category মিল` : `📚 Ontology category match`);
      } else if (i.source === 'Reasoning' && i.detail) {
        base.reasons.push(lang === 'bn' ? `🔗 Multi-hop: ${i.detail}` : `🔗 Multi-hop path: ${i.detail}`);
      } else if (i.source === 'Topic' && i.weight > 0.05) {
        base.reasons.push(lang === 'bn' ? `🏷️ Topic বুস্ট` : `🏷️ Topic boost`);
      }
    }
    return base;
  }

  function recordTurn(q: string, a: string, category: string, topicTokens: string[]) {
    memory.pushTurn({ q, a, category, topicTokens, ts: Date.now() });
  }

  function recordShown(q: string, key: string | null) {
    if (key) recordEvent({ query: q, resultKey: key, kind: 'shown' });
  }
  function recordClick(q: string, key: string | null, engines: string[]) {
    if (key) recordEvent({ query: q, resultKey: key, kind: 'clicked' });
    reinforce(engines as never);
  }
  function recordIgnore(q: string, key: string | null, engines: string[]) {
    if (key) recordEvent({ query: q, resultKey: key, kind: 'ignored' });
    penalize(engines as never);
  }

  return {
    understand, rankCandidates, explain, evidenceFor,
    recordTurn, recordShown, recordClick, recordIgnore,

    getSuggestions: (prefix, allQA, limit) => getSuggestions(prefix, allQA, limit),
    getTrending,
    recordQuery,

    buildKnowledge: (text) => buildKnowledgeFromText(text, graph),
    buildFromQABatch: (items, max = 50) => buildFromQABatch(items, graph, max),
    addFact: (entity, attribute, value, source = 'manual', confidence = 0.8) => {
      facts.add({ entity, attribute, value, source, confidence });
    },

    cacheGet: (q) => resultCache.get(q),
    cacheSet: (q, r) => resultCache.set(q, r),
    clearCaches: () => { resultCache.clear(); queryCache.clear(); },

    getDiagnostics: () => ({
      weights: getAllWeights(),
      memory: {
        ...memory.snapshot(),
        usage: JSON.stringify(memory.snapshot()).length + JSON.stringify(graph.serialize()).length,
      },
      feedback: { topQueries: topQueries(20), topClicked: topClicked(20), full: snapshot() },
      cache: { result: resultCache.stats(), query: queryCache.stats() },
      graphSize: graph.size(),
      graph: graph.serialize(),
      suggestions: getSuggestionStats(),
      rules: reasoner.getRules(),
      concepts: concepts.list(),
      ontology: ontology.list(),
      facts: facts.list(),
      conflicts: facts.conflicts(),
    }),
    resetLearning: () => {
      resetWeights(); clearFeedback(); memory.clear();
      resultCache.clear(); queryCache.clear(); clearSuggestions();
    },

    graph, memory, reasoning: reasoner,
    concepts, ontology, multiHop, facts,
  };
}

export type { RawCandidate, RankedResult } from './rankingPipeline';
export type { EngineName } from './adaptiveScoring';
export type { AggregatedEvidence, EvidenceItem } from './evidenceAggregator';
export type { TopicHit } from './topicDetector';
