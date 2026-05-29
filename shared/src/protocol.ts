/**
 * Protocol Definitions and Binary Serialization Engine for Project Tibado
 */

// Cardinal directions for grid movement
export enum Direction {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
}

// Map coordinates in 3D grid space
export interface Position {
  x: number;
  y: number;
  z: number; // Z-axis levels (e.g. 7 is surface, lower is higher, higher is underground/dungeon)
}

export enum EntityType {
  PLAYER = 1,
  MONSTER = 2,
}

// Packet opcodes
export enum Opcode {
  // Client to Server (C2S)
  C2S_LOGIN_REQ = 100,
  C2S_MOVE_REQ = 101,
  C2S_CHAT_REQ = 102,
  C2S_ATTACK_REQ = 103,

  // Server to Client (S2C)
  S2C_LOGIN_SUCCESS = 1,
  S2C_LOGIN_FAILURE = 2,
  S2C_MAP_DESCRIPTION = 3, // Initial viewport or large floor changes
  S2C_ENTITY_SPAWN = 4,    // Entity appears in AoI
  S2C_ENTITY_DESPAWN = 5,  // Entity leaves AoI or dies
  S2C_ENTITY_MOVE = 6,     // Entity walks to neighbor tile
  S2C_CHAT_MESSAGE = 7,    // Chat message text broadcast
  S2C_HEARTBEAT = 8,       // Heartbeat packet
  S2C_ENTITY_HP = 9,       // Entity health update
  S2C_COMBAT_EFFECT = 10,  // Floating numbers / visual effects
  S2C_PLAYER_EXP = 11,     // Player experience and level update
}

export class ByteBuffer {
  public buffer: Uint8Array;
  public view: DataView;
  public readOffset = 0;
  public writeOffset = 0;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  constructor(sizeOrBuffer: number | ArrayBuffer | Uint8Array = 1024) {
    if (typeof sizeOrBuffer === 'number') {
      this.buffer = new Uint8Array(sizeOrBuffer);
      this.view = new DataView(this.buffer.buffer);
    } else if (sizeOrBuffer instanceof Uint8Array) {
      this.buffer = sizeOrBuffer;
      this.view = new DataView(sizeOrBuffer.buffer, sizeOrBuffer.byteOffset, sizeOrBuffer.byteLength);
    } else {
      this.buffer = new Uint8Array(sizeOrBuffer);
      this.view = new DataView(sizeOrBuffer);
    }
  }

  public ensureCapacity(additionalBytes: number) {
    const requiredCapacity = this.writeOffset + additionalBytes;
    if (requiredCapacity > this.buffer.length) {
      let newCapacity = this.buffer.length * 2;
      while (newCapacity < requiredCapacity) {
        newCapacity *= 2;
      }
      const newBuffer = new Uint8Array(newCapacity);
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
      this.view = new DataView(newBuffer.buffer);
    }
  }

  // --- Write Methods ---

  public writeUint8(value: number): void {
    this.ensureCapacity(1);
    this.view.setUint8(this.writeOffset, value);
    this.writeOffset += 1;
  }

  public writeUint16(value: number): void {
    this.ensureCapacity(2);
    this.view.setUint16(this.writeOffset, value, true); // Little endian
    this.writeOffset += 2;
  }

  public writeUint32(value: number): void {
    this.ensureCapacity(4);
    this.view.setUint32(this.writeOffset, value, true);
    this.writeOffset += 4;
  }

  public writeFloat32(value: number): void {
    this.ensureCapacity(4);
    this.view.setFloat32(this.writeOffset, value, true);
    this.writeOffset += 4;
  }

  public writeString(value: string): void {
    const encoded = this.encoder.encode(value);
    this.writeUint16(encoded.length);
    this.ensureCapacity(encoded.length);
    this.buffer.set(encoded, this.writeOffset);
    this.writeOffset += encoded.length;
  }

  // --- Read Methods ---

  public readUint8(): number {
    if (this.readOffset + 1 > this.buffer.length) {
      throw new Error('Out of bounds read: Uint8');
    }
    const val = this.view.getUint8(this.readOffset);
    this.readOffset += 1;
    return val;
  }

  public readUint16(): number {
    if (this.readOffset + 2 > this.buffer.length) {
      throw new Error('Out of bounds read: Uint16');
    }
    const val = this.view.getUint16(this.readOffset, true);
    this.readOffset += 2;
    return val;
  }

  public readUint32(): number {
    if (this.readOffset + 4 > this.buffer.length) {
      throw new Error('Out of bounds read: Uint32');
    }
    const val = this.view.getUint32(this.readOffset, true);
    this.readOffset += 4;
    return val;
  }

  public readFloat32(): number {
    if (this.readOffset + 4 > this.buffer.length) {
      throw new Error('Out of bounds read: Float32');
    }
    const val = this.view.getFloat32(this.readOffset, true);
    this.readOffset += 4;
    return val;
  }

  public readString(): string {
    const len = this.readUint16();
    if (this.readOffset + len > this.buffer.length) {
      throw new Error(`Out of bounds read: String of length ${len}`);
    }
    const strBuffer = this.buffer.subarray(this.readOffset, this.readOffset + len);
    const val = this.decoder.decode(strBuffer);
    this.readOffset += len;
    return val;
  }

  public getPayload(): Uint8Array {
    return this.buffer.subarray(0, this.writeOffset);
  }

  public reset(): void {
    this.readOffset = 0;
    this.writeOffset = 0;
  }
}
