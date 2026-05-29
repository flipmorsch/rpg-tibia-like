## Context

Currently, all monsters are constructed from the generic `Monster` class with static properties, wandering code, and red-circle visual shapes. Standardizing on Class Inheritance (Option B) decouples monster-specific configs (lifepoints, speeds, aggro radii, colors, sizes, and EXP awards) into reusable, distinct subclasses while keeping shared routines (AoI sector updates, walking, combat ticks) inside the parent base class.

## Goals / Non-Goals

**Goals:**
* Refactor the `Monster` class to act as a parent class with configurable and overridable stat hooks (e.g. `getDamage()`, `getExp()`, `getAggroRange()`).
* Create concrete subclass files: `Rat.ts`, `CaveRat.ts`, `Orc.ts`, and `Dragon.ts` inheriting from `Monster`.
* Extend `S2C_ENTITY_SPAWN` network packets to include an optional `monsterTypeId` field for monsters.
* Adjust client rendering logic to draw distinct colors and scales based on the visual monster type.
* Place appropriate monsters on different map levels (Rats on surface, Orcs/Cave Rats in dungeon, Dragon boss on tower platforms).

**Non-Goals:**
* Custom behavior scripts or complex spell casting routines (monsters still chase and melee attack, but use custom stats).
* Level/EXP systems for monsters (monsters have static level metrics).

## Decisions

### 1. Monster Subclass Inheritance Layout
* **Decision**: We will define:
  ```typescript
  export class Monster implements AoIEntity {
    public monsterTypeId: number;
    // ... base constructor sets monsterTypeId and default stats ...
    public getDamageBounds(): { min: number; max: number };
    public getExpReward(): number;
    public getAggroRange(): number;
  }
  ```
  Subclasses will override these methods/properties:
  * `Rat`: `monsterTypeId = 1`, 30 HP, 60 speed, 0 aggro range, 15 EXP, damage 2-6.
  * `CaveRat`: `monsterTypeId = 2`, 45 HP, 65 speed, 5 aggro range, 25 EXP, damage 3-8.
  * `Orc`: `monsterTypeId = 3`, 120 HP, 75 speed, 5 aggro range, 110 EXP, damage 8-22.
  * `Dragon`: `monsterTypeId = 4`, 800 HP, 80 speed, 6 aggro range, 700 EXP, damage 25-70.
* **Alternative**: Store stats in JSON.
  * *Reasoning*: OOP Inheritance allows easy future extension for custom scripts (e.g. `Dragon.castFireball()`) which cannot be done cleanly with raw JSON templates.

### 2. Network Protocol Modification
* **Decision**: Extend `S2C_ENTITY_SPAWN` packet:
  * Read/write `monsterTypeId: uint8` at the very end of the packet, *only if* the spawned entity type is `EntityType.MONSTER` (2).
  * This avoids bloating player spawn packets.
* **Alternative**: Send separate packet for type updates.
  * *Reasoning*: Combining it during entity spawning avoids race conditions and guarantees the client draws the correct color immediately.

### 3. Visual Render Customization
* **Decision**: In `client/src/renderer.ts`, we draw entities based on their type ID:
  * Rat (`monsterTypeId === 1`): Small grey sphere, scale 0.8 of tile size.
  * Cave Rat (`monsterTypeId === 2`): Dark grey sphere, scale 0.85.
  * Orc (`monsterTypeId === 3`): Green sphere, scale 1.1.
  * Dragon (`monsterTypeId === 4`): Large orange sphere, scale 1.6, with extra dark-red border outline.

## Risks / Trade-offs

* **[Risk] Multiple subclass imports in GameWorld** → *Mitigation*: We will create a clean factory or entry point in `server/src/game/Monster.ts` or imports in `GameWorld.ts`.
* **[Risk] Monster Respawn Class Identification** → *Mitigation*: The respawn timer queue will preserve the specific concrete constructor (or store `monsterTypeId` to re-instantiate the correct subclass upon revival).
