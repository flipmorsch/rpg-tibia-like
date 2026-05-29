## Why

Currently, players can walk around the 2D grid map and change floors, and monsters wander randomly. However, there is no active battle system, health tracking, targeting mechanism, or interactive monster behavior. Adding combat, aggro, and death penalties transitions the engine from a walking simulator to an interactive game.

## What Changes

* **Combat Targeting (Left-Click)**: Players can select a combat target (monster or other player) by left-clicking it in the client canvas viewport.
* **Auto-Attack System**: Once a target is selected, players and monsters auto-attack on a regular time interval (melee-range check).
* **Monster Aggro Behavior**: Monsters will actively scan for players on their floor, chase the first player that comes within 5 steps, and attack them when adjacent.
* **Health & Damage State**: Entities track Health Points (HP) and Max Health. Floating damage numbers and combat effects are broadcast to all nearby players.
* **Death & Respawn Mechanics**:
  * Player death results in teleportation back to the starting point, full health restoration, and loss of Experience Points (EXP).
  * Monster death results in immediate despawning and queuing of a respawn timer to recreate the monster at its origin coordinate after exactly 1 minute.
* **Network Protocol Extensions**: Add opcodes and serialization/deserialization for combat requests, entity stats (HP/MaxHP), combat indicators, and EXP updates.

## Capabilities

### New Capabilities

- `battle-system`: Core capability covering targeting, auto-attack timers, monster chasing/aggro, health/damage sync, EXP tracking/loss, and monster respawns.

### Modified Capabilities

*(None - empty specifications directory)*

## Impact

* **Shared Component**:
  * `shared/src/protocol.ts`: New Opcodes (`C2S_ATTACK_REQ`, `S2C_ENTITY_HP`, `S2C_COMBAT_EFFECT`, `S2C_PLAYER_EXP`), byte serialization changes.
* **Server Components**:
  * `server/src/game/Player.ts`: Track target, health, levels, experience, and death states.
  * `server/src/game/Monster.ts`: Track target, health, home spawn coordinate, aggro states, and respawn timings.
  * `server/src/game/GameWorld.ts`: Coordinate attacks, tick combat timer checks, execute pathing for aggressive monsters, process death penalty, and handle respawn timers.
* **Client Components**:
  * `client/src/main.ts`: Handle mouse click targeting on the viewport, send C2S target packets.
  * `client/src/network.ts`: Parse S2C combat, health, and EXP packets.
  * `client/src/renderer.ts`: Draw targeting indicator, actual health bars instead of mocks, floaty damage numbers, and player EXP HUD.
  * `client/src/interpolation.ts`: Store health status, active combat targets, and floating combat text markers.
