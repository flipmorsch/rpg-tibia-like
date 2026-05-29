import { WorldSnapshot } from '../../../world/worldSnapshot.js';
import { PlayerStatsState, createPlayerStatsState } from './state.js';

export type PlayerStatsListener = (state: PlayerStatsState) => void;

export class PlayerStatsController {
  private state: PlayerStatsState = createPlayerStatsState();
  private listeners = new Set<PlayerStatsListener>();

  public setWorldSnapshot(snapshot: WorldSnapshot) {
    const player = snapshot.player;

    if (!player) {
      this.setState({ ...this.state, ready: false });
      return;
    }

    const damageMin = 10 + player.level * 3;
    const damageMax = 20 + player.level * 4;

    this.setState({
      name: player.name,
      level: player.level,
      exp: player.exp,
      hp: player.hp,
      maxHp: player.maxHp,
      speed: player.speed,
      cooldownMs: player.cooldownMs,
      damageMin,
      damageMax,
      ready: true,
    });
  }

  public subscribe(listener: PlayerStatsListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): PlayerStatsState {
    return this.state;
  }

  private setState(nextState: PlayerStatsState) {
    this.state = nextState;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
