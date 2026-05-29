import { ByteBuffer, Opcode, Direction } from 'shared';

export interface NetworkCallbacks {
  onLoginSuccess: (playerId: number, x: number, y: number, z: number, hp: number, maxHp: number, speed: number) => void;
  onLoginFailure: (reason: string) => void;
  onMapDescription: (minX: number, minY: number, z: number, width: number, height: number, tiles: Uint8Array) => void;
  onEntitySpawn: (id: number, type: number, name: string, x: number, y: number, z: number, speed: number, hp: number, maxHp: number, monsterTypeId: number) => void;
  onEntityDespawn: (id: number) => void;
  onEntityMove: (id: number, fromX: number, fromY: number, toX: number, toY: number, z: number, duration: number) => void;
  onChatMessage: (id: number, name: string, type: number, message: string) => void;
  onEntityHp: (id: number, hp: number, maxHp: number) => void;
  onCombatEffect: (x: number, y: number, z: number, type: number, amount: number) => void;
  onPlayerExp: (exp: number, level: number, speed: number, maxHp: number) => void;
  onHeartbeat: () => void;
  onDisconnect: () => void;
  onConnect: () => void;
}

export class NetworkHandler {
  private socket: WebSocket | null = null;
  private callbacks: NetworkCallbacks;

  constructor(callbacks: NetworkCallbacks) {
    this.callbacks = callbacks;
  }

  public connect(url: string) {
    console.log(`Connecting to game server at ${url}...`);
    this.socket = new WebSocket(url);
    this.socket.binaryType = 'arraybuffer';

    this.socket.onopen = () => {
      console.log('Connected to game server.');
      this.callbacks.onConnect();
    };

    this.socket.onclose = () => {
      console.log('Disconnected from game server.');
      this.callbacks.onDisconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket network error:', error);
    };

    this.socket.onmessage = (event) => {
      this.handleMessage(event.data as ArrayBuffer);
    };
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  private handleMessage(arrayBuffer: ArrayBuffer) {
    try {
      const buffer = new ByteBuffer(new Uint8Array(arrayBuffer));
      const opcode = buffer.readUint8() as Opcode;

      switch (opcode) {
        case Opcode.S2C_LOGIN_SUCCESS: {
          const playerId = buffer.readUint32();
          const x = buffer.readUint16();
          const y = buffer.readUint16();
          const z = buffer.readUint8();
          const hp = buffer.readUint16();
          const maxHp = buffer.readUint16();
          const speed = buffer.readUint16();
          this.callbacks.onLoginSuccess(playerId, x, y, z, hp, maxHp, speed);
          break;
        }

        case Opcode.S2C_LOGIN_FAILURE: {
          const reason = buffer.readString();
          this.callbacks.onLoginFailure(reason);
          break;
        }

        case Opcode.S2C_MAP_DESCRIPTION: {
          // Bounding Box parsing
          const minX = buffer.readUint16();
          const minY = buffer.readUint16();
          const z = buffer.readUint8();
          const width = buffer.readUint8();
          const height = buffer.readUint8();

          // Read the tiles array (row-major)
          const tilesCount = width * height;
          const tiles = new Uint8Array(tilesCount);
          for (let i = 0; i < tilesCount; i++) {
            tiles[i] = buffer.readUint8();
          }

          this.callbacks.onMapDescription(minX, minY, z, width, height, tiles);
          break;
        }

        case Opcode.S2C_ENTITY_SPAWN: {
          const id = buffer.readUint32();
          const type = buffer.readUint8();
          const name = buffer.readString();
          const x = buffer.readUint16();
          const y = buffer.readUint16();
          const z = buffer.readUint8();
          const speed = buffer.readUint16();
          const hp = buffer.readUint16();
          const maxHp = buffer.readUint16();
          let monsterTypeId = 0;
          if (type === 2) { // 2 = EntityType.MONSTER
            monsterTypeId = buffer.readUint8();
          }
          this.callbacks.onEntitySpawn(id, type, name, x, y, z, speed, hp, maxHp, monsterTypeId);
          break;
        }

        case Opcode.S2C_ENTITY_DESPAWN: {
          const id = buffer.readUint32();
          this.callbacks.onEntityDespawn(id);
          break;
        }

        case Opcode.S2C_ENTITY_MOVE: {
          const id = buffer.readUint32();
          const fromX = buffer.readUint16();
          const fromY = buffer.readUint16();
          const toX = buffer.readUint16();
          const toY = buffer.readUint16();
          const z = buffer.readUint8();
          const duration = buffer.readUint16();
          this.callbacks.onEntityMove(id, fromX, fromY, toX, toY, z, duration);
          break;
        }

        case Opcode.S2C_CHAT_MESSAGE: {
          const id = buffer.readUint32();
          const name = buffer.readString();
          const type = buffer.readUint8();
          const message = buffer.readString();
          this.callbacks.onChatMessage(id, name, type, message);
          break;
        }

        case Opcode.S2C_HEARTBEAT: {
          this.callbacks.onHeartbeat();
          break;
        }

        case Opcode.S2C_ENTITY_HP: {
          const id = buffer.readUint32();
          const hp = buffer.readUint16();
          const maxHp = buffer.readUint16();
          this.callbacks.onEntityHp(id, hp, maxHp);
          break;
        }

        case Opcode.S2C_COMBAT_EFFECT: {
          const x = buffer.readUint16();
          const y = buffer.readUint16();
          const z = buffer.readUint8();
          const type = buffer.readUint8();
          const amount = buffer.readUint16();
          this.callbacks.onCombatEffect(x, y, z, type, amount);
          break;
        }

        case Opcode.S2C_PLAYER_EXP: {
          const exp = buffer.readUint32();
          const level = buffer.readUint16();
          const speed = buffer.readUint16();
          const maxHp = buffer.readUint16();
          this.callbacks.onPlayerExp(exp, level, speed, maxHp);
          break;
        }

        default:
          console.warn(`Unregistered client opcode: ${opcode}`);
      }
    } catch (e) {
      console.error('Failed to parse incoming network packet:', e);
    }
  }

  // --- Send Client Opcodes ---

  public sendLogin(username: string) {
    const buffer = new ByteBuffer(32);
    buffer.writeUint8(Opcode.C2S_LOGIN_REQ);
    buffer.writeString(username);
    this.sendPacket(buffer.getPayload());
  }

  public sendMove(direction: Direction) {
    const buffer = new ByteBuffer(8);
    buffer.writeUint8(Opcode.C2S_MOVE_REQ);
    buffer.writeUint8(direction);
    this.sendPacket(buffer.getPayload());
  }

  public sendChat(type: number, message: string) {
    const buffer = new ByteBuffer(128);
    buffer.writeUint8(Opcode.C2S_CHAT_REQ);
    buffer.writeUint8(type);
    buffer.writeString(message);
    this.sendPacket(buffer.getPayload());
  }

  public sendAttack(targetId: number) {
    const buffer = new ByteBuffer(8);
    buffer.writeUint8(Opcode.C2S_ATTACK_REQ);
    buffer.writeUint32(targetId);
    this.sendPacket(buffer.getPayload());
  }

  private sendPacket(payload: Uint8Array) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payload);
    }
  }
}
