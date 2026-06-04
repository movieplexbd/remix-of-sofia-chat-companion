/**
 * Phase 20 — Topic Detection Engine
 *
 * Lightweight topic classifier based on hand-curated keyword sets.
 * Returns ranked topics with confidence. No ML.
 */

export interface TopicHit { topic: string; confidence: number; matched: string[]; }

const TOPIC_KEYWORDS: Record<string, string[]> = {
  Fitness:     ['weight','lose','workout','gym','exercise','ওজন','ব্যায়াম','জিম','ফিট'],
  Health:      ['health','doctor','medicine','disease','স্বাস্থ্য','ডাক্তার','রোগ','ঔষধ'],
  Diet:        ['diet','food','calorie','nutrition','ডায়েট','খাবার','পুষ্টি'],
  Programming: ['programming','code','python','javascript','java','c++','প্রোগ্রামিং','কোড'],
  Technology:  ['technology','tech','phone','laptop','computer','ai','প্রযুক্তি','ফোন','কম্পিউটার'],
  Software:    ['software','app','application','সফটওয়্যার','অ্যাপ'],
  Education:   ['school','college','university','study','exam','স্কুল','কলেজ','পড়া','পরীক্ষা'],
  Travel:      ['travel','trip','tour','visit','journey','ভ্রমণ','ঘুরতে'],
  Finance:     ['money','price','cost','taka','টাকা','দাম','বাজেট','বিনিয়োগ'],
  Relationship:['love','friend','girlfriend','boyfriend','ভালোবাসা','বন্ধু','সম্পর্ক'],
  Food:        ['recipe','cook','রান্না','খাবার','মাছ','ভাত'],
  Greeting:    ['hi','hello','salam','hey','সালাম','হাই','হ্যালো','নমস্কার'],
};

export function detectTopics(text: string, limit = 5): TopicHit[] {
  const t = (text || '').toLowerCase();
  const hits: TopicHit[] = [];
  for (const [topic, kws] of Object.entries(TOPIC_KEYWORDS)) {
    const matched = kws.filter(k => t.includes(k.toLowerCase()));
    if (matched.length) {
      hits.push({
        topic,
        confidence: Math.min(1, matched.length / 3),
        matched,
      });
    }
  }
  return hits.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
}

export function topicBoost(topics: TopicHit[], candidateCategory: string): number {
  if (!topics.length || !candidateCategory) return 1;
  const cat = candidateCategory.toLowerCase();
  for (const h of topics) {
    if (cat.includes(h.topic.toLowerCase())) return 1 + h.confidence * 0.25;
  }
  return 1;
}
