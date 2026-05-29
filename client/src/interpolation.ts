import { Direction, EntityType } from 'shared';

export interface ClientEntity {
  id: number;
  name: string;
  type: EntityType;
  gridX: number;
  gridY: number;
  gridZ: number;
  
  // Interpolated rendering positions
  visualX: number;
  visualY: number;
  
  // Movement tracking
  startX: number;
  startY: number;
  startTime: number;
  duration: number;
  isMoving: boolean;
  
  speed: number;
  facingDirection: Direction;
  isPlayer: boolean;

  // Active chat bubble parameters
  chatText: string;
  chatTime: number;

  hp: number;
  maxHp: number;
  monsterTypeId: number;
}

export class InterpolationEngine {
  private entities: Map<number, ClientEntity> = new Map();

  public clear() {
    this.entities.clear();
  }

  public getEntities(): Map<number, ClientEntity> {
    return this.entities;
  }

  public getEntity(id: number): ClientEntity | undefined {
    return this.entities.get(id);
  }

  public spawnEntity(id: number, name: string, type: EntityType, x: number, y: number, z: number, speed: number, hp = 100, maxHp = 100, monsterTypeId = 0) {
    const entity: ClientEntity = {
      id,
      name,
      type,
      gridX: x,
      gridY: y,
      gridZ: z,
      visualX: x,
      visualY: y,
      startX: x,
      startY: y,
      startTime: 0,
      duration: 0,
      isMoving: false,
      speed,
      facingDirection: Direction.SOUTH, // Default facing down
      isPlayer: type === EntityType.PLAYER,
      chatText: '',
      chatTime: 0,
      hp,
      maxHp,
      monsterTypeId,
    };
    this.entities.set(id, entity);
  }

  public despawnEntity(id: number) {
    this.entities.delete(id);
  }

  public updateEntityHp(id: number, hp: number, maxHp: number) {
    const entity = this.entities.get(id);
    if (entity) {
      entity.hp = hp;
      entity.maxHp = maxHp;
    }
  }

  public handleEntityMove(id: number, fromX: number, fromY: number, toX: number, toY: number, toZ: number, durationMs: number) {
    let entity = this.entities.get(id);
    if (!entity) {
      // If we don't know about this entity, we can spawn it implicitly
      // Standard engine fallback
      return;
    }

    // Set up interpolation details
    entity.startX = fromX;
    entity.startY = fromY;
    entity.gridX = toX;
    entity.gridY = toY;
    entity.gridZ = toZ;
    entity.startTime = Date.now();
    entity.duration = durationMs;
    entity.isMoving = true;

    // Set facing direction based on displacement
    if (toY < fromY) {
      entity.facingDirection = Direction.NORTH;
    } else if (toX > fromX) {
      entity.facingDirection = Direction.EAST;
    } else if (toY > fromY) {
      entity.facingDirection = Direction.SOUTH;
    } else if (toX < fromX) {
      entity.facingDirection = Direction.WEST;
    }
  }

  public setChatBubble(id: number, message: string) {
    const entity = this.entities.get(id);
    if (entity) {
      entity.chatText = message;
      entity.chatTime = Date.now();
    }
  }

  /**
   * Updates visual coordinates of all active entities based on elapsed time.
   */
  public update() {
    const now = Date.now();
    for (const entity of this.entities.values()) {
      if (entity.isMoving) {
        const elapsed = now - entity.startTime;
        const progress = Math.min(1.0, elapsed / entity.duration);
        
        entity.visualX = entity.startX + (entity.gridX - entity.startX) * progress;
        entity.visualY = entity.startY + (entity.gridY - entity.startY) * progress;

        if (progress >= 1.0) {
          entity.isMoving = false;
          entity.visualX = entity.gridX;
          entity.visualY = entity.gridY;
        }
      } else {
        entity.visualX = entity.gridX;
        entity.visualY = entity.gridY;
      }
    }
  }
}
