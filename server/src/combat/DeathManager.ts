import { Position, Opcode, ByteBuffer } from 'shared';
import { Player } from '../player/Player.js';
import { Monster } from '../monster/Monster.js';
import { GameWorld } from '../game/GameWorld.js';

export class DeathManager {
  public static handlePlayerDeath(world: GameWorld, player: Player): void {
    console.log(`Player '${player.name}' (ID: ${player.id}) died!`);
    const lostExp = Math.floor(player.exp * 0.1);
    player.exp = Math.max(0, player.exp - lostExp);
    player.targetId = 0;
    player.hp = player.maxHp;

    // Send death message
    const chatBuffer = new ByteBuffer(128);
    chatBuffer.writeUint8(Opcode.S2C_CHAT_MESSAGE);
    chatBuffer.writeUint32(0); // System sender ID
    chatBuffer.writeString('System');
    chatBuffer.writeUint8(1); // Chat type
    chatBuffer.writeString(`You died and lost ${lostExp} experience points!`);
    player.sendPacket(chatBuffer.getPayload());

    world.broadcastPlayerExp(player);
    world.broadcastEntityHp(player);

    // Despawn from current floor
    const despawnPacket = player.serializeDespawn();
    const oldSpectators = world.aoi.getSpectators(player.pos);
    for (const spec of oldSpectators) {
      if (spec.id !== player.id && spec.sendPacket) {
        spec.sendPacket(despawnPacket);
      }
    }

    // Teleport to temple
    const oldPos = { ...player.pos };
    player.pos = { x: 64, y: 64, z: 7 };
    player.knownEntityIds.clear();

    world.aoi.updateEntitySector(player, oldPos);
    world.sendMapDescription(player);
    world.syncPlayerAoI(player);
    world.resyncPlayerPosition(player);

    // Spawn on new floor
    const spawnPacket = player.serializeSpawn();
    const newSpectators = world.aoi.getSpectators(player.pos);
    for (const spec of newSpectators) {
      if (spec.id !== player.id && spec.sendPacket) {
        spec.sendPacket(spawnPacket);
      }
    }
  }

  public static handleMonsterDeath(world: GameWorld, monster: Monster, killer: Player): void {
    console.log(`Monster '${monster.name}' (ID: ${monster.id}) died, killed by '${killer.name}'!`);
    
    // Reward player EXP
    const expReward = monster.getExpReward();
    killer.exp += expReward;
    const expNeeded = killer.level * 200;
    if (killer.exp >= expNeeded) {
      killer.level++;
      killer.maxHp += 20;
      killer.hp = killer.maxHp;
      world.broadcastEntityHp(killer);

      const chatBuffer = new ByteBuffer(128);
      chatBuffer.writeUint8(Opcode.S2C_CHAT_MESSAGE);
      chatBuffer.writeUint32(0);
      chatBuffer.writeString('System');
      chatBuffer.writeUint8(1);
      chatBuffer.writeString(`Congratulations! You leveled up to Level ${killer.level}!`);
      killer.sendPacket(chatBuffer.getPayload());
    }

    world.broadcastPlayerExp(killer);

    // Remove from simulation
    world.monsters.delete(monster.id);
    world.aoi.removeEntity(monster);

    const despawnPacket = monster.serializeDespawn();
    const spectators = world.aoi.getSpectators(monster.pos);
    for (const spec of spectators) {
      if (spec.sendPacket) {
        spec.sendPacket(despawnPacket);
      }
    }

    // Schedule 1-minute respawn
    setTimeout(() => {
      world.respawnMonster(monster.id, monster.name, monster.homePos, monster.monsterTypeId);
    }, 60000);
  }
}
