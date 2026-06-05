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
