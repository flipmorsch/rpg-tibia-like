## 1. Network & Protocol Modularization

- [x] 1.1 Create `server/src/ws/` folder structure and move GameSocket interfaces and connection management logic into it
- [x] 1.2 Implement `ConnectionManager` to keep track of active WebSockets mapped to player IDs
- [x] 1.3 Update `Player.ts` model to remove raw WebSocket references, shifting S2C writes to the `ConnectionManager` interface
- [x] 1.4 Move the message handling / server entry point routing from `server/src/index.ts` to `server/src/ws/WebSocketController.ts`

## 2. Spatial Map Modularization

- [x] 2.1 Move `MapGrid.ts` from `server/src/game/` to a dedicated `server/src/map/` folder
- [x] 2.2 Move `AoIManager.ts` to `server/src/map/` and update references to use imports from the `map` module

## 3. Player & Monster Feature Modularization

- [x] 3.1 Move player state/actions from `server/src/game/Player.ts` to `server/src/player/` folder
- [x] 3.2 Relocate monster classes and subclasses (`Monster.ts`, `Rat.ts`, `CaveRat.ts`, `Orc.ts`, `Dragon.ts`) to `server/src/monster/` folder
- [x] 3.3 Relocate monster AI wandering/chasing state loop execution to a dedicated file in `server/src/monster/MonsterAI.ts`

## 4. Combat System Modularization

- [x] 4.1 Separate combat loop (adjacent check, damage formula, HP updates) into `server/src/combat/CombatSystem.ts`
- [x] 4.2 Move player death penalty and experience distribution to `server/src/combat/DeathManager.ts`

## 5. Server Bootstrap & Verification

- [x] 5.1 Create the clean bootstrap entry point `server/src/main.ts` initializing map, spawner, connection registry, and loop schedules
- [x] 5.2 Update `server/package.json` entry points and dev scripts to point to `dist/main.js` instead of `dist/index.js`
- [x] 5.3 Verify successful clean build and run tests to confirm the server remains backward-compatible with client communication
