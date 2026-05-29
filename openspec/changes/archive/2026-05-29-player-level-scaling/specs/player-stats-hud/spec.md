## ADDED Requirements

### Requirement: Player stats HUD displays all crucial player information

The client SHALL render a player stats panel showing the player's name, level, experience progress, HP bar with current and maximum values, speed, movement cooldown, and attack damage range.

#### Scenario: HP bar renders

- **WHEN** a player snapshot is available with hp and maxHp values
- **THEN** the component renders a progress bar showing the hp-to-maxHp ratio as a filled bar with percentage label

#### Scenario: Stats update on snapshot change

- **WHEN** the player's HP, level, or speed changes in the world snapshot
- **THEN** the component re-renders with the updated values within one animation frame

#### Scenario: Placeholder before snapshot ready

- **WHEN** no player snapshot is available (not yet connected or loading)
- **THEN** the component renders placeholder text indicating stats are loading

---

### Requirement: Player stats component follows selector-driven architecture

The player stats HUD SHALL be a Stencil Shadow DOM web component whose data is driven by feature selectors, consistent with the existing `client-ui-feature-modules` architecture.

#### Scenario: Component receives data via props

- **WHEN** the player stats component renders
- **THEN** it receives all display data through Stencil `@Prop()` bindings, not by accessing the DOM or core services directly

#### Scenario: Feature state drives the component

- **WHEN** the world snapshot updates
- **THEN** a feature controller produces state, selectors derive props, and the component receives them through its parent's subscription callback

---

### Requirement: Sidebar uses player stats component

The client sidebar SHALL replace the raw DOM stat rows with the `<player-stats>` custom element.

#### Scenario: Sidebar contains the component

- **WHEN** the client HTML loads
- **THEN** the sidebar character section contains a `<player-stats>` element instead of individual `<span>` elements for each stat

#### Scenario: Client wires the component

- **WHEN** the game client initializes
- **THEN** it subscribes to a player stats controller and writes props to the `<player-stats>` element on each snapshot update
