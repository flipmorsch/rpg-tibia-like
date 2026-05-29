## 1. Server-Side Attribute Scaling

- [x] 1.1 Add formula helper methods to `Player.ts` (getMaxHp, getSpeed, getDamageBounds, getAttackCooldown for current level)
- [x] 1.2 Update `DeathManager.handleMonsterDeath` level-up block to apply speed increase and use new formula values
- [x] 1.3 Update `CombatSystem` player attack path to use level-scaled damage bounds and attack cooldown

## 2. Protocol Extension

- [x] 2.1 Extend `broadcastPlayerExp` in `GameWorld.ts` to write speed and maxHp into `S2C_PLAYER_EXP` packet
- [x] 2.2 Extend `handlePlayerExp` and `S2C_PLAYER_EXP` parser in `client/src/network.ts` to read speed and maxHp
- [x] 2.3 Update `GameClient.handlePlayerExp` to store received speed and maxHp in local state

## 3. Client Data Propagation

- [x] 3.1 Fix `handleLoginSuccess` in `main.ts` to pass hp and maxHp from spawn packet to `spawnEntity`
- [x] 3.2 Add `hp` and `maxHp` fields to `PlayerSnapshot` in `worldSnapshot.ts`
- [x] 3.3 Update `updateWorldSnapshot` in `main.ts` to map hp and maxHp into PlayerSnapshot

## 4. Player Stats Component

- [x] 4.1 Create `player-stats` feature state, selectors, and controller under `client/src/ui/features/player-stats/`
- [x] 4.2 Create `player-stats` Stencil component with HP bar, level, exp, speed, cooldown, and damage display
- [x] 4.3 Add event wiring in `main.ts` to subscribe player stats controller to world snapshots and push props to the component

## 5. Sidebar Integration

- [x] 5.1 Replace raw DOM stat rows in `index.html` sidebar with `<player-stats>` custom element
- [x] 5.2 Remove direct DOM stat updates (`getElementById` calls) from `main.ts` that are now covered by the component

## 6. Testing

- [x] 6.1 Add unit tests for attribute scaling formulas at levels 1, 5, 10, 20, 30, and 50
- [x] 6.2 Add integration test for `S2C_PLAYER_EXP` extended packet parsing
- [x] 6.3 Add UI test for player stats component rendering HP bar and updating on prop change
- [x] 6.4 Run existing vitest suite and verify all 37 tests pass
- [x] 6.5 Manual verification: level up through Rat → CaveRat → Orc kills and confirm stats display correctly
