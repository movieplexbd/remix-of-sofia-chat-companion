/**
 * Phase 11 — Episodic Memory
 *
 * Store user experiences and events.
 * Track: Event, Date, Outcome, Lessons Learned.
 */

export interface Episode {
  id: string;
  event: string;
  date: number;
  outcome?: string;
  lessonsLearned?: string[];
  importance: number; // 0..1
}

export class EpisodicMemory {
  private episodes: Episode[] = [];
  private readonly STORAGE_KEY = 'sofia_episodic_memory_v1';

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) this.episodes = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load episodic memory', e);
    }
  }

  private save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.episodes));
    } catch (e) {
      console.error('Failed to save episodic memory', e);
    }
  }

  recordEpisode(episode: Omit<Episode, 'id'>) {
    const newEpisode: Episode = {
      ...episode,
      id: Math.random().toString(36).substring(2, 9),
    };
    this.episodes.push(newEpisode);
    this.save();
  }

  getEpisodes() {
    return this.episodes;
  }

  recallRelevant(query: string): Episode[] {
    // Simple keyword match for now
    const tokens = query.toLowerCase().split(/\s+/);
    return this.episodes.filter(e => 
      tokens.some(t => e.event.toLowerCase().includes(t))
    ).sort((a, b) => b.importance - a.importance);
  }
}
