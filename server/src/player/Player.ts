import { Position, Opcode, ByteBuffer } from 'shared';
import { AoIEntity } from '../map/AoIManager.js';
import { ConnectionManager } from '../ws/ConnectionManager.js';

export class Player implements AoIEntity {
  public id: number;
  public name: string;
  public pos: Position;
  public speed = 100; // Grid speed factor (higher speed means lower movement cooldown)
  public isPlayer = true;

  public lastMoveTime = 0;
  public knownEntityIds: Set<number> = new Set();

  public hp = 100;
  public maxHp = 100;
  public targetId = 0;
  public lastAttackTime = 0;
  public exp = 100;
  public level = 1;
  
  constructor(id: number, name: string, startPos: Position) {
    this.id = id;
    this.name = name;
    this.pos = { ...startPos };
  }

  /**
   * Return movement cooldown in milliseconds.
   * Faster speed reduces the duration of the tile step.
   * Classic Tibia formula or linear mapping:
   * e.g. base step is 300ms, and it drops by speed.
   */
  public getMoveCooldown(): number {
    // 300ms base, minus speed * 0.8ms. Min 100ms, Max 1000ms.
    return Math.max(100, Math.min(1000, 300 - this.speed * 0.8));
  }

  /** Level-scaled max HP: 100 + 25 per level above 1 */
  public getMaxHpForLevel(): number {
    return 100 + 25 * (this.level - 1);
  }

  /** Level-scaled speed: 100 + 4 per level above 1, capped at 250 */
  public getSpeedForLevel(): number {
    return Math.min(250, 100 + 4 * (this.level - 1));
  }

  /** Level-scaled damage bounds */
  public getDamageBounds(): { min: number; max: number } {
    return {
      min: 10 + this.level * 3,
      max: 20 + this.level * 4,
    };
  }

  /** Level-scaled attack cooldown in ms, floors at 500ms */
  public getAttackCooldown(): number {
    return Math.max(500, 2000 - this.level * 35);
  }

  public sendPacket(packet: Uint8Array): void {
    ConnectionManager.getInstance().send(this.id, packet);
  }

  /**
   * Serializes this player as a spawn entity packet
   */
  public serializeSpawn(): Uint8Array {
    const buffer = new ByteBuffer(64);
    buffer.writeUint8(Opcode.S2C_ENTITY_SPAWN);
    buffer.writeUint32(this.id);
    buffer.writeUint8(1); // Type: Player
    buffer.writeString(this.name);
    buffer.writeUint16(this.pos.x);
    buffer.writeUint16(this.pos.y);
    buffer.writeUint8(this.pos.z);
    buffer.writeUint16(this.speed);
    buffer.writeUint16(this.hp);
    buffer.writeUint16(this.maxHp);
    return buffer.getPayload();
  }

  /**
   * Serializes a despawn packet for this player
   */
  public serializeDespawn(): Uint8Array {
    const buffer = new ByteBuffer(16);
    buffer.writeUint8(Opcode.S2C_ENTITY_DESPAWN);
    buffer.writeUint32(this.id);
    return buffer.getPayload();
  }
}
