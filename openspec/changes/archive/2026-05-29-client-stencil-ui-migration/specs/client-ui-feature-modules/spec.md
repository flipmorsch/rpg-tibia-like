## ADDED Requirements

### Requirement: Per-feature UI state

Each UI feature SHALL own its local state and expose selectors for rendering.

#### Scenario: Battle List selector

- **WHEN** the Battle List UI renders
- **THEN** it receives its list model from feature selectors

### Requirement: UI components are selector-driven

UI components SHALL render only from selector outputs and SHALL NOT query the DOM or core services directly.

#### Scenario: Component data flow

- **WHEN** the Chat Panel renders
- **THEN** it consumes props from selectors rather than reading core state directly

### Requirement: UI and gameplay features are distinct

UI-oriented features SHALL be separated from gameplay features to avoid cross-domain coupling.

#### Scenario: UI intent routing

- **WHEN** a UI component emits an intent event
- **THEN** a UI feature controller translates it into a gameplay event
