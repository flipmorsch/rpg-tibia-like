## ADDED Requirements

### Requirement: Monster Class Hierarchy
The server SHALL define an inheritance structure where concrete monster classes (Rat, CaveRat, Orc, Dragon) inherit from a common base Monster class and configure their own base properties (HP, maxHP, speed, aggroRange, visual typeId, damage bounds, and experience rewards).

#### Scenario: Concrete monster initialization
- **WHEN** a concrete monster instance (e.g., Orc) is spawned
- **THEN** it initializes with its subclass-specific stats (120 HP, 75 speed, 5 aggro range, typeId 3) and home spawn coordinate

---

### Requirement: Network Monster Type Propagation
The server SHALL serialize the monster's type ID as a single byte field within the `S2C_ENTITY_SPAWN` packet, and the client SHALL parse this byte field to update its local representation.

#### Scenario: Parsing monster type on client
- **WHEN** a client receives an `S2C_ENTITY_SPAWN` packet with entity type MONSTER (2)
- **THEN** it reads the additional type ID byte and sets the visual type ID property on the spawned client-side entity model

---

### Requirement: Distinct Monster Rendering
The client SHALL render different circles (sizes, fill colors, and line widths) in the viewport representing different monster species based on their type ID.

#### Scenario: Drawing a Rat in viewport
- **WHEN** a client renders a MONSTER of type ID 1 (Rat)
- **THEN** it draws a small circle (0.8 scale of tile size) filled with a light grey color (`#9ca3af`)

#### Scenario: Drawing a Dragon in viewport
- **WHEN** a client renders a MONSTER of type ID 4 (Dragon)
- **THEN** it draws a large circle (1.6 scale of tile size) filled with a bright orange color (`#ea580c`)
