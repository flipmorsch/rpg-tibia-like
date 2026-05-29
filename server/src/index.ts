import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { GameWorld } from './game/GameWorld.js';
import { Player } from './game/Player.js';
import { ByteBuffer, Opcode } from 'shared';

interface GameSocket extends WebSocket {
  player?: Player;
  isAlive?: boolean;
}

const PORT = 8080;
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Project Tibado Server Running\n');
});

const wss = new WebSocketServer({ server });
const world = new GameWorld();

wss.on('connection', (ws: GameSocket) => {
  ws.isAlive = true;
  console.log('New connection established');

  // Handle client disconnection
  ws.on('close', () => {
    if (ws.player) {
      world.handlePlayerDisconnect(ws.player);
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
      // Cast Buffer to Uint8Array safely
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
          const player = world.handlePlayerLogin(username, ws);
          ws.player = player;
          break;
        }

        case Opcode.C2S_MOVE_REQ: {
          if (!ws.player) break;
          const direction = buffer.readUint8();
          world.handlePlayerMoveRequest(ws.player, direction);
          break;
        }

        case Opcode.C2S_CHAT_REQ: {
          if (!ws.player) break;
          const type = buffer.readUint8();
          const message = buffer.readString();
          world.handlePlayerChat(ws.player, type, message);
          break;
        }

        case Opcode.C2S_ATTACK_REQ: {
          if (!ws.player) break;
          const targetId = buffer.readUint32();
          world.handlePlayerAttackRequest(ws.player, targetId);
          break;
        }

        default:
          console.warn(`Received unhandled opcode: ${opcode}`);
      }
    } catch (err) {
      console.error('Error processing network packet:', err);
    }
  });
});

// Periodic connection check (heartbeat)
const interval = setInterval(() => {
  wss.clients.forEach((client: GameSocket) => {
    if (client.isAlive === false) {
      console.log('Terminating dead connection');
      return client.terminate();
    }
    client.isAlive = false;
    client.ping();

    // Send a tick heartbeat package
    if (client.player) {
      const hb = new ByteBuffer(8);
      hb.writeUint8(Opcode.S2C_HEARTBEAT);
      client.player.sendPacket(hb.getPayload());
    }
  });
}, 10000);

wss.on('close', () => {
  clearInterval(interval);
  world.stopTickLoop();
});

server.listen(PORT, () => {
  console.log(`Tibado Game Server listening on port ${PORT}`);
});
