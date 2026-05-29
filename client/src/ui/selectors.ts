import { WorldEntitySnapshot, WorldPosition } from '../world/worldSnapshot.js';

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const getChebyshevDistance = (a: WorldPosition, b: WorldPosition) => {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
};

export const sortEntitiesByDistance = (origin: WorldPosition, entities: WorldEntitySnapshot[]) => {
  return [...entities].sort((left, right) => {
    const leftDistance = getChebyshevDistance(origin, { x: left.gridX, y: left.gridY, z: left.gridZ });
    const rightDistance = getChebyshevDistance(origin, { x: right.gridX, y: right.gridY, z: right.gridZ });
    return leftDistance - rightDistance;
  });
};

export const filterEntitiesOnFloor = (floor: number, entities: WorldEntitySnapshot[]) => {
  return entities.filter((entity) => entity.gridZ === floor);
};
