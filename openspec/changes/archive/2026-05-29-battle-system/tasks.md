## 1. Shared Protocol Modifications

- [x] 1.1 Add new Opcodes `C2S_ATTACK_REQ` (103), `S2C_ENTITY_HP` (9), `S2C_COMBAT_EFFECT` (10), and `S2C_PLAYER_EXP` (11) to `shared/src/protocol.ts`
- [x] 1.2 Verify `ByteBuffer` capacity utilities compile successfully after protocol additions

## 2. Server Implementation

- [x] 2.1 Add `hp`, `maxHp`, `targetId`, `lastAttackTime`, `exp` and `level` fields to `Player` in `server/src/game/Player.ts`
- [x] 2.2 Add `hp`, `maxHp`, `targetId`, `lastAttackTime`, and `homePos` fields to `Monster` in `server/src/game/Monster.ts`
- [x] 2.3 Update entity serialization methods (`serializeSpawn`) to include current HP and max HP status values
- [x] 2.4 Implement C2S attack message parsing inside the server main websocket router in `server/src/index.ts`
- [x] 2.5 Code the aggressive monster scanning and chasing logic in `server/src/game/GameWorld.ts` within the AI tick callback
- [x] 2.6 Code the periodic auto-attack execution tick and collision distance checking inside the game loop tick
- [x] 2.7 Code the player death handler in `GameWorld.ts` to reduce EXP, reset stats, and teleport player to starting coordinate
- [x] 2.8 Code the monster death and 1-minute respawn timer scheduling inside `GameWorld.ts`

## 3. Client & Viewport UI

- [x] 3.1 Implement click mapping in `client/src/main.ts` translating viewport click offsets into world coordinates
- [x] 3.2 Add mouse click callback routing to search for clicked entity visual coordinates and send `C2S_ATTACK_REQ` packets
- [x] 3.3 Add network callbacks for `S2C_ENTITY_HP`, `S2C_COMBAT_EFFECT`, and `S2C_PLAYER_EXP` in `client/src/network.ts`
- [x] 3.4 Bind incoming packets to update health states and draw floating damage numbers in `client/src/interpolation.ts` and `client/src/renderer.ts`
- [x] 3.5 Animate floating damage text in the render loops and clear expired markers after 1000ms
- [x] 3.6 Draw a visual target red border selection around the player's current targeted entity
