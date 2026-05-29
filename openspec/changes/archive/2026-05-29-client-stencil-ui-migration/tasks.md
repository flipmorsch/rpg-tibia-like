## 1. Stencil and Event Foundations

- [x] 1.1 Add Stencil config and client build scripts for custom elements and hydration output
- [x] 1.2 Create domain-split typed event registries (ui, gameplay, world)
- [x] 1.3 Implement a small typed event bus with namespaced dispatch helpers
- [x] 1.4 Add a world snapshot source and selector utilities for UI features

## 2. Battle List Migration

- [x] 2.1 Create `battle-list` Stencil component with Shadow DOM and composed events
- [x] 2.2 Implement battle list feature state, selectors, and controller
- [x] 2.3 Wire gameplay combat controller to handle `ui:battle-list:attack`
- [x] 2.4 Replace existing battle list markup with the component integration

## 3. Chat Migration

- [x] 3.1 Create `chat-panel` Stencil component with composed send event
- [x] 3.2 Implement chat feature state, selectors, and controller
- [x] 3.3 Remove chat DOM coupling from input handling and use feature focus state
- [x] 3.4 Replace existing chat markup with the component integration

## 4. Login Migration

- [x] 4.1 Create `login-modal` Stencil component with submit events
- [x] 4.2 Implement login feature state, selectors, and controller
- [x] 4.3 Replace existing login markup with the component integration

## 5. Hydration and Verification

- [x] 5.1 Add SSR shell placeholders and selector readiness gating
- [x] 5.2 Add integration tests for UI event routing (battle list, chat, login)
- [x] 5.3 Run manual verification for Battle List, Chat, and Login flows
