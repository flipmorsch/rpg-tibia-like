export interface BattleListEntry {
  id: number;
  name: string;
  hpPercent: number;
  isPlayer: boolean;
  isTarget: boolean;
  canAttack: boolean;
}

export interface BattleListState {
  entries: BattleListEntry[];
  ready: boolean;
}

export const createBattleListState = (): BattleListState => ({
  entries: [],
  ready: false,
});
