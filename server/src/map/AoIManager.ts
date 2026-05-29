import { Position } from 'shared';

export interface AoIEntity {
  id: number;
  name: string;
  pos: Position;
  speed: number;
  isPlayer: boolean;
  // A callback to send data directly to this entity (if it's a player)
  sendPacket?(packet: Uint8Array): void;
}

export class AoIManager {
  private readonly sectorSize = 16;
  // Map of sectorKey -> Set of entities
  // sectorKey format: "sx,sy,sz"
  private sectors: Map<string, Set<AoIEntity>> = new Map();

  private getSectorKey(x: number, y: number, z: number): string {
    const sx = Math.floor(x / this.sectorSize);
    const sy = Math.floor(y / this.sectorSize);
    return `${sx},${sy},${z}`;
  }

  public addEntity(entity: AoIEntity): void {
    const key = this.getSectorKey(entity.pos.x, entity.pos.y, entity.pos.z);
    if (!this.sectors.has(key)) {
      this.sectors.set(key, new Set());
    }
    this.sectors.get(key)!.add(entity);
  }

  public removeEntity(entity: AoIEntity): void {
    const key = this.getSectorKey(entity.pos.x, entity.pos.y, entity.pos.z);
    const sector = this.sectors.get(key);
    if (sector) {
      sector.delete(entity);
      if (sector.size === 0) {
        this.sectors.delete(key);
      }
    }
  }

  /**
   * Updates an entity's sector when it moves.
   * Returns true if the sector changed.
   */
  public updateEntitySector(entity: AoIEntity, oldPos: Position): boolean {
    const oldKey = this.getSectorKey(oldPos.x, oldPos.y, oldPos.z);
    const newKey = this.getSectorKey(entity.pos.x, entity.pos.y, entity.pos.z);

    if (oldKey === newKey) {
      return false;
    }

    const oldSector = this.sectors.get(oldKey);
    if (oldSector) {
      oldSector.delete(entity);
      if (oldSector.size === 0) {
        this.sectors.delete(oldKey);
      }
    }

    if (!this.sectors.has(newKey)) {
      this.sectors.set(newKey, new Set());
    }
    this.sectors.get(newKey)!.add(entity);
    return true;
  }

  /**
   * Gets all entities in adjacent 9 sectors on the same Z floor.
   */
  public getEntitiesInAoI(pos: Position): Set<AoIEntity> {
    const sx = Math.floor(pos.x / this.sectorSize);
    const sy = Math.floor(pos.y / this.sectorSize);
    const z = pos.z;

    const entities = new Set<AoIEntity>();

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = `${sx + dx},${sy + dy},${z}`;
        const sector = this.sectors.get(key);
        if (sector) {
          for (const ent of sector) {
            entities.add(ent);
          }
        }
      }
    }

    return entities;
  }

  /**
   * Returns all players who can spectate a given tile (i.e. those whose AoI overlaps the position).
   * Usually, they must be on the same Z level and within sector distance.
   */
  public getSpectators(pos: Position): AoIEntity[] {
    const candidates = this.getEntitiesInAoI(pos);
    const spectators: AoIEntity[] = [];

    for (const ent of candidates) {
      if (ent.isPlayer && ent.sendPacket) {
        // Double-check raw distance to ensure they are within viewport bounds
        // Viewport padding size: range is ~18 tiles wide and ~14 tiles high, let's allow up to 20x16 distance.
        const dx = Math.abs(ent.pos.x - pos.x);
        const dy = Math.abs(ent.pos.y - pos.y);
        if (dx <= 20 && dy <= 16 && ent.pos.z === pos.z) {
          spectators.push(ent);
        }
      }
    }

    return spectators;
  }
}
