## Why

The server codebase currently features a highly coupled, monolithic game core centered inside `GameWorld.ts`. Domain entities like `Player.ts` directly import and reference raw WebSockets (`ws` package) for network writes, which violates separation of concerns. Restructuring the codebase into feature-modular domains (`ws`, `map`, `player`, `monster`, `combat`) will isolate connection/infrastructure details, increase modular cohesion, and make the codebase significantly cleaner to maintain and extend.

## What Changes

- **Code Restructure**: Break the monolith `server/src/game/` down into distinct feature directories: `ws/`, `map/`, `player/`, `monster/`, and `combat/`.
- **WebSocket Isolation**: Introduce `ConnectionManager` inside `ws/` to decouple the `Player` domain model from the raw socket references. Players will have their connection status queried and managed externally rather than holding socket states directly.
- **Loop Orchestration**: Transition the central game loop out of `GameWorld.ts` into a dedicated runner in `server/src/main.ts` that triggers system updates across the feature modules.

## Capabilities

### New Capabilities

- `modular-architecture`: Decouple the Player domain entity from WebSockets and organize the server codebase into self-contained feature directories.

### Modified Capabilities

- None (existing MMORPG gameplay rules, behavior, and network protocols will remain identical).

## Impact

- **Server Internals**: Major directory restructuring under `server/src/`. All internal imports will be updated.
- **Build and Run Configurations**: The main entry point for the server will shift to `server/src/main.ts` (compiled to `server/dist/main.js`). Run scripts (like `server/package.json` scripts) will be updated.
- **Client/Shared Code**: Zero impact. Client-server network protocols and serialization logic will remain completely untouched.
