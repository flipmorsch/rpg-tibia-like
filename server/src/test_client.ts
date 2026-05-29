import WebSocket from 'ws';
import { ByteBuffer, Opcode } from 'shared';

console.log("Connecting to ws://localhost:8080...");
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log("Connected! Sending login request for 'TestPlayer'...");
  const buffer = new ByteBuffer(32);
  buffer.writeUint8(Opcode.C2S_LOGIN_REQ);
  buffer.writeString("TestPlayer");
  ws.send(buffer.getPayload());
});

ws.on('message', (data) => {
  // Safe buffer conversion for Node.js
  let uint8: Uint8Array;
  if (data instanceof Buffer) {
    uint8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  } else {
    uint8 = new Uint8Array(data as ArrayBuffer);
  }

  const buffer = new ByteBuffer(uint8);
  try {
    const opcode = buffer.readUint8();
    console.log(`Received opcode: ${opcode} (${Opcode[opcode]})`);
    
    if (opcode === Opcode.S2C_ENTITY_SPAWN) {
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
      if (type === 2) {
        monsterTypeId = buffer.readUint8();
      }
      console.log(`  -> Spawned Entity: ID=${id}, Type=${type}, Name="${name}", Pos=(${x},${y},${z}), MonsterType=${monsterTypeId}`);
    }
  } catch (err) {
    console.error("  -> Error parsing packet:", err);
  }
});

ws.on('error', (err) => {
  console.error("Socket error:", err);
});

ws.on('close', () => {
  console.log("Connection closed.");
});

setTimeout(() => {
  console.log("Closing test client.");
  ws.close();
  process.exit(0);
}, 3000);
