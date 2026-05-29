## ADDED Requirements

### Requirement: Enforced Testing Configuration Rules
The OpenSpec workflow SHALL enforce that all change proposals and task lists define testing strategy and contain automated test implementation tasks.

#### Scenario: Verify config rules exist
- **WHEN** loading the `openspec/config.yaml` file
- **THEN** it contains rules requiring test definitions in proposals and test tasks in tasks files

### Requirement: Unified Monorepo Test Execution
The project codebase SHALL configure a single root-level `npm test` script that executes tests across all sub-workspaces (`shared`, `server`, `client`) in parallel.

#### Scenario: Running workspace tests
- **WHEN** executing `npm test` at the root directory
- **THEN** Vitest executes tests for all configured workspaces and outputs results

### Requirement: Core Logic Tests
The automated test suite SHALL cover unit test cases for the `ByteBuffer` binary protocol, `MapGrid` stairs transitions, and `CombatSystem` damage formulas.

#### Scenario: Validating ByteBuffer serializations
- **WHEN** reading or writing raw byte buffers using the shared custom binary protocol
- **THEN** it correctly serializes and deserializes values without corruption

#### Scenario: Validating map stair transitions
- **WHEN** a player moves onto stair tiles on the MapGrid
- **THEN** their Z coordinate increments or decrements correctly

#### Scenario: Validating combat damage application
- **WHEN** combat damage is applied to an entity in the CombatSystem
- **THEN** the entity's HP decreases by the expected amount, and level ups or deaths trigger appropriately
