import { PlayerStatsState } from './state.js';

export const selectPlayerStatsProps = (state: PlayerStatsState) => ({
  name: state.name,
  level: state.level,
  exp: state.exp,
  hp: state.hp,
  maxHp: state.maxHp,
  speed: state.speed,
  cooldownMs: state.cooldownMs,
  damageMin: state.damageMin,
  damageMax: state.damageMax,
  ready: state.ready,
});

export const selectPlayerHpPercent = (state: PlayerStatsState) =>
  state.maxHp > 0 ? Math.round((state.hp / state.maxHp) * 100) : 0;
