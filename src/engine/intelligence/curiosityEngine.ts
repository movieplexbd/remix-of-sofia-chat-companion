/**
 * Phase 34 — Curiosity Engine
 * Detect knowledge gaps; generate probing questions; expose learning requests.
 */
const STORAGE_KEY = 'sofia_curiosity_v1';

export interface KnowledgeGap {
  topic: string;
  question: string;
  ts: number;
  asked: number;
}

export class CuriosityEngine {
  private gaps: KnowledgeGap[] = [];
  constructor() { this.load(); }

  private load() { try { this.gaps = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { this.gaps = []; } }
  private save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.gaps.slice(-200))); } catch {/*ignore*/} }

  /** Returns true if topic has no known content / low confidence */
  detectKnowledgeGap(topic: string, confidence: number, hasContent: boolean): boolean {
    return !hasContent || confidence < 0.25;
  }

  generateQuestion(topic: string, lang: 'bn' | 'en' = 'bn'): string {
    return lang === 'bn'
      ? `"${topic}" সম্পর্কে আরও কি জানাতে পারবেন?`
      : `Could you tell me more about "${topic}"?`;
  }

  requestLearning(topic: string, lang: 'bn' | 'en' = 'bn'): KnowledgeGap {
    const existing = this.gaps.find(g => g.topic.toLowerCase() === topic.toLowerCase());
    if (existing) {
      existing.asked++;
      this.save();
      return existing;
    }
    const gap: KnowledgeGap = { topic, question: this.generateQuestion(topic, lang), ts: Date.now(), asked: 1 };
    this.gaps.push(gap);
    this.save();
    return gap;
  }

  list(): KnowledgeGap[] { return this.gaps; }
  clear() { this.gaps = []; this.save(); }
}
