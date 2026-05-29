import { describe, expect, it } from 'vitest';
import { PlayerStatsController } from '../ui/features/player-stats/controller.js';
import { selectPlayerHpPercent, selectPlayerStatsProps } from '../ui/features/player-stats/selectors.js';
import { createPlayerStatsState } from '../ui/features/player-stats/state.js';
import { WorldSnapshot } from '../world/worldSnapshot.js';

function createSnapshot(overrides: Partial<WorldSnapshot['player']> = {}): WorldSnapshot {
  return {
    connected: true,
    player: {
      id: 1,
      name: 'Tester',
      speed: 136,
      cooldownMs: 191,
      position: { x: 64, y: 64, z: 7 },
      level: 10,
      exp: 500,
      hp: 250,
      maxHp: 325,
      ...overrides,
    },
    entities: [],
    targetId: 0,
    lastUpdated: Date.now(),
  };
}

describe('PlayerStatsController', () => {
  it('sets ready to true when world snapshot has player', () => {
    const controller = new PlayerStatsController();
    const snapshot = createSnapshot();
    controller.setWorldSnapshot(snapshot);
    const state = controller.getState();
    expect(state.ready).toBe(true);
  });

  it('sets ready to false when world snapshot has no player', () => {
    const controller = new PlayerStatsController();
    controller.setWorldSnapshot({ ...createSnapshot(), player: null });
    expect(controller.getState().ready).toBe(false);
  });

  it('computes damage bounds from player level', () => {
    const controller = new PlayerStatsController();
    controller.setWorldSnapshot(createSnapshot({ level: 10 }));
    const state = controller.getState();
    expect(state.damageMin).toBe(40);
    expect(state.damageMax).toBe(60);
  });

  it('notifies subscribers on snapshot change', () => {
    const controller = new PlayerStatsController();
    const states: number[] = [];
    controller.subscribe((state) => states.push(state.hp));

    controller.setWorldSnapshot(createSnapshot({ hp: 300 }));
    controller.setWorldSnapshot(createSnapshot({ hp: 150 }));

    // First call is initial state (100 default), then 300, then 150
    expect(states).toEqual([100, 300, 150]);
  });
});

describe('player stats selectors', () => {
  it('selectPlayerHpPercent returns 0 when maxHp is 0', () => {
    const state = createPlayerStatsState();
    state.maxHp = 0;
    state.hp = 0;
    expect(selectPlayerHpPercent(state)).toBe(0);
  });

  it('selectPlayerHpPercent computes correct percentage', () => {
    const state = createPlayerStatsState();
    state.hp = 250;
    state.maxHp = 325;
    expect(selectPlayerHpPercent(state)).toBe(77); // 250/325 ≈ 77%
  });

  it('selectPlayerStatsProps returns all fields', () => {
    const state = createPlayerStatsState();
    state.hp = 150;
    state.maxHp = 200;
    const props = selectPlayerStatsProps(state);
    expect(props.hp).toBe(150);
    expect(props.maxHp).toBe(200);
    expect(props.ready).toBe(false);
  });
});
