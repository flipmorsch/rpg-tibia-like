## ADDED Requirements

### Requirement: Combat Targeting
The client and server SHALL allow players to select a target entity by left-clicking it in the viewport.

#### Scenario: Left-clicking an entity selects it as target
- **WHEN** a player clicks on the grid coordinates occupied by another entity (player or monster)
- **THEN** the client sends a targeting request to the server, and the server sets that entity as the player's current target

#### Scenario: Left-clicking empty space clears target
- **WHEN** a player clicks on grid coordinates containing no entities on the current floor
- **THEN** the client sends a target clear request to the server, and the server clears the player's current target

---

### Requirement: Monster Aggro Behavior
A monster SHALL actively scan its surrounding 3D area on the same Z elevation and target the first player who enters within a Manhattan distance of 5 tiles.

#### Scenario: Player enters monster aggro range
- **WHEN** a player moves to within 5 tiles of a wandering monster on the same Z elevation
- **THEN** the monster targets the player, switches from wandering to chasing state, and moves toward the player on its movement tick

---

### Requirement: Auto-Attack Interval and Range
Targeted combat auto-attacks SHALL only execute when the attacker is adjacent to its target (1 tile in cardinal or diagonal directions) and the attacker's attack cooldown has expired.

#### Scenario: Adjacent auto-attack tick execution
- **WHEN** an entity has a target, is adjacent to it, and 2000 milliseconds have elapsed since its last attack
- **THEN** the entity performs an attack, calculates damage, subtracts it from the target's HP, resets its attack timer, and broadcasts the combat effect/damage numbers to nearby spectators

---

### Requirement: Player Death Penalty
When a player's HP reaches 0, the server SHALL apply a death penalty that reduces their Experience Points (EXP), restores their health, and teleports them back to the starting point.

#### Scenario: Player HP drops to zero
- **WHEN** a player's HP is reduced to 0 or less
- **THEN** the server subtracts 10% of their current EXP, resets their HP to max, teleports them back to coordinates (64, 64, 7), clears their target, and broadcasts a despawn/respawn update to nearby players

---

### Requirement: Monster Death and Respawn
When a monster's HP reaches 0, the server SHALL despawn it immediately and queue a respawn timer to recreate the monster at its home coordinate after exactly 60 seconds.

#### Scenario: Monster HP drops to zero
- **WHEN** a monster's HP is reduced to 0 or less
- **THEN** the server removes the monster from the world, broadcasts a despawn packet, and schedules a timer to respawn a new instance of the monster at its starting coordinates after 60,000 milliseconds
