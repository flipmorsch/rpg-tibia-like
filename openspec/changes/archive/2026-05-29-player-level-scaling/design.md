## Context

Player progression currently only bumps `maxHp` by 20 per level. Damage is flat 5-15, attack cooldown flat 2000ms, speed flat 100. The client `PlayerSnapshot` lacks `hp`/`maxHp` fields — players can't see their own health. The `handleLoginSuccess` path drops hp/maxHp from the spawn packet, defaulting to 100/100.

The `S2C_PLAYER_EXP` packet carries only `(exp: uint32, level: uint16)`. On level-up, the server must inform the client of new speed and maxHp values so the HUD stays accurate.

Client UI already follows a selector-driven architecture (`client-ui-feature-modules` spec) with Shadow DOM Stencil components. The sidebar currently uses raw DOM manipulation for player stats — this must be migrated to a Stencil component consistent with the existing `battle-list`, `chat-panel`, `login-modal` pattern.

## Goals / Non-Goals

**Goals:**

- Scale max HP, move speed, damage, and attack speed with level using a "faster ramp" formula.
- Display all crucial player stats (HP, max HP, level, exp, speed, damage) in a Stencil component.
- Fix the player HP propagation from server spawn → interpolation → world snapshot → HUD.
- Extend `S2C_PLAYER_EXP` protocol packet to carry speed and maxHp.
- Keep existing level-up EXP curve (`level * 200`) unchanged.
- Existing 37 tests continue passing.

**Non-Goals:**

- Changing the EXP curve or level-up condition.
- Adding new stats (mana, capacity, magic level).
- Weapon/equipment system.
- Monster rebalancing (monster stats stay as-is).
- SSR hydration of player stats component.

## Decisions

### 1) Scaling formulas — "Faster ramp"

| Attribute | Formula | Level 1 | Level 10 | Level 20 | Level 30 |
|-----------|---------|---------|----------|----------|----------|
| Max HP | `100 + 25·(L−1)` | 100 | 325 | 575 | 825 |
| Speed | `100 + 4·(L−1)` | 100 | 136 | 176 | 216 |
| Move CD | `max(100, min(1000, 300 − S·0.8))` | 220ms | 191ms | 159ms | 127ms |
| Damage (min-max) | `(10+L·3) − (20+L·4)` | 13-24 | 40-60 | 70-100 | 100-140 |
| Attack CD | `max(500, 2000 − L·35)` | 1965ms | 1650ms | 1300ms | 950ms |

- **Rationale:** Orcs become comfortably huntable by level 5-7, Dragons by level 22-25. Speed caps at 250 (100ms move CD) at level ~38. Each level feels impactful.
- **Alternatives considered:**
  - Linear scaling (current): too flat, no kill-time improvement across tiers.
  - Aggressive cubic scaling: snowballs too fast, trivializes early-game monsters.

### 2) Protocol: Extend S2C_PLAYER_EXP

- **Decision:** Extend existing packet rather than adding a new opcode.
  - Old: `[opcode:8][exp:32][level:16]` = 7 bytes
  - New: `[opcode:8][exp:32][level:16][speed:16][maxHp:16]` = 11 bytes
- **Rationale:** Level-up is the natural trigger for stat changes. Same packet already sent on death and login. Adding fields keeps it simple.
- **Alternatives considered:**
  - New opcode `S2C_PLAYER_STATS`: extra round-trip, two packets per level-up.
  - Rely on S2C_ENTITY_HP for maxHp and spawn packet for speed: scattered, misses the "all stats changed" moment.

### 3) Level-up applies all attributes atomically

In `DeathManager.handleMonsterDeath`, the level-up block becomes:

```
killer.level++
killer.maxHp += 25          // was: += 20
killer.speed += 4           // new
killer.hp = killer.maxHp
// Damage and attack CD derive from level, not stored
```

- `broadcastPlayerExp` sends the new packet with all 4 fields.
- `broadcastEntityHp` notifies nearby spectators of new HP.

### 4) Player stats HUD component

- **Decision:** Create `<player-stats>` Stencil component under `client/src/ui/components/player-stats/` with corresponding feature module under `client/src/ui/features/player-stats/`.
- **Rationale:** Consistent with existing `battle-list`, `chat-panel`, `login-modal` pattern. Shadow DOM, selector-driven, composed events if needed.
- **Component layout:**

```
┌─ My Character ──────────────────┐
│  Name:  TibiaKnight             │
│  Level: 12   Exp: 1450/2400     │
│  ┌──────────────────────┐       │
│  │████████████░░░░░░░░░░│ 72%   │
│  └──────────────────────┘       │
│  HP: 234 / 325                  │
│  Speed: 144    CD: 185ms        │
│  Damage: 46 - 68                │
└─────────────────────────────────┘
```

- **Alternatives considered:**
  - Keep raw DOM manipulation: breaks the selector-driven architecture established in the last change.
  - Add stats to `battle-list` component: conflates two concerns, battle-list shows targets, not self-stats.

### 5) PlayerSnapshot gains hp/maxHp

```
interface PlayerSnapshot {
  id, name, speed, cooldownMs, position,
  level, exp,
  hp: number,          // new
  maxHp: number        // new
}
```

- `updateWorldSnapshot` already reads from `interpolation.getEntity()` which carries hp/maxHp — just map them.
- `handleLoginSuccess` passes hp/maxHp from spawn packet to `spawnEntity`.
- `handlePlayerExp` updates local speed/maxHp state and pushes to snapshot.

## Risks / Trade-offs

- **Protocol backward compatibility** → Risk: old client reading new packet format would misparse. Mitigation: client and server always deploy together (monorepo). Not a concern.
- **Monster balance drift** → Risk: faster ramp makes early monsters trivial faster. Mitigation: accepted — that's the point of progression. New higher-tier monsters can be added later.
- **Shadow DOM styling complexity for HP bar** → Mitigation: follow existing component patterns, use CSS variables from global theme.
- **Attack CD scales with level but stored nowhere** → Derived from formula each tick. Slight CPU cost. Mitigation: trivial arithmetic, not a real concern.

## Migration Plan

1. Update `Player.ts` with formula helper methods.
2. Update `DeathManager.ts` level-up block to apply all attributes.
3. Extend `broadcastPlayerExp` packet (server) and `handlePlayerExp` parser (client).
4. Fix `handleLoginSuccess` to pass hp/maxHp.
5. Add hp/maxHp to `PlayerSnapshot` and map in `updateWorldSnapshot`.
6. Add `S2C_PLAYER_EXP` extended parser in client `network.ts`.
7. Create `player-stats` Stencil component + feature module.
8. Replace sidebar stats DOM with `<player-stats>` component.
9. Add integration tests for formulas and UI rendering.
10. Manual verification across monster tiers.

Rollback: revert to previous commit. No database or persistent state.

## Open Questions

- Should damage range display in HUD be the raw formula output or include attack speed to show DPS? (Leaning: raw min-max, simpler).
- Should the player stats component emit events (e.g., clicking level shows details) or remain purely display? (Leaning: display-only for now).
