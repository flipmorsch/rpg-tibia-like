## Context

The Project Tibado game engine currently lacks any automated test infrastructure. All behavior validations are done via manual client checks or raw scratch scripts. Setting up a robust testing framework and enforcing testing rules within OpenSpec ensures new features will not regress core game loop logic, combat formulas, or binary packet serialization.

## Goals / Non-Goals

**Goals:**
- Install and configure `vitest` as the standard test runner.
- Create a root-level `vitest.workspace.ts` to support multi-workspace test execution.
- Implement baseline unit tests for:
  - `ByteBuffer` (`shared`) custom binary encoding/decoding.
  - `MapGrid` (`server/map`) stair transitions (vertical position movement).
  - `CombatSystem` (`server/combat`) damage updates, level-ups, and health transitions.
- Configure `openspec/config.yaml` to mandate testing strategies and implementation tasks for all future features.

**Non-Goals:**
- Setting up a continuous integration (CI) build server or pipeline (e.g., GitHub Actions).
- Introducing browser-based end-to-end rendering tests for the HTML5 canvas client.

## Decisions

### 1. Framework Choice: Vitest
- **Decision**: Use Vitest instead of Jest or the Node.js native runner.
- **Rationale**: Since Project Tibado uses ESM (`"type": "module"`) and TypeScript, Jest requires significant configuration (Babel/ts-jest) which is prone to ESM compatibility errors. Vitest features out-of-the-box support for TypeScript and ESM.
- **Alternatives Considered**: 
  - *Node.js Native Test Runner*: Simple and lightweight, but lacks built-in TypeScript compilation support (requires wrappers like `tsx`) and has a less mature ecosystem for mocks and assertions.

### 2. Execution Configuration: Vitest Workspaces
- **Decision**: Define a `vitest.workspace.ts` file in the monorepo root.
- **Rationale**: Allows running tests for `shared`, `server`, and `client` in parallel using a single root command `npm test`. Workspaces can also customize their environments (e.g. `jsdom` for client and `node` for server).

### 3. OpenSpec Testing Enforcement
- **Decision**: Add custom rules in the global `openspec/config.yaml` to require automated testing sections in proposals and task list checkboxes.
- **Rationale**: Ensures any new feature added to the codebase has tests planned and implemented, shifting quality assurance left.

## Risks / Trade-offs

- **Risk: DOM / Canvas dependencies in client tests**
  - *Description*: The client relies on browser window APIs, context, and Canvas which will throw errors in standard Node environments.
  - *Mitigation*: Configure the client workspace to run in a `jsdom` environment. Focus client-side tests on pure math modules (e.g., interpolation, keyboard input filters) rather than Canvas rendering.
