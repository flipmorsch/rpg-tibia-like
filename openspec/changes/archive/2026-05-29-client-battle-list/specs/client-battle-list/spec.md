## ADDED Requirements

### Requirement: Distance-Based Sorting

The client Battle List SHALL sort all active visible entities by their Chebyshev distance to the local player in ascending order (nearest to farthest).

#### Scenario: Display nearest entity first

- **WHEN** the player is near a Rat at distance 2 and an Orc at distance 5
- **THEN** the Rat appears above the Orc in the Battle List

### Requirement: Interactive Combat Targeting

Left-clicking any entity row in the Battle List SHALL send an attack network command to the server and register the entity as the active target in the client renderer.

#### Scenario: Click row to attack target

- **WHEN** the player clicks a monster's row in the Battle List
- **THEN** the client transmits a C2S_ATTACK_REQ message for that monster ID, and the row receives an active target highlight outline

### Requirement: Entity Health Percentage Bars

Each entity row in the Battle List SHALL render a visual health bar depicting the entity's remaining health percentage, color-coded by severity status.

#### Scenario: Display remaining HP bar

- **WHEN** a monster has 50 out of 100 max HP
- **THEN** its health bar renders at 50% width in yellow warning color

### Requirement: Render Frequency Throttling

The Battle List update cycle SHALL run at a throttled interval of at least 100ms to avoid unnecessary DOM operations during high-frequency visual updates.

#### Scenario: Throttling updates

- **WHEN** the main client update loop ticks at 60Hz
- **THEN** the Battle List DOM rebuilding function executes at most once every 100ms
