/**
 * Phase 7 — Explanation Engine
 *
 * Generates human-readable "why this result matched" explanations
 * from the ranking breakdown. No ML, pure rule-based text generation.
 */

import type { RankedResult } from './rankingPipeline';
import type { ReasoningResult } from './reasoningEngine';

export interface ReasoningStep {
  thought: string;
  evidence?: string;
}

export interface Explanation {
  summary: string;          // One-line summary
  reasons: string[];        // Bullet-point reasons
  confidence: string;       // "নিশ্চিত" | "সম্ভবত" | "অনুমান"
  confidencePct: number;
  engineList: string[];     // Which engines matched
  reasoningChain: ReasoningStep[]; // Phase 25
}

const ENGINE_LABELS: Record<string, string> = {
  BM25:           'BM25 (keyword relevance)',
  BM25F:          'BM25F (field-weighted)',
  'TF-IDF':       'TF-IDF (document frequency)',
  'N-gram':       'N-gram (partial match)',
  Fuzzy:          'Fuzzy (typo tolerant)',
  Phonetic:       'Phonetic (sound match)',
  Jaccard:        'Jaccard (token overlap)',
  Substring:      'Substring (exact phrase)',
  Intent:         'Intent recognition',
  Math:           'Math solver',
  DateTime:       'Date & time handler',
};

const BN_ENGINE_LABELS: Record<string, string> = {
  BM25:           'BM25 কীওয়ার্ড মিল',
  BM25F:          'BM25F ফিল্ড-ওয়েটেড মিল',
  'TF-IDF':       'TF-IDF ডকুমেন্ট ফ্রিকোয়েন্সি',
  'N-gram':       'N-gram আংশিক মিল',
  Fuzzy:          'Fuzzy টাইপো সহনশীল',
  Phonetic:       'Phonetic শব্দ-উচ্চারণ মিল',
  Jaccard:        'Jaccard টোকেন ওভারল্যাপ',
  Substring:      'Substring সরাসরি বাক্যাংশ',
  Intent:         'Intent সনাক্তকরণ',
};

export function generateExplanation(
  result: RankedResult,
  reasoning?: ReasoningResult | null,
  lang: 'bn' | 'en' = 'bn',
): Explanation {
  const { breakdown, engines, finalScore } = result;
  const pct = Math.min(Math.round(finalScore), 99);
  const labels = lang === 'bn' ? BN_ENGINE_LABELS : ENGINE_LABELS;

  const reasons: string[] = [];

  // Engines that matched
  const uniqueEngines = [...new Set(engines)];
  if (uniqueEngines.length > 0) {
    const engineStr = uniqueEngines.map(e => labels[e] || e).join(', ');
    reasons.push(lang === 'bn'
      ? `🔍 এই engine গুলো match করেছে: ${engineStr}`
      : `🔍 Matched by: ${engineStr}`);
  }

  // Context boost
  if (breakdown.contextBoost > 1.1) {
    reasons.push(lang === 'bn'
      ? `🧠 আলোচনার বিষয়ের সাথে মিলেছে (Context boost: ×${breakdown.contextBoost.toFixed(1)})`
      : `🧠 Context match (×${breakdown.contextBoost.toFixed(1)})`);
  }

  // Synonym boost
  if (breakdown.synonymBoost > 1.05) {
    reasons.push(lang === 'bn'
      ? `🔗 Synonym expansion-এ মিলেছে (×${breakdown.synonymBoost.toFixed(2)})`
      : `🔗 Synonym expansion match (×${breakdown.synonymBoost.toFixed(2)})`);
  }

  // Knowledge graph boost
  if (breakdown.graphBoost > 1.1) {
    reasons.push(lang === 'bn'
      ? `🕸️ Knowledge Graph-এ সংযুক্ত entity পাওয়া গেছে`
      : `🕸️ Knowledge Graph entity relation found`);
  }

  // Feedback boost
  if (breakdown.feedbackBoost > 1.1) {
    reasons.push(lang === 'bn'
      ? `👍 ব্যবহারকারীরা আগে এটি পছন্দ করেছে (Feedback boost)`
      : `👍 Previously preferred by users`);
  }

  // Vote bonus
  if (breakdown.voteBonus > 1.2) {
    reasons.push(lang === 'bn'
      ? `🗳️ একাধিক engine একমত (${uniqueEngines.length}টি)`
      : `🗳️ ${uniqueEngines.length} engines agreed`);
  }

  // Reasoning conclusions
  if (reasoning?.explanation?.length) {
    reasoning.explanation.slice(0, 2).forEach(e => reasons.push(`⚡ Rule: ${e}`));
  }

  // Confidence level
  const confidencePct = pct;
  const confidence = lang === 'bn'
    ? (pct >= 70 ? 'নিশ্চিত' : pct >= 40 ? 'সম্ভবত' : 'অনুমান')
    : (pct >= 70 ? 'Confident' : pct >= 40 ? 'Probable' : 'Guess');

  const summary = lang === 'bn'
    ? `${confidencePct}% নিশ্চিততায় ${uniqueEngines.length}টি engine মিলেছে`
    : `${uniqueEngines.length} engine(s) matched with ${confidencePct}% confidence`;

  const reasoningChain: ReasoningStep[] = [];
  if (breakdown.base > 0) {
    reasoningChain.push({
      thought: lang === 'bn' ? 'প্রাথমিক সার্চ রেজাল্ট পাওয়া গেছে।' : 'Initial search results found.',
      evidence: `${uniqueEngines.join(', ')} engines`
    });
  }
  if (breakdown.contextBoost > 1.1) {
    reasoningChain.push({
      thought: lang === 'bn' ? 'বর্তমান আলোচনার বিষয়ের সাথে মিল পাওয়া গেছে।' : 'Matched current conversation topic.',
      evidence: `Boost: ${breakdown.contextBoost.toFixed(1)}`
    });
  }
  if (breakdown.graphBoost > 1.1) {
    reasoningChain.push({
      thought: lang === 'bn' ? 'নলেজ গ্রাফে প্রাসঙ্গিক সংযোগ পাওয়া গেছে।' : 'Relevant connections found in knowledge graph.',
      evidence: 'KG relation boost'
    });
  }

  return { summary, reasons, confidence, confidencePct, engineList: uniqueEngines, reasoningChain };
}

/** Format explanation as markdown text for chat display */
export function formatExplanationMd(exp: Explanation, lang: 'bn' | 'en' = 'bn'): string {
  const title = lang === 'bn' ? '**কেন এই উত্তর?**' : '**Why this result?**';
  return `${title}\n${exp.reasons.map(r => `- ${r}`).join('\n')}\n\n*${exp.summary}*`;
}
