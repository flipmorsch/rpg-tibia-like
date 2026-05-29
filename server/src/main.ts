import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { GameWorld } from './game/GameWorld.js';
import { WebSocketController } from './ws/WebSocketController.js';
import { GameSocket } from './ws/GameSocket.js';
import { ByteBuffer, Opcode } from 'shared';

const PORT = 8080;
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Project Tibado Server Running\n');
});

const wss = new WebSocketServer({ server });
const world = new GameWorld();
const controller = new WebSocketController(world);

wss.on('connection', (ws: GameSocket) => {
  controller.handleConnection(ws);
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

