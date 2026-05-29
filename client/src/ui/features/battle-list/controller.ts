import { WorldSnapshot } from '../../../world/worldSnapshot.js';
import { clamp, filterEntitiesOnFloor, sortEntitiesByDistance } from '../../selectors.js';
import { BattleListState, createBattleListState } from './state.js';

export type BattleListListener = (state: BattleListState) => void;

export class BattleListController {
  private state: BattleListState = createBattleListState();
  private listeners = new Set<BattleListListener>();

  public setWorldSnapshot(snapshot: WorldSnapshot) {
    const player = snapshot.player;
    const targetId = snapshot.targetId;

    let entries = snapshot.entities.filter((entity) => entity.id !== player?.id);

    if (player) {
      const visible = filterEntitiesOnFloor(player.position.z, entries);
      entries = sortEntitiesByDistance(player.position, visible);
    }

    const mappedEntries = entries.map((entity) => {
      const hpPercent = entity.maxHp > 0 ? clamp(entity.hp / entity.maxHp, 0, 1) : 0;
      return {
        id: entity.id,
        name: entity.name,
        hpPercent,
        isPlayer: entity.isPlayer,
        isTarget: entity.id === targetId,
        canAttack: !entity.isPlayer,
      };
    });

    this.setState({
      entries: mappedEntries,
      ready: player !== null,
    });
  }

  public subscribe(listener: BattleListListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): BattleListState {
    return this.state;
  }

  private setState(nextState: BattleListState) {
    this.state = nextState;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
