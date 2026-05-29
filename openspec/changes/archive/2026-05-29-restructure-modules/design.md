## Context

The Project Tibado game server currently operates using a monolithic class structure inside `GameWorld.ts` which handles connections, map details, combat, entity movements, and loop scheduling. Furthermore, the `Player.ts` model couples the domain state with the WebSocket network infrastructure. This design document establishes a clean, feature-modular architecture to decouple these concerns.

## Goals / Non-Goals

**Goals:**
- Separate server logic into five high-cohesion feature modules: `ws/` (networking), `map/` (spatial queries and grid), `player/` (player entities and movement), `monster/` (monsters and AI ticks), and `combat/` (auto-attacks and combat resolutions).
- Decouple the `Player` domain class from the raw WebSocket instances.
- Build a lightweight `main.ts` loop runner to bootstrap the application and coordinate ticks.

**Non-Goals:**
- Altering the client-server protocol definitions or opcodes.
- Refactoring client-side components.
- Modifying game rules (walk speeds, damage formulas, EXP math, map layout, spawn rates).

## Decisions

### 1. Decoupling Sockets via ConnectionManager
- **Decision**: Introduce a `ConnectionManager` class in the `ws/` module to handle sending and broadcasting packets.
- **Rationale**: Currently, `Player` has a raw socket reference which requires importing the `ws` package into the entity model. Under the new design, `Player` holds only domain data. When the server needs to transmit data, it calls `ConnectionManager.send(playerId, packet)`.
- **Alternatives Considered**: 
  - *Player Callback Hook*: Injecting a callback function into the Player class. Rejected because it still keeps network orchestration inside the entity's boundary.

### 2. File and Directory Layout
- **Decision**: Group all code by logical MMORPG features.
  - `ws/`: `index.ts` (WS setup), `GameSocket.ts` (extended socket definitions), `ConnectionManager.ts`.
  - `map/`: `MapGrid.ts` (geometry), `AoIManager.ts` (sectors and visibility).
  - `player/`: `Player.ts` (data), `PlayerActions.ts` (login, move, chat handlers).
  - `monster/`: `Monster.ts` (base), `Rat.ts` / `CaveRat.ts` / `Orc.ts` / `Dragon.ts` (subclasses), `MonsterAI.ts` (AI tick loops).
  - `combat/`: `CombatSystem.ts` (auto-attacks, HP sync, and death resolutions).
- **Rationale**: Promotes high cohesion and low coupling. Editing a monster's state or behavior is fully contained in `/monster/`.

### 3. Orchestration and Lifecycles
- **Decision**: Establish a dedicated entry point `server/src/main.ts` to manage the game loops.
  - Ticks are split: Combat runs at 20Hz (every 50ms) and AI runs at 2Hz (every 500ms).
  - Handles initialization dependencies (loading the map grid, spawning the initial monsters, starting the WebSocket server).

## Risks / Trade-offs

- **Risk: Memory Leaks on Disconnection**
  - *Description*: If a player disconnects, but their registry entry remains in the `ConnectionManager`, it could lead to memory leaks or dead connection ping attempts.
  - *Mitigation*: The `ConnectionManager` must expose prune/remove hooks that are bound directly to the WebSocket close event handler.

- **Risk: Cyclic Dependencies**
  - *Description*: Splitting tightly coupled game states could introduce circular imports (e.g. player movement checks map collision, and map updates trigger player spawns).
  - *Mitigation*: Restructure communications using event triggers or functional pipelines. Map should only serve queries (isWalkable), and player handlers coordinate the resulting state updates.
