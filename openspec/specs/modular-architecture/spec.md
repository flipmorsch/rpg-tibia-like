## ADDED Requirements

### Requirement: Decoupled Player Socket Handling
The server SHALL isolate WebSocket connection handling from the Player domain entity, managing connections through an external connection registry.

#### Scenario: Send message to player
- **WHEN** the server needs to transmit a network packet to a player
- **THEN** it looks up the player's connection in the connection registry and sends the payload over the active socket

### Requirement: Feature Modular Directory Structure
The server codebase SHALL be organized into feature-modular folders (`ws/`, `map/`, `player/`, `monster/`, `combat/`) containing the entities and business logic specific to each domain concept.

#### Scenario: Verify codebase structure
- **WHEN** looking at the server source tree
- **THEN** all player actions reside in `player/`, monster behaviors in `monster/`, map details in `map/`, auto-attacks in `combat/`, and WS listeners in `ws/`
