/**
 * Phase 11 — Automatic Knowledge Building
 *
 * Extracts entities and relationships from user queries, answers,
 * and documents automatically. Updates the Knowledge Graph.
 * Pure rule-based NLP, no external libraries.
 */

import type { KnowledgeGraph } from './knowledgeGraph';

// Bangla entity patterns
const ENTITY_PATTERNS = [
  // Named entity patterns
  { re: /([A-Z][a-z]+ [A-Z][a-z]+)/g, type: 'person', lang: 'en' },
  // Cities/places (common Bangladesh + world)
  { re: /\b(ঢাকা|চট্টগ্রাম|সিলেট|রাজশাহী|খুলনা|বরিশাল|ময়মনসিংহ|রংপুর|Dhaka|Chittagong|Sylhet)\b/g, type: 'location', lang: 'bn' },
  // Bangla numbers + units
  { re: /(\d+)\s*(টাকা|হাজার|লাখ|কোটি|kg|km|cm|ml|গ্রাম)/g, type: 'quantity', lang: 'bn' },
  // Tech products
  { re: /\b(iPhone|Samsung|Xiaomi|OnePlus|Nokia|Oppo|Vivo|Realme|Motorola)\b/gi, type: 'product', lang: 'en' },
];

const RELATION_PATTERNS = [
  // X is the capital of Y
  { re: /(\S+)\s+(?:হলো|হল|হচ্ছে|আছে|থাকে)\s+(\S+)\s*(?:এর|র)\s+রাজধানী/g, rel: 'capital_of' },
  { re: /(\S+)\s+is\s+(?:the\s+)?capital\s+of\s+(\S+)/gi, rel: 'capital_of' },
  // X is a type of Y
  { re: /(\S+)\s+(?:একটি|একটা|হলো)\s+(\S+)/g, rel: 'is_a' },
  { re: /(\S+)\s+is\s+a\s+(?:type\s+of\s+)?(\S+)/gi, rel: 'is_a' },
];

export interface ExtractedKnowledge {
  entities: Array<{ name: string; type: string }>;
  relations: Array<{ from: string; to: string; rel: string }>;
}

/** Extract entities and relations from text */
export function extractKnowledge(text: string): ExtractedKnowledge {
  const entities: ExtractedKnowledge['entities'] = [];
  const relations: ExtractedKnowledge['relations'] = [];
  const seen = new Set<string>();

  // Entity extraction
  for (const pat of ENTITY_PATTERNS) {
    const matches = text.matchAll(pat.re);
    for (const m of matches) {
      const name = m[1].trim();
      if (name.length > 1 && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        entities.push({ name, type: pat.type });
      }
    }
  }

  // Relation extraction
  for (const pat of RELATION_PATTERNS) {
    const matches = text.matchAll(pat.re);
    for (const m of matches) {
      if (m[1] && m[2]) {
        relations.push({ from: m[1].trim(), to: m[2].trim(), rel: pat.rel });
      }
    }
  }

  return { entities, relations };
}

/** Automatically update the knowledge graph from text */
export function buildKnowledgeFromText(text: string, graph: KnowledgeGraph): ExtractedKnowledge {
  const extracted = extractKnowledge(text);

  // Add entities
  for (const e of extracted.entities) {
    graph.addEntity(e.name, [e.type], []);
  }

  // Add relations (bidirectional)
  for (const r of extracted.relations) {
    graph.addEntity(r.from, [], [r.to]);
    graph.addRelation(r.from, r.to);
  }

  return extracted;
}

/** Build knowledge from a Q&A item */
export function buildFromQA(question: string, answer: string, graph: KnowledgeGraph) {
  const combined = `${question} ${answer}`;
  return buildKnowledgeFromText(combined, graph);
}

/** Batch process multiple QA items */
export function buildFromQABatch(
  items: Array<{ originalQuestions: string[]; answer: string }>,
  graph: KnowledgeGraph,
  maxItems = 50,
) {
  let processed = 0;
  for (const item of items.slice(0, maxItems)) {
    const q = (item.originalQuestions || [])[0] || '';
    buildFromQA(q, item.answer, graph);
    processed++;
  }
  return processed;
}
