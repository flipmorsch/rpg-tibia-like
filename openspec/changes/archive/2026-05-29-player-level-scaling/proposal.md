## Why

Player progression feels flat: every level-up only increases max HP by 20 while damage, speed, and attack speed remain static. Players can't see their own HP on screen. Hunter viability stalls early — Orcs remain deadly past level 5, Dragons stay unreachable. The game needs a tangible power curve that makes leveling feel rewarding and unlocks new hunting tiers.

## What Changes

- Scale max HP, move speed, attack damage, and attack speed with player level using a "faster ramp" formula.
- Send full player stats to client on level-up via expanded protocol packet.
- Fix player HP/maxHP propagation from server spawn to client PlayerSnapshot.
- Add a player stats HUD component showing HP, max HP, level, exp, speed, and damage.
- Wire the component into the existing sidebar through the selector-driven UI feature system.

## Capabilities

### New Capabilities

- `player-attribute-scaling`: Level-based formulas for max HP, speed, damage, and attack speed that create a meaningful power curve across levels 1-50.
- `player-stats-hud`: A Stencil UI component that displays the player's current HP bar, max HP, level, experience, move speed, and attack damage range, driven by feature selectors.

### Modified Capabilities

- `battle-system`: Player damage bounds and attack cooldown are no longer static — they scale with level. The spec's hardcoded "5-15 for player" and "2000ms" values become level-dependent formulas.

## Impact

- **Server**: `Player` gains scaling formulas. `DeathManager` level-up block applies all attribute increases. `CombatSystem` uses player-level damage bounds and cooldown instead of flat values. `broadcastPlayerExp` packet gains speed and maxHp fields (protocol change).
- **Shared protocol**: `S2C_PLAYER_EXP` opcode extended from `(exp: uint32, level: uint16)` to `(exp: uint32, level: uint16, speed: uint16, maxHp: uint16)`.
- **Client**: `PlayerSnapshot` gains `hp`, `maxHp`. `handleLoginSuccess` passes received hp/maxHp to `spawnEntity`. `updateWorldSnapshot` maps hp/maxHp from interpolation entity into snapshot. New `player-stats` Stencil component + feature module. Sidebar HTML replaced with component.
- **New files**: `client/src/ui/components/player-stats/`, `client/src/ui/features/player-stats/`.
- **Existing specs**: `battle-system` spec updated for level-scaled damage/cooldown.

## Testing Strategy

- Add integration tests for player attribute formulas (HP, speed, damage, attack cooldown) at various levels to verify correct scaling.
- Add UI event test for player stats component receiving snapshot data and rendering HP bar correctly.
- Run existing vitest suite after each phase — all 37 tests must stay green.
- Manual verification: level up through monster kills (Rat → CaveRat → Orc) and confirm HP/speed/damage/attack-speed reflect in HUD and gameplay feel.
