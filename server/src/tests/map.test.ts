import { describe, it, expect } from 'vitest';
import { MapGrid, TileType } from '../map/MapGrid.js';

describe('MapGrid', () => {
  it('should initialize with correct dimensions', () => {
    const map = new MapGrid();
    expect(map.width).toBe(128);
    expect(map.height).toBe(128);
    expect(map.depth).toBe(16);
  });

  it('should have grass at surface center and be walkable', () => {
    const map = new MapGrid();
    expect(map.getTileType(64, 64, 7)).toBe(TileType.GRASS);
    expect(map.isWalkable(64, 64, 7)).toBe(true);
  });

  it('should have stone wall boundaries that are not walkable', () => {
    const map = new MapGrid();
    // North boundary
    expect(map.getTileType(10, 0, 7)).toBe(TileType.STONE_WALL);
    expect(map.isWalkable(10, 0, 7)).toBe(false);
    
    // West boundary
    expect(map.getTileType(0, 10, 7)).toBe(TileType.STONE_WALL);
    expect(map.isWalkable(0, 10, 7)).toBe(false);
  });

  it('should place stairs at the correct coordinates on surface and dungeon', () => {
    const map = new MapGrid();
    // Stairs down at (60, 60, 7)
    expect(map.getTileType(60, 60, 7)).toBe(TileType.STAIRS_DOWN);
    expect(map.isWalkable(60, 60, 7)).toBe(true); // Stairs are walkable

    // Stairs up at (60, 60, 8) in the dungeon
    expect(map.getTileType(60, 60, 8)).toBe(TileType.STAIRS_UP);
    expect(map.isWalkable(60, 60, 8)).toBe(true);
  });

  it('should serialize a viewport correctly', () => {
    const map = new MapGrid();
    const rangeX = 18;
    const rangeY = 14;
    const serialized = map.serializeViewport(64, 64, 7, rangeX, rangeY);
    
    const view = new DataView(serialized.buffer);
    const minX = view.getUint16(0, true);
    const minY = view.getUint16(2, true);
    const z = view.getUint8(4);
    const w = view.getUint8(5);
    const h = view.getUint8(6);
    
    expect(minX).toBe(64 - rangeX);
    expect(minY).toBe(64 - rangeY);
    expect(z).toBe(7);
    expect(w).toBe(2 * rangeX + 1);
    expect(h).toBe(2 * rangeY + 1);
    
    // Total size should be metadata (7 bytes) + grid data (w * h)
    expect(serialized.length).toBe(7 + w * h);
  });
});
