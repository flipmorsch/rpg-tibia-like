## 1. Shared Protocol & Classes Extensions

- [x] 1.1 Update `serializeSpawn` in `server/src/game/Monster.ts` to append `monsterTypeId` as a uint8 for monster spawns
- [x] 1.2 Update client network callback signature and parser in `client/src/network.ts` to decode `monsterTypeId` for spawned monsters
- [x] 1.3 Verify project builds and compiles after protocol extensions

## 2. Server Subclasses & Game World

- [x] 2.1 Modify base `Monster` in `server/src/game/Monster.ts` with overridable methods `getDamageBounds`, `getExpReward`, and `getAggroRange`
- [x] 2.2 Create `Rat` class inheriting from `Monster` in `server/src/game/Rat.ts` (30 HP, 60 speed, 0 aggro, 15 EXP, damage 2-6)
- [x] 2.3 Create `CaveRat` class inheriting from `Monster` in `server/src/game/CaveRat.ts` (45 HP, 65 speed, 5 aggro, 25 EXP, damage 3-8)
- [x] 2.4 Create `Orc` class inheriting from `Monster` in `server/src/game/Orc.ts` (120 HP, 75 speed, 5 aggro, 110 EXP, damage 8-22)
- [x] 2.5 Create `Dragon` class inheriting from `Monster` in `server/src/game/Dragon.ts` (800 HP, 80 speed, 6 aggro, 700 EXP, damage 25-70)
- [x] 2.6 Refactor `GameWorld.ts`'s `spawnMonsters` and `respawnMonster` to instantiate the appropriate concrete subclasses based on maps/elevation
- [x] 2.7 Refactor `GameWorld.ts`'s `tickMonsterAI` and `tickCombat` to invoke overridable methods for aggro scans, damage bounds, and EXP rewards

## 3. Client Viewport Visuals

- [x] 3.1 Update `ClientEntity` interface and `spawnEntity` parameters in `client/src/interpolation.ts` to track `monsterTypeId`
- [x] 3.2 Update `client/src/main.ts` callbacks hookup to support `monsterTypeId` parameters
- [x] 3.3 Refactor `client/src/renderer.ts` to draw distinct shapes (scales, outline widths, fill colors) based on the visual monster type ID
