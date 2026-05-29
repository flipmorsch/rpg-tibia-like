## Context

The Project Tibado client sidebar currently renders all active entities in a basic, un-ordered list. There is no distance feedback, and players cannot click the list entries to select their combat targets (they must click the entity's 32x32 pixel area directly on the moving canvas, which is difficult).

## Goals / Non-Goals

**Goals:**

- Convert the sidebar panel into a "Battle List".
- Sort entities dynamically based on their Chebyshev distance to the local player.
- Make rows interactive so clicking targets/attacks the entity.
- Render mini-health bars under/beside each entity name.
- Highlight the active target in the list.
- Throttle DOM updates to 100ms to preserve client rendering performance.

**Non-Goals:**

- Adding filtering/sorting options (e.g. sorting by name, filtering players vs monsters) to the Battle List.
- Modifying the server's combat or networking logic.

## Decisions

### 1. Distance Calculation (Chebyshev)

- **Decision**: Sort entities using Chebyshev distance:
  $$\text{distance} = \max(|\text{me.gridX} - \text{ent.gridX}|, |\text{me.gridY} - \text{ent.gridY}|)$$
- **Rationale**: Since players move on a 2D tile grid and attacks are range-checked via adjacent checks (distance $\le 1$), using Chebyshev distance ensures that entities that are mechanically closest appear first.

### 2. Targeting Interaction

- **Decision**: Clicking a row toggles the target. If the entity is not targeted, send an attack command and set the target. If already targeted, clear the target (send ID 0).
- **Rationale**: Provides intuitive, classic MMORPG control flow where players can easily attack or deselect targets directly from the list.

### 3. Rendering Throttler

- **Decision**: Track `lastSidebarUpdateTime` in `GameClient` and re-render only if at least 100ms has passed since the last update.
- **Rationale**: High-frequency ticks (60fps) doing full DOM clears and reconstructions cause high CPU overhead. A 100ms throttle limits updates to 10Hz, which is visually smooth but highly performant.

### 4. Styles and Markup (CSS)

- **Decision**: Add styles in `client/index.html` for:
  - `.entity-row.targeted`: Adds a red left border and border glow to show active targeting.
  - `.entity-hp-bar`: Outer container.
  - `.entity-hp-fill`: Inner colored bar. Green if $\ge 50\%$, orange/yellow if $\ge 20\%$, red if $< 20\%$.

## Risks / Trade-offs

- **Risk: DOM layout thrashing during movement**
  - _Description_: Frequent sorting shifts rows around, causing layouts to change, which might make clicking on a moving row slightly disorienting.
  - _Mitigation_: The 100ms throttle smooths transitions out, and since the list is small (typically $\le 20$ entities), the jump is minimal.
