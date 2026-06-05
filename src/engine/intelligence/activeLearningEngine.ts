/**
 * Phase 27 — Active Learning Engine
 * If confidence is low, queue a clarification question. User answers become facts.
 */
const STORAGE_KEY = 'sofia_active_learn_v1';

export interface PendingQuestion {
  id: string;
  topic: string;
  question: string;
  ts: number;
}

export interface LearnedFact {
  id: string;
  topic: string;
  content: string;
  source: 'user';
  ts: number;
}

export class ActiveLearningEngine {
  private pending: PendingQuestion[] = [];
  private learned: LearnedFact[] = [];

  constructor() { this.load(); }

  private load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      this.pending = raw.pending || [];
      this.learned = raw.learned || [];
    } catch { /*ignore*/ }
  }
  private save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ pending: this.pending.slice(-50), learned: this.learned.slice(-500) })); } catch {/*ignore*/}
  }

  /** Should we ask user? Returns question text if confidence too low. */
  askForClarification(topic: string, confidence: number, lang: 'bn' | 'en' = 'bn'): string | null {
    if (confidence >= 0.35) return null;
    const exists = this.pending.find(p => p.topic.toLowerCase() === topic.toLowerCase());
    if (exists) return exists.question;
    const q = lang === 'bn'
      ? `"${topic}" সম্পর্কে আমার তথ্য কম। আপনি কি একটু ব্যাখ্যা করবেন?`
      : `I don't know enough about "${topic}". Can you explain it?`;
    this.pending.push({ id: `q_${Date.now()}`, topic, question: q, ts: Date.now() });
    this.save();
    return q;
  }

  validateUserKnowledge(content: string): boolean {
    return !!content && content.trim().length > 4;
  }

  saveLearnedFact(topic: string, content: string): LearnedFact | null {
    if (!this.validateUserKnowledge(content)) return null;
    const fact: LearnedFact = { id: `lf_${Date.now()}`, topic, content, source: 'user', ts: Date.now() };
    this.learned.push(fact);
    this.pending = this.pending.filter(p => p.topic.toLowerCase() !== topic.toLowerCase());
    this.save();
    return fact;
  }

  /** Hook so an outer system can graft learned topic into the knowledge graph */
  connectToKnowledgeGraph(addEntity: (name: string, cats?: string[], rels?: string[]) => void) {
    for (const f of this.learned) addEntity(f.topic, ['user_taught'], []);
  }

  pendingList(): PendingQuestion[] { return this.pending; }
  learnedList(): LearnedFact[] { return this.learned; }
  clear() { this.pending = []; this.learned = []; this.save(); }
}
