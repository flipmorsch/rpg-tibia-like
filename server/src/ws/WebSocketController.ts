import { GameSocket } from './GameSocket.js';
import { GameWorld } from '../game/GameWorld.js';
import { ByteBuffer, Opcode } from 'shared';

export class WebSocketController {
  private world: GameWorld;

  constructor(world: GameWorld) {
    this.world = world;
  }

  public handleConnection(ws: GameSocket): void {
    ws.isAlive = true;
    console.log('New connection established');

    // Handle client disconnection
    ws.on('close', () => {
      if (ws.player) {
        this.world.handlePlayerDisconnect(ws.player);
      }
    });

    ws.on('error', (err) => {
      console.error('Socket error:', err);
    });

    // Handle heartbeat ping-pong
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Process incoming binary buffers
    ws.on('message', (data) => {
      try {
        let uint8: Uint8Array;
        if (data instanceof Buffer) {
          uint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        } else if (Array.isArray(data)) {
          uint8 = new Uint8Array(Buffer.concat(data));
        } else {
          uint8 = new Uint8Array(data as ArrayBuffer);
        }

        const buffer = new ByteBuffer(uint8);
        const opcode = buffer.readUint8() as Opcode;

        switch (opcode) {
          case Opcode.C2S_LOGIN_REQ: {
            const username = buffer.readString();
            if (ws.player) {
              // Already logged in
              break;
            }
            const player = this.world.handlePlayerLogin(username, ws);
            ws.player = player;
            break;
          }

          case Opcode.C2S_MOVE_REQ: {
            if (!ws.player) break;
            const direction = buffer.readUint8();
            this.world.handlePlayerMoveRequest(ws.player, direction);
            break;
          }

          case Opcode.C2S_CHAT_REQ: {
            if (!ws.player) break;
            const type = buffer.readUint8();
            const message = buffer.readString();
            this.world.handlePlayerChat(ws.player, type, message);
            break;
          }

          case Opcode.C2S_ATTACK_REQ: {
            if (!ws.player) break;
            const targetId = buffer.readUint32();
            this.world.handlePlayerAttackRequest(ws.player, targetId);
            break;
          }

          default:
            console.warn(`Received unhandled opcode: ${opcode}`);
        }
      } catch (err) {
        console.error('Error processing network packet:', err);
      }
    });
  }
}
