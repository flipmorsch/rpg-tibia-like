export interface PlayerStatsState {
  name: string;
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  speed: number;
  cooldownMs: number;
  damageMin: number;
  damageMax: number;
  ready: boolean;
}

export const createPlayerStatsState = (): PlayerStatsState => ({
  name: '',
  level: 1,
  exp: 0,
  hp: 100,
  maxHp: 100,
  speed: 100,
  cooldownMs: 220,
  damageMin: 13,
  damageMax: 24,
  ready: false,
});
