import { Direction } from 'shared';
import { TileType } from '../map/MapGrid.js';
import { Player } from '../player/Player.js';
import { AoIEntity } from '../map/AoIManager.js';
import { GameWorld } from '../game/GameWorld.js';

export class MonsterAI {
  public static tick(world: GameWorld, now: number): void {
    for (const monster of world.monsters.values()) {
      if (now - monster.lastMoveTime < monster.getMoveCooldown()) continue;

      // 1. Validate existing target
      let target: Player | null = null;
      if (monster.targetId !== 0) {
        const p = world.players.get(monster.targetId);
        if (p && p.pos.z === monster.pos.z && p.hp > 0) {
          target = p;
        } else {
          monster.targetId = 0;
        }
      }

      // 2. Scan for players within subclass aggro range if target is not set/valid
      if (!target && monster.getAggroRange() > 0) {
        const entities = world.aoi.getEntitiesInAoI(monster.pos);
        for (const ent of entities) {
          if (ent.isPlayer) {
            const p = ent as Player;
            const dist = Math.abs(p.pos.x - monster.pos.x) + Math.abs(p.pos.y - monster.pos.y);
            if (dist <= monster.getAggroRange() && p.pos.z === monster.pos.z && p.hp > 0) {
              monster.targetId = p.id;
              target = p;
              break;
            }
          }
        }
      }

      // 3. Move/Chase Logic
      let tx = monster.pos.x;
      let ty = monster.pos.y;
      const tz = monster.pos.z;
      let moved = false;

      if (target) {
        // Chase target: step towards them
        const dist = Math.abs(target.pos.x - monster.pos.x) + Math.abs(target.pos.y - monster.pos.y);
        if (dist <= 1) {
          // Already adjacent to target, don't move, just prepare to attack
          continue;
        }

        const dx = Math.sign(target.pos.x - monster.pos.x);
        const dy = Math.sign(target.pos.y - monster.pos.y);

        const tryXFirst = Math.abs(target.pos.x - monster.pos.x) > Math.abs(target.pos.y - monster.pos.y);
        const stepX = { x: monster.pos.x + dx, y: monster.pos.y };
        const stepY = { x: monster.pos.x, y: monster.pos.y + dy };

        const checkStep = (step: { x: number; y: number }): boolean => {
          if (world.map.isWalkable(step.x, step.y, tz)) {
            const tile = world.map.getTileType(step.x, step.y, tz);
            if (tile !== TileType.STAIRS_UP && tile !== TileType.STAIRS_DOWN) {
              tx = step.x;
              ty = step.y;
              return true;
            }
          }
          return false;
        };

        if (tryXFirst) {
          if (checkStep(stepX)) moved = true;
          else if (checkStep(stepY)) moved = true;
        } else {
          if (checkStep(stepY)) moved = true;
          else if (checkStep(stepX)) moved = true;
        }
      } else {
        // Wander randomly (30% chance on AI tick to prevent frantic wandering)
        if (Math.random() > 0.3) continue;

        const dir: Direction = Math.floor(Math.random() * 4);
        let dx = 0;
        let dy = 0;
        if (dir === Direction.NORTH) dy = -1;
        else if (dir === Direction.EAST) dx = 1;
        else if (dir === Direction.SOUTH) dy = 1;
        else if (dir === Direction.WEST) dx = -1;

        tx = monster.pos.x + dx;
        ty = monster.pos.y + dy;

        if (world.map.isWalkable(tx, ty, tz)) {
          const tile = world.map.getTileType(tx, ty, tz);
          if (tile !== TileType.STAIRS_UP && tile !== TileType.STAIRS_DOWN) {
            moved = true;
          }
        }
      }

      if (moved) {
        const oldPos = { ...monster.pos };
        monster.pos.x = tx;
        monster.pos.y = ty;
        monster.lastMoveTime = now;

        world.aoi.updateEntitySector(monster, oldPos);

        // Broadcast movement to all spectators (both old and new positions)
        const movePacket = world.serializeEntityMove(monster.id, oldPos, monster.pos, monster.getMoveCooldown());
        
        const spectators = new Set<AoIEntity>([
          ...world.aoi.getSpectators(oldPos),
          ...world.aoi.getSpectators(monster.pos),
        ]);

        for (const spec of spectators) {
          if (spec.sendPacket) {
            spec.sendPacket(movePacket);
          }
        }
      }
    }
  }
}
