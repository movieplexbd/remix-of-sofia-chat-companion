/**
 * Phase 7 — World Model Engine
 *
 * Represents real-world entities: Person, Place, Business, Event, Technology, etc.
 * Tracks relationships among them.
 */

export type EntityType = 'person' | 'place' | 'business' | 'event' | 'technology' | 'organization' | 'product';

export interface WorldEntity {
  id: string;
  name: string;
  type: EntityType;
  attributes: Record<string, any>;
  relationships: Array<{
    targetId: string;
    relation: string;
  }>;
}

export class WorldModelEngine {
  private entities = new Map<string, WorldEntity>();

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem('sofia_world_model');
      if (saved) {
        const data: WorldEntity[] = JSON.parse(saved);
        data.forEach(e => this.entities.set(e.id, e));
      }
    } catch (e) {
      console.error('Failed to load world model', e);
    }
  }

  private save() {
    try {
      localStorage.setItem('sofia_world_model', JSON.stringify([...this.entities.values()]));
    } catch (e) {
      console.error('Failed to save world model', e);
    }
  }

  addEntity(entity: WorldEntity) {
    this.entities.set(entity.id, entity);
    this.save();
  }

  getEntity(id: string) {
    return this.entities.get(id);
  }

  linkEntities(sourceId: string, targetId: string, relation: string) {
    const source = this.entities.get(sourceId);
    if (source) {
      source.relationships.push({ targetId, relation });
      this.save();
    }
  }

  getRelated(id: string) {
    const entity = this.entities.get(id);
    return entity ? entity.relationships : [];
  }
}
