## ADDED Requirements

### Requirement: Max HP scales with level

The player's maximum HP SHALL increase by 25 per level gained, starting from a base of 100 at level 1.

#### Scenario: Level-up increases max HP

- **WHEN** a player gains a level
- **THEN** their maxHp increases by 25 and their current hp is restored to the new maxHp value

#### Scenario: Max HP at level 10

- **WHEN** a player reaches level 10
- **THEN** their maxHp SHALL be exactly 325

#### Scenario: Max HP at level 30

- **WHEN** a player reaches level 30
- **THEN** their maxHp SHALL be exactly 825

---

### Requirement: Move speed scales with level

The player's move speed SHALL increase by 4 per level gained, starting from 100 at level 1, with a hard cap at 250.

#### Scenario: Level-up increases speed

- **WHEN** a player gains a level
- **THEN** their speed increases by 4, unless it would exceed the cap of 250

#### Scenario: Speed at level 10

- **WHEN** a player reaches level 10
- **THEN** their speed SHALL be exactly 136

#### Scenario: Speed caps at 250

- **WHEN** a player's speed would exceed 250 from a level-up
- **THEN** their speed is clamped to 250 and subsequent level-ups do not increase it further

---

### Requirement: Attack damage scales with level

The player's attack damage bounds SHALL scale with level using the formula `min = 10 + level * 3, max = 20 + level * 4`.

#### Scenario: Damage at level 1

- **WHEN** a level 1 player performs an attack
- **THEN** the damage dealt is randomly chosen between 13 and 24 inclusive

#### Scenario: Damage at level 10

- **WHEN** a level 10 player performs an attack
- **THEN** the damage dealt is randomly chosen between 40 and 60 inclusive

#### Scenario: Damage at level 30

- **WHEN** a level 30 player performs an attack
- **THEN** the damage dealt is randomly chosen between 100 and 140 inclusive

---

### Requirement: Attack cooldown scales with level

The player's attack cooldown SHALL decrease with level using the formula `max(500, 2000 - level * 35)`, starting from 1965ms at level 1 and bottoming out at 500ms.

#### Scenario: Attack cooldown at level 1

- **WHEN** a level 1 player attacks
- **THEN** their attack cooldown is set to 1965 milliseconds

#### Scenario: Attack cooldown at level 10

- **WHEN** a level 10 player attacks
- **THEN** their attack cooldown is set to 1650 milliseconds

#### Scenario: Attack cooldown floors at 500ms

- **WHEN** a player reaches level 43 or higher
- **THEN** their attack cooldown is clamped at the minimum of 500 milliseconds

---

### Requirement: Level-up broadcast includes all scaled attributes

The server SHALL send the player's experience, level, speed, and max HP in a single packet on level-up, death, and login.

#### Scenario: Packet content on level-up

- **WHEN** the server broadcasts a player's level-up
- **THEN** the packet SHALL contain experience (uint32), level (uint16), speed (uint16), and maxHp (uint16)
