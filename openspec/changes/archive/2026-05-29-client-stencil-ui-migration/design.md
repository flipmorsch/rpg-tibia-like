## Context

The client UI is currently implemented as a single orchestration class that mixes rendering, network interactions, and DOM updates. This change introduces a Stencil-based UI system embedded in the client package, with Shadow DOM components, typed event registries, and per-feature state driven by selectors. The architecture must scale to a larger UI surface while remaining compatible with a future SSR hydration pass.

## Goals / Non-Goals

**Goals:**

- Embed Stencil in the client package and ship UI as Shadow DOM web components.
- Split UI-oriented features from gameplay features with per-feature state and selectors.
- Introduce domain-split typed event registries and a small event bus.
- Enable hydration build output for a future SSR shell.
- Migrate Battle List, Chat, and Login as the first UI components.

**Non-Goals:**

- Rewriting the renderer or server protocol.
- Migrating all UI at once; only the first three features are in scope.
- Implementing full SSR rendering of game state (shell-only hydration).

## Decisions

### 1) Stencil embedded under `client`

- **Decision:** Use Stencil inside the client package with `dist-custom-elements` and hydration output.
- **Rationale:** Keeps UI tooling local to the client, avoids a separate package, and supports future SSR hydration.
- **Alternatives considered:**
  - Lit (lighter runtime but lacks Stencil hydration output pipeline).
  - Separate UI package (adds repo complexity and cross-package versioning).

### 2) Shadow DOM for all UI components

- **Decision:** Components use Shadow DOM with design tokens exposed as CSS variables.
- **Rationale:** Strong isolation for large-scale UI and predictable styling boundaries.
- **Alternatives considered:**
  - Light DOM (easier styling, weaker isolation for a large project).

### 3) Domain-split typed event registries

- **Decision:** Separate typed registries per domain (UI, gameplay, world).
- **Rationale:** Enforces strict namespaces and reduces accidental cross-domain coupling.
- **Alternatives considered:**
  - Single global registry (simpler but harder to enforce boundaries).

### 4) Per-feature state + selectors

- **Decision:** Each feature owns its local state and exposes selectors for UI props.
- **Rationale:** Keeps UI components pure and prevents feature logic from leaking into the DOM.
- **Alternatives considered:**
  - Global store (simpler but risks a new god-object and cross-feature coupling).

### 5) Hydration shell only

- **Decision:** Hydration output will render a shell and placeholders, not gameplay state.
- **Rationale:** Avoids mismatches and keeps SSR scope realistic for a real-time game.
- **Alternatives considered:**
  - SSR full game state (high risk of mismatch, complex server data model).

## Risks / Trade-offs

- **Shadow DOM styling complexity** → Mitigate with a centralized CSS variable token system and shared theme docs.
- **Hydration mismatch warnings** → Render placeholder shells until selectors report ready state.
- **Event propagation across Shadow DOM** → Enforce `bubbles: true` and `composed: true` for all UI events.
- **Feature boundary drift** → Keep explicit domain registry files and lint for namespace violations.
- **Build complexity** → Keep Stencil config minimal and limit output targets to `dist-custom-elements` + hydration.

## Migration Plan

1. Establish Stencil config, typed event registries, and minimal event bus.
2. Migrate Battle List to `tibado-battle-list` using UI feature state + selectors.
3. Migrate Chat to `tibado-chat-panel` with UI-only props and events.
4. Migrate Login to `tibado-login-modal` and wire gameplay login controller.
5. Validate hydration shell and selector readiness gating.

## Open Questions

- Should UI selectors read directly from a world snapshot store or only from feature controllers?
- What is the long-term SSR goal (FCP only vs. SEO) and how should it shape shell content?
- Do we standardize a shared base component for common event wiring?
