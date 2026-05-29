import { BattleListState } from './state.js';

export const selectBattleListEntries = (state: BattleListState) => state.entries;

export const selectBattleListReady = (state: BattleListState) => state.ready;

export const selectBattleListProps = (state: BattleListState) => ({
  entries: selectBattleListEntries(state),
  ready: selectBattleListReady(state),
});
