## Why

The client has become a monolithic entrypoint that mixes UI rendering, feature logic, and side effects, which makes new UI features risky to change. We need a scalable UI architecture that can grow with the project while preserving performance and enabling future SSR hydration.

## What Changes

- Embed Stencil inside the client package and ship UI as Shadow DOM web components.
- Introduce typed, domain-split event registries and a small event bus for feature communication.
- Split UI-oriented features from gameplay features, with per-feature state and selector-driven rendering.
- Migrate Battle List, Chat, and Login to Stencil components with strict, namespaced events.
- Add hydration build support so an SSR shell can hydrate safely later.

## Capabilities

### New Capabilities

- `client-ui-platform`: Stencil-based UI component platform with Shadow DOM, hydration output, and shared design tokens.
- `client-ui-event-system`: Typed, domain-split event registry and event bus with strict feature namespaces.
- `client-ui-feature-modules`: Per-feature state and selectors that drive UI components without direct DOM access.

### Modified Capabilities

- (none)

## Impact

- Client build tooling: add Stencil config and build outputs under `client`.
- Client architecture: refactor UI rendering out of `client/src/main.ts` into UI features and components.
- New dependencies: Stencil compiler and supporting tooling.
- HTML layout: replace static DOM blocks with web components.

## Testing Strategy

- Run the existing workspace test suite after each phase.
- Add manual UI checks for Battle List, Chat, and Login after each migration step.
- Validate hydration compatibility by ensuring SSR shell matches initial client render state.
