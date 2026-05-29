# battle-system Specification

## Purpose
TBD - created by archiving change battle-system. Update Purpose after archive.
## Requirements
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
A monster SHALL actively scan its surrounding 3D area on the same Z elevation and target the first player who enters within its class-specific Aggro Range (0 for Rat, 5 for Cave Rat/Orc, 6 for Dragon).

#### Scenario: Player enters monster aggro range
- **WHEN** a player moves to within a distance matching the monster subclass's Aggro Range on the same Z elevation
- **THEN** the monster targets the player, switches from wandering to chasing state, and moves toward the player on its movement tick

---

### Requirement: Auto-Attack Interval and Range

Targeted combat auto-attacks SHALL only execute when the attacker is adjacent to its target (1 tile in cardinal or diagonal directions) and the attacker's attack cooldown has expired. Damage dealt is determined by class-specific damage bounds.

For players, damage bounds and attack cooldown scale with level:
- **Damage**: `min = 10 + level * 3, max = 20 + level * 4`
- **Attack cooldown**: `max(500, 2000 - level * 35)` milliseconds

For monsters, damage bounds and attack cooldown remain class-specific and static.

#### Scenario: Adjacent auto-attack tick execution

- **WHEN** an entity has a target, is adjacent to it, and its attack cooldown has expired
- **THEN** the entity performs an attack, calculates class-specific damage bounds (for players: level-scaled as described above; for monsters: 2-6 for Rat, 3-8 for Cave Rat, 8-22 for Orc, 25-70 for Dragon), subtracts it from the target's HP, resets its attack timer using the entity's cooldown (for players: level-scaled; for monsters: 2000ms), and broadcasts the combat effect/damage numbers to nearby spectators

#### Scenario: Player damage scales with level

- **WHEN** a level 10 player performs an adjacent attack and the cooldown has expired
- **THEN** the damage dealt is randomly chosen between 40 and 60, and the attack cooldown resets to 1650ms

#### Scenario: Monster damage is static

- **WHEN** a Dragon performs an adjacent attack on its target and its 2000ms cooldown has expired
- **THEN** the damage dealt is randomly chosen between 25 and 70 regardless of the player's level

---

### Requirement: Player Death Penalty
When a player's HP reaches 0, the server SHALL apply a death penalty that reduces their Experience Points (EXP), restores their health, and teleports them back to the starting point.

#### Scenario: Player HP drops to zero
- **WHEN** a player's HP is reduced to 0 or less
- **THEN** the server subtracts 10% of their current EXP, resets their HP to max, teleports them back to coordinates (64, 64, 7), clears their target, and broadcasts a despawn/respawn update to nearby players

---

### Requirement: Monster Death and Respawn
When a monster's HP reaches 0, the server SHALL despawn it immediately, award subclass-specific EXP to the killing player, and queue a respawn timer to recreate the monster at its home coordinate after exactly 60 seconds.

#### Scenario: Monster HP drops to zero
- **WHEN** a monster's HP is reduced to 0 or less
- **THEN** the server awards custom experience points (e.g., 15 for Rat, 25 for Cave Rat, 110 for Orc, 700 for Dragon) to the killer, removes the monster from the world, broadcasts a despawn packet, and schedules a timer to respawn a new instance of the monster at its starting coordinates after 60,000 milliseconds

