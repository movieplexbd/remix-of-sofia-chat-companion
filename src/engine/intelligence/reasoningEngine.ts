/**
 * Phase 4 — Rule-Based Reasoning Engine
 *
 * IF/THEN inference with chained reasoning and confidence scoring.
 * No ML, no external APIs. Pure deterministic rule evaluation.
 */

const STORAGE_KEY = 'sofia_rules_v1';

export type FactOp = 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'exists';

export interface RuleCondition {
  fact: string;   // e.g. "query", "intent", "category", "language"
  op: FactOp;
  value: string;
}

export interface Rule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  logic: 'AND' | 'OR';
  conclusion: string;     // e.g. "boost:tech", "filter:greeting", "expand:phone"
  confidence: number;     // 0-1
  priority: number;       // higher = checked first
}

export interface ReasoningContext {
  query: string;
  intent: string;
  language: string;
  category?: string;
  tokens: string[];
}

export interface ReasoningResult {
  fired: Rule[];
  conclusions: string[];
  confidence: number;
  explanation: string[];
}

/** Built-in rules for Sofia */
const DEFAULT_RULES: Rule[] = [
  {
    id: 'r001', name: 'Tech Query Boost', priority: 10, logic: 'OR', confidence: 0.85,
    conditions: [
      { fact: 'query', op: 'contains', value: 'phone' },
      { fact: 'query', op: 'contains', value: 'laptop' },
      { fact: 'query', op: 'contains', value: 'ফোন' },
      { fact: 'query', op: 'contains', value: 'মোবাইল' },
    ],
    conclusion: 'boost_category:tech',
  },
  {
    id: 'r002', name: 'Greeting Short-circuit', priority: 20, logic: 'AND', confidence: 0.95,
    conditions: [{ fact: 'intent', op: 'equals', value: 'greeting' }],
    conclusion: 'use_intent:greeting',
  },
  {
    id: 'r003', name: 'Price Range Detection', priority: 8, logic: 'OR', confidence: 0.8,
    conditions: [
      { fact: 'query', op: 'contains', value: 'টাকা' },
      { fact: 'query', op: 'contains', value: 'taka' },
      { fact: 'query', op: 'contains', value: 'budget' },
      { fact: 'query', op: 'contains', value: 'দামে' },
    ],
    conclusion: 'boost_category:commerce',
  },
  {
    id: 'r004', name: 'Tutorial Expand', priority: 7, logic: 'AND', confidence: 0.75,
    conditions: [{ fact: 'intent', op: 'equals', value: 'tutorial' }],
    conclusion: 'expand_synonyms:how_to',
  },
  {
    id: 'r005', name: 'Education Boost', priority: 6, logic: 'OR', confidence: 0.7,
    conditions: [
      { fact: 'query', op: 'contains', value: 'স্কুল' },
      { fact: 'query', op: 'contains', value: 'পড়া' },
      { fact: 'query', op: 'contains', value: 'শেখা' },
      { fact: 'query', op: 'contains', value: 'study' },
    ],
    conclusion: 'boost_category:education',
  },
  {
    id: 'r006', name: 'Bangla Priority', priority: 5, logic: 'AND', confidence: 0.6,
    conditions: [{ fact: 'language', op: 'equals', value: 'bn' }],
    conclusion: 'boost_lang:bn',
  },
  {
    id: 'r007', name: 'Comparison Query', priority: 9, logic: 'AND', confidence: 0.8,
    conditions: [{ fact: 'intent', op: 'equals', value: 'comparison' }],
    conclusion: 'multi_result:true',
  },
  {
    id: 'r008', name: 'Food Query', priority: 5, logic: 'OR', confidence: 0.65,
    conditions: [
      { fact: 'query', op: 'contains', value: 'রান্না' },
      { fact: 'query', op: 'contains', value: 'খাবার' },
      { fact: 'query', op: 'contains', value: 'recipe' },
      { fact: 'query', op: 'contains', value: 'food' },
    ],
    conclusion: 'boost_category:food',
  },
];

function evalCondition(cond: RuleCondition, ctx: ReasoningContext): boolean {
  const haystack = cond.fact === 'query' ? ctx.query.toLowerCase()
    : cond.fact === 'intent' ? ctx.intent
    : cond.fact === 'language' ? ctx.language
    : cond.fact === 'category' ? (ctx.category || '')
    : ctx.query.toLowerCase();

  switch (cond.op) {
    case 'contains':    return haystack.includes(cond.value.toLowerCase());
    case 'equals':      return haystack === cond.value.toLowerCase();
    case 'starts_with': return haystack.startsWith(cond.value.toLowerCase());
    case 'ends_with':   return haystack.endsWith(cond.value.toLowerCase());
    case 'exists':      return haystack.length > 0;
    default:            return false;
  }
}

export class ReasoningEngine {
  private rules: Rule[];

  constructor() {
    this.rules = this.loadRules();
  }

  private loadRules(): Rule[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: Rule[] = JSON.parse(raw);
        // Merge: saved custom rules + defaults (avoid duplicates by id)
        const savedIds = new Set(saved.map(r => r.id));
        const merged = [...saved, ...DEFAULT_RULES.filter(r => !savedIds.has(r.id))];
        return merged.sort((a, b) => b.priority - a.priority);
      }
    } catch { /* ignore */ }
    return [...DEFAULT_RULES].sort((a, b) => b.priority - a.priority);
  }

  private saveRules() {
    try {
      const custom = this.rules.filter(r => !DEFAULT_RULES.some(d => d.id === r.id));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    } catch { /* ignore */ }
  }

  addRule(rule: Omit<Rule, 'id'>): Rule {
    const newRule: Rule = { ...rule, id: `custom_${Date.now()}` };
    this.rules = [newRule, ...this.rules].sort((a, b) => b.priority - a.priority);
    this.saveRules();
    return newRule;
  }

  removeRule(id: string) {
    this.rules = this.rules.filter(r => r.id !== id);
    this.saveRules();
  }

  getRules(): Rule[] { return this.rules; }

  /** Run inference against context. Returns fired rules + conclusions */
  reason(ctx: ReasoningContext): ReasoningResult {
    const fired: Rule[] = [];
    const conclusions: string[] = [];
    const explanation: string[] = [];
    let totalConfidence = 0;

    for (const rule of this.rules) {
      const results = rule.conditions.map(c => evalCondition(c, ctx));
      const matched = rule.logic === 'AND' ? results.every(Boolean) : results.some(Boolean);

      if (matched) {
        fired.push(rule);
        conclusions.push(rule.conclusion);
        totalConfidence += rule.confidence;
        explanation.push(`"${rule.name}" → ${rule.conclusion} (${Math.round(rule.confidence * 100)}%)`);
      }
    }

    return {
      fired,
      conclusions,
      confidence: fired.length ? Math.min(1, totalConfidence / fired.length) : 0,
      explanation,
    };
  }

  /** Extract category boost from conclusions */
  getCategoryBoost(conclusions: string[], candidateCategory: string): number {
    for (const c of conclusions) {
      if (c.startsWith('boost_category:')) {
        const cat = c.replace('boost_category:', '');
        if (candidateCategory.toLowerCase().includes(cat)) return 1.35;
      }
    }
    return 1.0;
  }

  /** Check if intent short-circuit applies */
  hasIntentShortCircuit(conclusions: string[]): string | null {
    const c = conclusions.find(c => c.startsWith('use_intent:'));
    return c ? c.replace('use_intent:', '') : null;
  }
}
