## ADDED Requirements

### Requirement: Domain-split typed event registries

The client SHALL provide typed event registries split by domain (UI, gameplay, world).

#### Scenario: Event registry separation

- **WHEN** a UI feature emits an event
- **THEN** the event is defined in the UI registry and not in gameplay or world registries

### Requirement: Strict namespaced event names

Events SHALL use strict namespaces in the form `<domain>:<feature>:<action>`.

#### Scenario: Namespaced UI event

- **WHEN** the Battle List emits an attack intent
- **THEN** the event name uses the `ui:battle-list:attack` namespace

### Requirement: Shadow DOM events are observable

UI events emitted from Shadow DOM components SHALL bubble and be composed so feature controllers can observe them.

#### Scenario: Composed UI event

- **WHEN** a user action dispatches a UI event from within Shadow DOM
- **THEN** the event is observable outside the component boundary
