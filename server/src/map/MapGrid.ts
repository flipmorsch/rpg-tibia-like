import { Position } from 'shared';

export enum TileType {
  VOID = 0,
  GRASS = 1,
  STONE_WALL = 2,
  DIRT = 3,
  STONE_FLOOR = 4,
  STAIRS_UP = 5,
  STAIRS_DOWN = 6,
}

export class MapGrid {
  public readonly width = 128;
  public readonly height = 128;
  public readonly depth = 16; // Z = [0..15], Z=7 is surface
  
  // Three-dimensional array: [Z][Y * width + X] containing tile IDs
  private grid: Uint8Array[];

  constructor() {
    this.grid = [];
    for (let z = 0; z < this.depth; z++) {
      this.grid.push(new Uint8Array(this.width * this.height));
    }
    this.generateDemoWorld();
  }

  private generateDemoWorld() {
    // Fill surface (Z=7) with grass
    const surfaceIndex = 7;
    const surface = this.grid[surfaceIndex];
    surface.fill(TileType.GRASS);

    // Create a stone wall boundary around the map
    for (let x = 0; x < this.width; x++) {
      surface[x] = TileType.STONE_WALL; // North wall
      surface[(this.height - 1) * this.width + x] = TileType.STONE_WALL; // South wall
    }
    for (let y = 0; y < this.height; y++) {
      surface[y * this.width] = TileType.STONE_WALL; // West wall
      surface[y * this.width + (this.width - 1)] = TileType.STONE_WALL; // East wall
    }

    // Add some random boulders/obstacles
    for (let i = 0; i < 200; i++) {
      const rx = Math.floor(Math.random() * (this.width - 4)) + 2;
      const ry = Math.floor(Math.random() * (this.height - 4)) + 2;
      // Make sure we don't block the spawn spot (e.g., 64, 64)
      if (Math.abs(rx - 64) > 5 || Math.abs(ry - 64) > 5) {
        surface[ry * this.width + rx] = TileType.STONE_WALL;
      }
    }

    // Create a dungeon stairs down on surface
    // Let's place a stair tile down at (60, 60, 7)
    surface[60 * this.width + 60] = TileType.STAIRS_DOWN;

    // Build the dungeon (Z=8)
    const dungeonIndex = 8;
    const dungeon = this.grid[dungeonIndex];
    dungeon.fill(TileType.STONE_WALL); // Default solid stone dungeon

    // Carve out a chamber in the dungeon around the stairs
    for (let dy = 55; dy <= 65; dy++) {
      for (let dx = 55; dx <= 65; dx++) {
        dungeon[dy * this.width + dx] = TileType.STONE_FLOOR;
      }
    }
    // Add stairs up back to surface in the dungeon at (60, 60, 8)
    dungeon[60 * this.width + 60] = TileType.STAIRS_UP;

    // Build a mountain/tower floor (Z=6)
    // Let's place a stair up on surface at (68, 68, 7)
    surface[68 * this.width + 68] = TileType.STAIRS_UP;

    const towerIndex = 6;
    const tower = this.grid[towerIndex];
    tower.fill(TileType.VOID); // Void background
    // Create tower platform
    for (let ty = 65; ty <= 71; ty++) {
      for (let tx = 65; tx <= 71; tx++) {
        tower[ty * this.width + tx] = TileType.STONE_FLOOR;
      }
    }
    // Stairs down to surface on Z=6
    tower[68 * this.width + 68] = TileType.STAIRS_DOWN;
  }

  public getTileType(x: number, y: number, z: number): TileType {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || z < 0 || z >= this.depth) {
      return TileType.VOID;
    }
    return this.grid[z][y * this.width + x];
  }

  public isWalkable(x: number, y: number, z: number): boolean {
    const tile = this.getTileType(x, y, z);
    return (
      tile !== TileType.VOID &&
      tile !== TileType.STONE_WALL
    );
  }

  /**
   * Serializes a chunk of the map for sending to clients.
   * Viewport size is usually width * height around player.
   */
  public serializeViewport(centerX: number, centerY: number, z: number, rangeX = 18, rangeY = 14): Uint8Array {
    // Return tile values for the bounding box around center position
    const minX = Math.max(0, centerX - rangeX);
    const maxX = Math.min(this.width - 1, centerX + rangeX);
    const minY = Math.max(0, centerY - rangeY);
    const maxY = Math.min(this.height - 1, centerY + rangeY);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    // Serialized structure:
    // uint16 (minX), uint16 (minY), uint8 (z), uint8 (width), uint8 (height)
    // Then array of tiles (row-major)
    const dataSize = 2 + 2 + 1 + 1 + 1 + (width * height);
    const serialized = new Uint8Array(dataSize);
    const view = new DataView(serialized.buffer);

    view.setUint16(0, minX, true);
    view.setUint16(2, minY, true);
    view.setUint8(4, z);
    view.setUint8(5, width);
    view.setUint8(6, height);

    let offset = 7;
    const floor = this.grid[z];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        serialized[offset++] = floor[y * this.width + x];
      }
    }

    return serialized;
  }
}
