export interface WorldPosition {
  x: number;
  y: number;
  z: number;
}

export interface WorldEntitySnapshot {
  id: number;
  name: string;
  isPlayer: boolean;
  gridX: number;
  gridY: number;
  gridZ: number;
  hp: number;
  maxHp: number;
  monsterTypeId: number;
}

export interface PlayerSnapshot {
  id: number;
  name: string;
  speed: number;
  cooldownMs: number;
  position: WorldPosition;
  level: number;
  exp: number;
}

export interface WorldSnapshot {
  connected: boolean;
  player: PlayerSnapshot | null;
  entities: WorldEntitySnapshot[];
  targetId: number;
  lastUpdated: number;
}

export const createEmptyWorldSnapshot = (): WorldSnapshot => ({
  connected: false,
  player: null,
  entities: [],
  targetId: 0,
  lastUpdated: 0,
});
