/**
 * Phase 9 — Temporal Engine
 * 
 * Understands time, past/present/future, and tracks event sequences.
 */

export type TimePeriod = 'past' | 'present' | 'future' | 'unknown';

export interface TemporalEvent {
  id: string;
  description: string;
  timestamp: number;
  period: TimePeriod;
  sequence?: number;
}

export class TemporalEngine {
  private events: TemporalEvent[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem('sofia_temporal_events');
      if (raw) this.events = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load temporal events', e);
    }
  }

  private save() {
    localStorage.setItem('sofia_temporal_events', JSON.stringify(this.events));
  }

  addEvent(description: string, timestamp: number = Date.now(), period?: TimePeriod) {
    const inferredPeriod = period || this.inferPeriod(timestamp);
    this.events.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      description,
      timestamp,
      period: inferredPeriod
    });
    this.events.sort((a, b) => a.timestamp - b.timestamp);
    this.save();
  }

  private inferPeriod(ts: number): TimePeriod {
    const now = Date.now();
    const diff = ts - now;
    if (Math.abs(diff) < 60000) return 'present'; // Within 1 minute
    return diff < 0 ? 'past' : 'future';
  }

  getEventsByPeriod(period: TimePeriod): TemporalEvent[] {
    return this.events.filter(e => e.period === period);
  }

  getTimeline(): TemporalEvent[] {
    return [...this.events].sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Simple relative time detection from tokens
   */
  detectTimeContext(tokens: string[]): TimePeriod {
    const pastMarkers = ['আগে', 'গতকাল', 'হয়েছিল', 'ছিল', 'past', 'yesterday', 'ago', 'was', 'did'];
    const futureMarkers = ['আগামীকাল', 'হবে', 'করব', 'future', 'tomorrow', 'will', 'next'];
    const presentMarkers = ['এখন', 'চলছে', 'আজ', 'now', 'today', 'is', 'current'];

    if (tokens.some(t => pastMarkers.includes(t.toLowerCase()))) return 'past';
    if (tokens.some(t => futureMarkers.includes(t.toLowerCase()))) return 'future';
    if (tokens.some(t => presentMarkers.includes(t.toLowerCase()))) return 'present';
    
    return 'unknown';
  }
}
