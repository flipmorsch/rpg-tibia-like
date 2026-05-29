## MODIFIED Requirements

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
