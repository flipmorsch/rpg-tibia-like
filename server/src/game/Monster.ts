import { Position, Opcode, ByteBuffer, Direction } from 'shared';
import { AoIEntity } from './AoIManager.js';

export class Monster implements AoIEntity {
  public id: number;
  public name: string;
  public pos: Position;
  public speed = 50; // Slower than players by default
  public isPlayer = false;

  public lastMoveTime = 0;
  
  public hp = 50;
  public maxHp = 50;
  public targetId = 0;
  public lastAttackTime = 0;
  public homePos: Position;
  public monsterTypeId = 0;

  constructor(id: number, name: string, startPos: Position) {
    this.id = id;
    this.name = name;
    this.pos = { ...startPos };
    this.homePos = { ...startPos };
  }

  public getMoveCooldown(): number {
    return Math.max(200, Math.min(2000, 600 - this.speed * 2));
  }

  public serializeSpawn(): Uint8Array {
    const buffer = new ByteBuffer(64);
    buffer.writeUint8(Opcode.S2C_ENTITY_SPAWN);
    buffer.writeUint32(this.id);
    buffer.writeUint8(2); // Type: Monster
    buffer.writeString(this.name);
    buffer.writeUint16(this.pos.x);
    buffer.writeUint16(this.pos.y);
    buffer.writeUint8(this.pos.z);
    buffer.writeUint16(this.speed);
    buffer.writeUint16(this.hp);
    buffer.writeUint16(this.maxHp);
    buffer.writeUint8(this.monsterTypeId);
    return buffer.getPayload();
  }

  public serializeDespawn(): Uint8Array {
    const buffer = new ByteBuffer(16);
    buffer.writeUint8(Opcode.S2C_ENTITY_DESPAWN);
    buffer.writeUint32(this.id);
    return buffer.getPayload();
  }

  public getDamageBounds(): { min: number; max: number } {
    return { min: 3, max: 10 };
  }

  public getExpReward(): number {
    return 25;
  }

  public getAggroRange(): number {
    return 5;
  }
}
