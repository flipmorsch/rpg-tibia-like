## 1. UI Layout & Styling Setup

- [x] 1.1 Rename the sidebar panel header to "Battle List" in `client/index.html`
- [x] 1.2 Add CSS styles for `.entity-row.targeted` (red borders and glows), and `.entity-hp-bar` / `.entity-hp-fill` classes in `client/index.html`

## 2. Distance Sorting & Throttle Implementation

- [x] 2.1 Update `GameClient` constructor and update loop in `client/src/main.ts` to implement a 100ms update throttle timer for the sidebar
- [x] 2.2 Re-implement `updateEntitiesSidebar` to calculate Chebyshev distance for visible entities, sort them from nearest to farthest, and filter out the local player

## 3. Interactive Row Actions & HP Bars

- [x] 3.1 Update row elements generation to render mini-health bars under/beside each entity name with color-coded HP percentages
- [x] 3.2 Add click handlers to rows to send attack requests (`network.sendAttack`) and update targeting outlines in the sidebar

## 4. Verification & Testing

- [ ] 4.1 Build the client and run a manual test check to ensure the Battle List updates positions, displays health bars, and attacks monsters on click
