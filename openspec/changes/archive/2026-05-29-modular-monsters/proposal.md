## Why

Currently, all monsters share the same hardcoded stats (HP, speed, aggro range) and visual appearance (red sphere) via the generic `Monster` class. Splitting this into a modular inheritance structure allows us to easily add varied creatures (Rats, Orcs, Dragons) with distinct combat difficulty, visual coloring, behavior traits, and experience yields.

## What Changes

* **Monster Subclassing (Option B)**: Refactor the base `Monster` class to be abstract or parameterized, and create concrete subclasses:
  * `Rat`: 30 HP, 60 speed, 0 aggro range (passive), small grey circle. Spawns on Z=7 surface.
  * `CaveRat`: 45 HP, 65 speed, 5 aggro range, dark grey circle. Spawns on Z=8 dungeon.
  * `Orc`: 120 HP, 75 speed, 5 aggro range, medium green circle. Spawns on Z=8 dungeon.
  * `Dragon`: 800 HP, 80 speed, 6 aggro range, large orange circle. Spawns on Z=6 tower platforms.
* **Aggro Rule Modularization**: Subclasses govern their own aggression parameters.
* **Expanded Network Spawn Packet**: Add a `monsterType` byte field to the `S2C_ENTITY_SPAWN` payload so the client knows which color and size of circle to render.
* **Client Render Dispatching**: Renders distinct sizes, colors, and visual tags depending on the spawn entity's type.

## Capabilities

### New Capabilities

- `modular-monsters`: Base class definitions and concrete monster type overrides for stats and render parameters.

### Modified Capabilities

- `battle-system`: Spawning rules, attack damage ranges, and reward calculations are now class-specific instead of globally uniform.

## Impact

* **Shared Protocol**:
  * `shared/src/protocol.ts`: Spawn packets will now serialize/deserialize `monsterType` (`uint8`).
* **Server Game Systems**:
  * `server/src/game/Monster.ts`: Shifted to base class, created subclass files (`Rat.ts`, `CaveRat.ts`, `Orc.ts`, `Dragon.ts`).
  * `server/src/game/GameWorld.ts`: Update monster spawning loops to instantiate the correct classes by floor Z-levels. Calculate custom damage ranges by invoking subclass attack damage getters.
* **Client Viewport & Renderer**:
  * `client/src/network.ts`: Decode `monsterType` and propagate it to the client entity model.
  * `client/src/interpolation.ts`: Store `monsterType` on `ClientEntity`.
  * `client/src/renderer.ts`: Draw distinct colors, sizes, and outlines based on `monsterType`.
