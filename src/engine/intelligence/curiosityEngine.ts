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

export interface UnknownConcept {
  id: string;
  name: string;
  detectedAt: number;
  context: string;
}

export class CuriosityEngine {
  private gaps: KnowledgeGap[] = [];
  private unknownQueue: UnknownConcept[] = [];
  constructor() { this.load(); }

  private load() { 
    try { 
      this.gaps = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); 
      this.unknownQueue = JSON.parse(localStorage.getItem('sofia_curiosity_queue_v1') || '[]');
    } catch { 
      this.gaps = []; 
      this.unknownQueue = [];
    } 
  }
  private save() { 
    try { 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.gaps.slice(-200))); 
      localStorage.setItem('sofia_curiosity_queue_v1', JSON.stringify(this.unknownQueue));
    } catch {/*ignore*/} 
  }

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
  
  addUnknown(name: string, context: string) {
    if (this.unknownQueue.some(u => u.name === name)) return;
    this.unknownQueue.push({
      id: Math.random().toString(36).substring(2, 9),
      name,
      detectedAt: Date.now(),
      context
    });
    this.save();
  }

  getUnknownQueue() {
    return this.unknownQueue;
  }

  clear() { 
    this.gaps = []; 
    this.unknownQueue = [];
    this.save(); 
  }
}
