## Why

The current client UI displays visible entities in a basic, un-ordered sidebar panel without distance metadata or interactive targeting support. Transforming this into a distance-sorted, interactive Battle List with real-time health indicator bars and click-to-target functionality is key to establishing a high-quality MMORPG gameplay loop.

## What Changes

- **UI Refactoring**: Update the client layout to rename "Visible Entities" to "Battle List" and introduce styling for health bars, targeting indicators, and interactive list rows.
- **Sorting Logic**: Implement real-time distance sorting (using Chebyshev grid distance) relative to the local player.
- **Targeting Interaction**: Add click-to-target event listeners on the battle list rows that trigger attack network messages and visual targeting highlights.
- **Performance Optimization**: Add a 100ms update throttle to the sidebar rendering process to reduce DOM overhead inside the requestAnimationFrame loop.

## Capabilities

### New Capabilities

- `client-battle-list`: Transform the visible entities list into a sorted, interactive battle list with health bars and targeting support.

### Modified Capabilities

None.

## Impact

- **Client Code**: Modifies UI layout and styles in `client/index.html` and updates update/tick logic in `client/src/main.ts`.
- **Server Code**: Zero impact. Compatible with all existing binary protocols and opcodes.
