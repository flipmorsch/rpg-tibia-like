## Context

Project Tibado currently supports walking, staircase floor changes, random monster wandering, and chat broadcasting. There is no representation of health (HP), targeting, experience points (EXP), or combat. Integrating these requires a unified client-server handshake for targeting, collision/range verification, combat state ticking, and player death/monster respawn scheduling.

## Goals / Non-Goals

**Goals:**
* Define the packet structure for client target requests, combat status, and floating numbers/damage markers.
* Translate canvas clicks into entity targeting.
* Implement a monster aggro state machine that scans for players within a 5-step radius on the same floor level and pursues them.
* Code a robust server-side combat interval check (2000ms weapon speed) for adjacent entities.
* Track player levels, experience, and EXP loss on death.
* Schedule a 1-minute respawn cooldown for defeated monsters.

**Non-Goals:**
* Complex A* pathfinding (a simplified grid-step chase algorithm is sufficient for this stage).
* Spellcasting, ranged weapons, or complex status effects (poison, stun).
* PVP combat toggles or skull systems.

## Decisions

### 1. Click-to-Target Coordinate Mapping
* **Rationale**: Translating viewport mouse clicks to world coordinates is done using the reverse camera projection math:
  $$\text{clickX} = \text{camX} + \frac{\text{offsetX} - \frac{\text{canvasWidth}}{2}}{\text{tileSize}}$$
  $$\text{clickY} = \text{camY} + \frac{\text{offsetY} - \frac{\text{canvasHeight}}{2}}{\text{tileSize}}$$
* **Alternative**: Clicking an entity from the HUD sidebar only. Left-clicking directly on the screen feels much more natural and aligned with classic MMORPG control schemes.

### 2. Aggressive Monster Movement & Chasing
* **Decision**: If a monster has a target player:
  1. If adjacent, stay in place and execute attacks.
  2. If not adjacent, compute delta step towards target:
     * Compare target coordinates and select direction: if $|\Delta x| > |\Delta y|$, try stepping on the X-axis first; otherwise try Y-axis.
     * Verify collision using `map.isWalkable()`. If walkable, move. If blocked, try the other axis.
* **Alternative**: Running full A* pathfinding on every tick.
  * *Reasoning*: A* is CPU intensive when scaling up the monster count. A simple direct step chase with orthogonal fallback is lightweight and mimics classic 2D grid pathing under normal conditions.

### 3. Combat Ticking Implementation
* **Decision**: Ticked within the 20Hz loop in `GameWorld.ts`.
  * Add `hp` and `maxHp` to players and monsters.
  * Maintain `lastAttackTime` on players and monsters. On every server tick, if `now - lastAttackTime >= 2000` and target is adjacent:
    * Apply random damage: `Math.floor(Math.random() * 10) + 5` (damage: 5 to 15).
    * Deduct HP. Broadcast `S2C_ENTITY_HP` and `S2C_COMBAT_EFFECT`.
* **Alternative**: Dedicated thread or high-frequency timers per player.
  * *Reasoning*: Synchronous evaluation inside the existing 20Hz loop preserves engine authority and guarantees deterministic order.

### 4. Floating Combat Damage Numbers
* **Decision**: Create an array of active visual effects on the client side:
  `effects: { x: number, y: number, text: string, color: string, spawnTime: number }[]`.
  * When `S2C_COMBAT_EFFECT` is parsed, push the effect.
  * In the client rendering loop, iterate and draw text, shifting its Y coordinate upward by `(now - spawnTime) * floatSpeed`.
  * Purge after `1000ms`.

## Risks / Trade-offs

* **[Risk] Monster Aggro CPU Overhead** → *Mitigation*: Monsters only scan for targets during their AI tick (once every 500ms), rather than the raw 50ms engine tick. Scans are scoped to the adjacent AoI sectors (`aoi.getEntitiesInAoI()`), keeping candidates low.
* **[Risk] Step Desync during chasing** → *Mitigation*: Chasing moves are handled exactly like regular walks. The server updates the sector and broadcasts `S2C_ENTITY_MOVE` to spectators, ensuring the client interpolates the monster's path smoothly.
