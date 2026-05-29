## MODIFIED Requirements

### Requirement: Monster Aggro Behavior
A monster SHALL actively scan its surrounding 3D area on the same Z elevation and target the first player who enters within its class-specific Aggro Range (0 for Rat, 5 for Cave Rat/Orc, 6 for Dragon).

#### Scenario: Player enters monster aggro range
- **WHEN** a player moves to within a distance matching the monster subclass's Aggro Range on the same Z elevation
- **THEN** the monster targets the player, switches from wandering to chasing state, and moves toward the player on its movement tick

---

### Requirement: Auto-Attack Interval and Range
Targeted combat auto-attacks SHALL only execute when the attacker is adjacent to its target (1 tile in cardinal or diagonal directions) and the attacker's attack cooldown has expired. Damage dealt is determined by class-specific damage bounds.

#### Scenario: Adjacent auto-attack tick execution
- **WHEN** an entity has a target, is adjacent to it, and 2000 milliseconds have elapsed since its last attack
- **THEN** the entity performs an attack, calculates class-specific damage bounds (e.g. 5-15 for player, 2-6 for Rat, 3-8 for Cave Rat, 8-22 for Orc, 25-70 for Dragon), subtracts it from the target's HP, resets its attack timer, and broadcasts the combat effect/damage numbers to nearby spectators

---

### Requirement: Monster Death and Respawn
When a monster's HP reaches 0, the server SHALL despawn it immediately, award subclass-specific EXP to the killing player, and queue a respawn timer to recreate the monster at its home coordinate after exactly 60 seconds.

#### Scenario: Monster HP drops to zero
- **WHEN** a monster's HP is reduced to 0 or less
- **THEN** the server awards custom experience points (e.g., 15 for Rat, 25 for Cave Rat, 110 for Orc, 700 for Dragon) to the killer, removes the monster from the world, broadcasts a despawn packet, and schedules a timer to respawn a new instance of the monster at its starting coordinates after 60,000 milliseconds
