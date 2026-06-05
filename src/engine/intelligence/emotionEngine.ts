/**
 * Phase 28 — Emotional Intelligence Engine
 * Lexicon-based sentiment + tone selection (bn + en).
 */
export type Emotion = 'happy' | 'sad' | 'angry' | 'anxious' | 'neutral' | 'excited' | 'love';
export type Tone   = 'friendly' | 'professional' | 'supportive' | 'neutral' | 'excited';

const LEX: Record<Emotion, string[]> = {
  happy:   ['happy','great','awesome','খুশি','ভালো','দারুন','চমৎকার','😊','😀','😄'],
  sad:     ['sad','depressed','দুঃখ','কষ্ট','মন খারাপ','😢','😭'],
  angry:   ['angry','mad','রাগ','বিরক্ত','😡','🤬'],
  anxious: ['worried','anxious','tense','চিন্তা','টেনশন','ভয়'],
  excited: ['excited','wow','অসাধারণ','উত্তেজিত','🤩','🔥'],
  love:    ['love','ভালোবাসি','ভালোবাসা','আদর','❤️','💕','😍'],
  neutral: [],
};

const URGENT = ['urgent','asap','quickly','jodi','এখনই','তাড়াতাড়ি','জরুরি','দ্রুত','plz','please'];

export function detectEmotion(text: string): { emotion: Emotion; score: number } {
  const t = text.toLowerCase();
  let best: Emotion = 'neutral', score = 0;
  for (const [emo, words] of Object.entries(LEX) as [Emotion, string[]][]) {
    let s = 0;
    for (const w of words) if (t.includes(w)) s++;
    if (s > score) { score = s; best = emo; }
  }
  return { emotion: best, score: Math.min(1, score / 3) };
}

export function detectUrgency(text: string): number {
  const t = text.toLowerCase();
  let s = 0;
  for (const u of URGENT) if (t.includes(u)) s++;
  return Math.min(1, s / 2);
}

export function selectTone(emo: Emotion, urgency: number): Tone {
  if (urgency > 0.5) return 'professional';
  if (emo === 'sad' || emo === 'anxious') return 'supportive';
  if (emo === 'excited' || emo === 'love' || emo === 'happy') return 'excited';
  if (emo === 'angry') return 'supportive';
  return 'friendly';
}

export interface StyleProfile {
  tone: Tone;
  prefix?: string;
  suffix?: string;
  emojiHint?: string;
}

export class EmotionEngine {
  private history: Array<{ emotion: Emotion; ts: number }> = [];
  private readonly STORAGE_KEY = 'sofia_emotion_history_v1';

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) this.history = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load emotion history', e);
    }
  }

  private save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history.slice(-100)));
    } catch (e) {
      console.error('Failed to save emotion history', e);
    }
  }

  recordEmotion(text: string) {
    const { emotion } = detectEmotion(text);
    this.history.push({ emotion, ts: Date.now() });
    this.save();
    return emotion;
  }

  getTrend(): Emotion {
    if (this.history.length === 0) return 'neutral';
    const recent = this.history.slice(-10);
    const counts: Record<Emotion, number> = {} as any;
    recent.forEach(h => counts[h.emotion] = (counts[h.emotion] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as Emotion;
  }

  getHistory() {
    return this.history;
  }
}

export function generateStyleProfile(text: string): StyleProfile {
  const { emotion } = detectEmotion(text);
  const urgency = detectUrgency(text);
  const tone = selectTone(emotion, urgency);
  const map: Record<Tone, StyleProfile> = {
    friendly:     { tone, emojiHint: '😊' },
    professional: { tone, prefix: '' },
    supportive:   { tone, prefix: '💙 ', suffix: ' — আমি পাশে আছি।' },
    excited:      { tone, emojiHint: '🔥', suffix: ' 🎉' },
    neutral:      { tone },
  };
  return map[tone];
}
