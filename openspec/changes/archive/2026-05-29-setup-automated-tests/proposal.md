## Why

The Tibado MMORPG server and client currently lack an automated test suite. Introducing an automated testing framework and establishing rules to make tests mandatory for all new features will ensure stability, prevent regressions in game loop mechanics and network packets, and elevate codebase quality as the game scales.

## What Changes

- **Testing Infrastructure**: Install and configure `vitest` across all workspaces (`shared`, `server`, `client`) as the unified ESM-compatible testing framework.
- **Root-level Test Suite**: Add a central `npm test` script to run tests in parallel across all workspaces.
- **First Core Tests**: Implement initial unit and integration tests covering custom binary serialization (`shared`), spatial movement and stairs boundaries (`server/map`), and combat calculations (`server/combat`).
- **OpenSpec Enforcement Rules**: Update `openspec/config.yaml` to enforce that all future change proposals and task lists include test definitions and task checkboxes for unit/integration tests.

## Capabilities

### New Capabilities

- `automated-testing-enforcement`: Enforce mandatory automated tests for all feature developments, configure `vitest` workspace testing, and define baseline game logic unit tests.

### Modified Capabilities

None.

## Impact

- **Build / Tooling**: Adds `vitest` as a devDependency in root, `shared`, `server`, and `client` package configurations.
- **Workflow / Process**: Developers must include automated test coverage task items in all future OpenSpec proposals before merging.
