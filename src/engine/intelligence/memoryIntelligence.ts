/**
 * Phase 35 — Memory Intelligence Engine
 * Rank, archive, compress, expire arbitrary memory items.
 */
export type MemoryTier = 'critical' | 'important' | 'useful' | 'temporary' | 'expired';

export interface MemoryItem {
  id: string;
  content: string;
  category?: string;
  weight: number;       // 0..1
  hits: number;
  ts: number;           // created
  lastUsed: number;
  tier?: MemoryTier;
}

const HOUR = 3600 * 1000;
const DAY  = 24 * HOUR;

export function rankMemory(items: MemoryItem[], now = Date.now()): MemoryItem[] {
  return [...items].map(i => {
    const ageH = (now - i.ts) / HOUR;
    const recencyH = (now - i.lastUsed) / HOUR;
    const score = i.weight * 2 + Math.log10(1 + i.hits) - recencyH * 0.005 - ageH * 0.0005;
    let tier: MemoryTier = 'useful';
    if (score > 2.5) tier = 'critical';
    else if (score > 1.5) tier = 'important';
    else if (score > 0.4) tier = 'useful';
    else if (score > -0.5) tier = 'temporary';
    else tier = 'expired';
    return { ...i, tier };
  }).sort((a, b) => (b.weight + b.hits * 0.1) - (a.weight + a.hits * 0.1));
}

export function archiveMemory(items: MemoryItem[]): MemoryItem[] {
  const ranked = rankMemory(items);
  return ranked.filter(i => i.tier !== 'expired');
}

export function removeExpiredMemory(items: MemoryItem[], maxAgeDays = 30): MemoryItem[] {
  const cutoff = Date.now() - maxAgeDays * DAY;
  return rankMemory(items).filter(i => i.tier !== 'expired' && i.lastUsed >= cutoff);
}

export function compressMemory(items: MemoryItem[], maxItems = 200): MemoryItem[] {
  const ranked = rankMemory(items);
  return ranked.slice(0, maxItems);
}
