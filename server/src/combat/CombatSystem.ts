import { GameWorld } from '../game/GameWorld.js';
import { Player } from '../player/Player.js';
import { Monster } from '../monster/Monster.js';
import { DeathManager } from './DeathManager.js';

export class CombatSystem {
  public static tick(world: GameWorld, now: number): void {
    // Player combat ticks
    for (const player of world.players.values()) {
      if (player.hp <= 0) continue;
      if (player.targetId !== 0) {
        // Target can be either a monster or another player
        const target = world.monsters.get(player.targetId) || world.players.get(player.targetId);
        if (target && target.pos.z === player.pos.z && target.hp > 0) {
          // Check melee range (adjacent tiles, distance <= 1.5 diagonally)
          const dist = Math.max(Math.abs(player.pos.x - target.pos.x), Math.abs(player.pos.y - target.pos.y));
          if (dist <= 1) {
            if (now - player.lastAttackTime >= 2000) {
              player.lastAttackTime = now;
              const dmg = Math.floor(Math.random() * 11) + 5; // 5 to 15 damage
              target.hp = Math.max(0, target.hp - dmg);

              world.broadcastEntityHp(target);
              world.broadcastCombatEffect(target.pos, 0, dmg);

              if (target.hp <= 0) {
                if (target.isPlayer) {
                  DeathManager.handlePlayerDeath(world, target as Player);
                } else {
                  DeathManager.handleMonsterDeath(world, target as Monster, player);
                }
                player.targetId = 0;
              }
            }
          }
        } else {
          player.targetId = 0;
        }
      }
    }

    // Monster combat ticks
    for (const monster of world.monsters.values()) {
      if (monster.hp <= 0) continue;
      if (monster.targetId !== 0) {
        const target = world.players.get(monster.targetId);
        if (target && target.pos.z === monster.pos.z && target.hp > 0) {
          const dist = Math.max(Math.abs(monster.pos.x - target.pos.x), Math.abs(monster.pos.y - target.pos.y));
          if (dist <= 1) {
            if (now - monster.lastAttackTime >= 2000) {
              monster.lastAttackTime = now;
              const bounds = monster.getDamageBounds();
              const dmg = Math.floor(Math.random() * (bounds.max - bounds.min + 1)) + bounds.min;
              target.hp = Math.max(0, target.hp - dmg);

              world.broadcastEntityHp(target);
              world.broadcastCombatEffect(target.pos, 0, dmg);

              if (target.hp <= 0) {
                DeathManager.handlePlayerDeath(world, target);
                monster.targetId = 0;
              }
            }
          }
        } else {
          monster.targetId = 0;
        }
      }
    }
  }
}
