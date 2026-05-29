import { Position, Opcode, ByteBuffer, Direction } from 'shared';
import { MapGrid, TileType } from './MapGrid.js';
import { AoIManager, AoIEntity } from './AoIManager.js';
import { Player } from './Player.js';
import { Monster } from './Monster.js';
import { Rat } from './Rat.js';
import { CaveRat } from './CaveRat.js';
import { Orc } from './Orc.js';
import { Dragon } from './Dragon.js';
import { WebSocket } from 'ws';

export class GameWorld {
  public map: MapGrid;
  public aoi: AoIManager;
  public players: Map<number, Player> = new Map();
  public monsters: Map<number, Monster> = new Map();
  
  private nextEntityId = 1;
  private tickInterval: NodeJS.Timeout | null = null;
  private currentTick = 0;

  constructor() {
    this.map = new MapGrid();
    this.aoi = new AoIManager();
    this.spawnMonsters();
    this.startTickLoop();
  }

  private startTickLoop() {
    // 20Hz Game Loop (50ms interval)
    this.tickInterval = setInterval(() => {
      this.tick();
    }, 50);
    console.log('Game tick loop started at 20Hz (50ms interval)');
  }

  public stopTickLoop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
  }

  private spawnMonsters() {
    // Spawn 15 Rats around the surface floor center (Z=7)
    for (let i = 0; i < 15; i++) {
      const rx = Math.floor(Math.random() * 20) + 54; // Centered around 64
      const ry = Math.floor(Math.random() * 20) + 54;
      const z = 7;
      if (this.map.isWalkable(rx, ry, z)) {
        const id = this.nextEntityId++;
        const name = `Rat #${id}`;
        const monster = new Rat(id, name, { x: rx, y: ry, z });
        this.monsters.set(id, monster);
        this.aoi.addEntity(monster);
      }
    }

    // Spawn 5 Cave Rats in the dungeon (Z=8)
    for (let i = 0; i < 5; i++) {
      const rx = Math.floor(Math.random() * 8) + 56; // Inside the 55-65 chamber
      const ry = Math.floor(Math.random() * 8) + 56;
      const z = 8;
      if (this.map.isWalkable(rx, ry, z)) {
        const id = this.nextEntityId++;
        const name = `Cave Rat #${id}`;
        const monster = new CaveRat(id, name, { x: rx, y: ry, z });
        this.monsters.set(id, monster);
        this.aoi.addEntity(monster);
      }
    }

    // Spawn 3 Orcs in the dungeon (Z=8)
    for (let i = 0; i < 3; i++) {
      const rx = Math.floor(Math.random() * 8) + 56;
      const ry = Math.floor(Math.random() * 8) + 56;
      const z = 8;
      if (this.map.isWalkable(rx, ry, z)) {
        const id = this.nextEntityId++;
        const name = `Orc Berserker #${id}`;
        const monster = new Orc(id, name, { x: rx, y: ry, z });
        this.monsters.set(id, monster);
        this.aoi.addEntity(monster);
      }
    }

    // Spawn 1 Dragon on the tower platforms (Z=6)
    const tx = 68;
    const ty = 69;
    const tz = 6;
    if (this.map.isWalkable(tx, ty, tz)) {
      const id = this.nextEntityId++;
      const name = `Ancient Dragon`;
      const monster = new Dragon(id, name, { x: tx, y: ty, z: tz });
      this.monsters.set(id, monster);
      this.aoi.addEntity(monster);
    }
  }

  private tick() {
    this.currentTick++;
    const now = Date.now();

    // 1. Tick Monster AI (Every 10 ticks = 500ms)
    if (this.currentTick % 10 === 0) {
      this.tickMonsterAI(now);
    }

    // 2. Tick Combat Checks (Every tick = 50ms)
    this.tickCombat(now);

    // 3. Continuous visibility updates for moving players
    for (const player of this.players.values()) {
      this.syncPlayerAoI(player);
    }
  }

  private tickCombat(now: number) {
    // Player combat ticks
    for (const player of this.players.values()) {
      if (player.hp <= 0) continue;
      if (player.targetId !== 0) {
        // Target can be either a monster or another player
        const target = this.monsters.get(player.targetId) || this.players.get(player.targetId);
        if (target && target.pos.z === player.pos.z && target.hp > 0) {
          // Check melee range (adjacent tiles, distance <= 1.5 diagonally)
          const dist = Math.max(Math.abs(player.pos.x - target.pos.x), Math.abs(player.pos.y - target.pos.y));
          if (dist <= 1) {
            if (now - player.lastAttackTime >= 2000) {
              player.lastAttackTime = now;
              const dmg = Math.floor(Math.random() * 11) + 5; // 5 to 15 damage
              target.hp = Math.max(0, target.hp - dmg);

              this.broadcastEntityHp(target);
              this.broadcastCombatEffect(target.pos, 0, dmg);

              if (target.hp <= 0) {
                if (target.isPlayer) {
                  this.handlePlayerDeath(target as Player);
                } else {
                  this.handleMonsterDeath(target as Monster, player);
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
    for (const monster of this.monsters.values()) {
      if (monster.hp <= 0) continue;
      if (monster.targetId !== 0) {
        const target = this.players.get(monster.targetId);
        if (target && target.pos.z === monster.pos.z && target.hp > 0) {
          const dist = Math.max(Math.abs(monster.pos.x - target.pos.x), Math.abs(monster.pos.y - target.pos.y));
          if (dist <= 1) {
            if (now - monster.lastAttackTime >= 2000) {
              monster.lastAttackTime = now;
              const bounds = monster.getDamageBounds();
              const dmg = Math.floor(Math.random() * (bounds.max - bounds.min + 1)) + bounds.min;
              target.hp = Math.max(0, target.hp - dmg);

              this.broadcastEntityHp(target);
              this.broadcastCombatEffect(target.pos, 0, dmg);

              if (target.hp <= 0) {
                this.handlePlayerDeath(target);
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

  private broadcastEntityHp(entity: Player | Monster) {
    const buffer = new ByteBuffer(32);
    buffer.writeUint8(Opcode.S2C_ENTITY_HP);
    buffer.writeUint32(entity.id);
    buffer.writeUint16(entity.hp);
    buffer.writeUint16(entity.maxHp);
    const packet = buffer.getPayload();

    const spectators = this.aoi.getSpectators(entity.pos);
    for (const spec of spectators) {
      if (spec.sendPacket) {
        spec.sendPacket(packet);
      }
    }
  }

  private broadcastCombatEffect(pos: Position, type: number, amount: number) {
    const buffer = new ByteBuffer(32);
    buffer.writeUint8(Opcode.S2C_COMBAT_EFFECT);
    buffer.writeUint16(pos.x);
    buffer.writeUint16(pos.y);
    buffer.writeUint8(pos.z);
    buffer.writeUint8(type); // 0 = damage
    buffer.writeUint16(amount);
    const packet = buffer.getPayload();

    const spectators = this.aoi.getSpectators(pos);
    for (const spec of spectators) {
      if (spec.sendPacket) {
        spec.sendPacket(packet);
      }
    }
  }

  private broadcastPlayerExp(player: Player) {
    const buffer = new ByteBuffer(32);
    buffer.writeUint8(Opcode.S2C_PLAYER_EXP);
    buffer.writeUint32(player.exp);
    buffer.writeUint16(player.level);
    player.sendPacket(buffer.getPayload());
  }

  private handlePlayerDeath(player: Player) {
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

    this.broadcastPlayerExp(player);
    this.broadcastEntityHp(player);

    // Despawn from current floor
    const despawnPacket = player.serializeDespawn();
    const oldSpectators = this.aoi.getSpectators(player.pos);
    for (const spec of oldSpectators) {
      if (spec.id !== player.id && spec.sendPacket) {
        spec.sendPacket(despawnPacket);
      }
    }

    // Teleport to temple
    const oldPos = { ...player.pos };
    player.pos = { x: 64, y: 64, z: 7 };
    player.knownEntityIds.clear();

    this.aoi.updateEntitySector(player, oldPos);
    this.sendMapDescription(player);
    this.syncPlayerAoI(player);
    this.resyncPlayerPosition(player);

    // Spawn on new floor
    const spawnPacket = player.serializeSpawn();
    const newSpectators = this.aoi.getSpectators(player.pos);
    for (const spec of newSpectators) {
      if (spec.id !== player.id && spec.sendPacket) {
        spec.sendPacket(spawnPacket);
      }
    }
  }

  private handleMonsterDeath(monster: Monster, killer: Player) {
    console.log(`Monster '${monster.name}' (ID: ${monster.id}) died, killed by '${killer.name}'!`);
    
    // Reward player EXP
    const expReward = monster.getExpReward();
    killer.exp += expReward;
    const expNeeded = killer.level * 200;
    if (killer.exp >= expNeeded) {
      killer.level++;
      killer.maxHp += 20;
      killer.hp = killer.maxHp;
      this.broadcastEntityHp(killer);

      const chatBuffer = new ByteBuffer(128);
      chatBuffer.writeUint8(Opcode.S2C_CHAT_MESSAGE);
      chatBuffer.writeUint32(0);
      chatBuffer.writeString('System');
      chatBuffer.writeUint8(1);
      chatBuffer.writeString(`Congratulations! You leveled up to Level ${killer.level}!`);
      killer.sendPacket(chatBuffer.getPayload());
    }

    this.broadcastPlayerExp(killer);

    // Remove from simulation
    this.monsters.delete(monster.id);
    this.aoi.removeEntity(monster);

    const despawnPacket = monster.serializeDespawn();
    const spectators = this.aoi.getSpectators(monster.pos);
    for (const spec of spectators) {
      if (spec.sendPacket) {
        spec.sendPacket(despawnPacket);
      }
    }

    // Schedule 1-minute respawn
    setTimeout(() => {
      this.respawnMonster(monster.id, monster.name, monster.homePos, monster.monsterTypeId);
    }, 60000);
  }

  private respawnMonster(id: number, name: string, spawnPos: Position, monsterTypeId: number) {
    let monster: Monster;
    switch (monsterTypeId) {
      case 1:
        monster = new Rat(id, name, spawnPos);
        break;
      case 2:
        monster = new CaveRat(id, name, spawnPos);
        break;
      case 3:
        monster = new Orc(id, name, spawnPos);
        break;
      case 4:
        monster = new Dragon(id, name, spawnPos);
        break;
      default:
        monster = new Monster(id, name, spawnPos);
        break;
    }
    this.monsters.set(id, monster);
    this.aoi.addEntity(monster);

    const spawnPacket = monster.serializeSpawn();
    const spectators = this.aoi.getSpectators(spawnPos);
    for (const spec of spectators) {
      if (spec.sendPacket) {
        spec.sendPacket(spawnPacket);
      }
    }
    console.log(`Monster '${name}' (ID: ${id}) respawned at [${spawnPos.x}, ${spawnPos.y}, ${spawnPos.z}]`);
  }

  private tickMonsterAI(now: number) {
    for (const monster of this.monsters.values()) {
      if (now - monster.lastMoveTime < monster.getMoveCooldown()) continue;

      // 1. Validate existing target
      let target: Player | null = null;
      if (monster.targetId !== 0) {
        const p = this.players.get(monster.targetId);
        if (p && p.pos.z === monster.pos.z && p.hp > 0) {
          target = p;
        } else {
          monster.targetId = 0;
        }
      }

      // 2. Scan for players within subclass aggro range if target is not set/valid
      if (!target && monster.getAggroRange() > 0) {
        const entities = this.aoi.getEntitiesInAoI(monster.pos);
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
          if (this.map.isWalkable(step.x, step.y, tz)) {
            const tile = this.map.getTileType(step.x, step.y, tz);
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

        if (this.map.isWalkable(tx, ty, tz)) {
          const tile = this.map.getTileType(tx, ty, tz);
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

        this.aoi.updateEntitySector(monster, oldPos);

        // Broadcast movement to all spectators (both old and new positions)
        const movePacket = this.serializeEntityMove(monster.id, oldPos, monster.pos, monster.getMoveCooldown());
        
        const spectators = new Set<AoIEntity>([
          ...this.aoi.getSpectators(oldPos),
          ...this.aoi.getSpectators(monster.pos),
        ]);

        for (const spec of spectators) {
          if (spec.sendPacket) {
            spec.sendPacket(movePacket);
          }
        }
      }
    }
  }

  public handlePlayerLogin(name: string, socket: WebSocket): Player {
    const id = this.nextEntityId++;
    const spawnPos: Position = { x: 64, y: 64, z: 7 }; // Center surface
    const player = new Player(id, name, spawnPos, socket);
    this.players.set(id, player);
    this.aoi.addEntity(player);

    // 1. Send Login Success
    const successBuffer = new ByteBuffer(32);
    successBuffer.writeUint8(Opcode.S2C_LOGIN_SUCCESS);
    successBuffer.writeUint32(player.id);
    successBuffer.writeUint16(player.pos.x);
    successBuffer.writeUint16(player.pos.y);
    successBuffer.writeUint8(player.pos.z);
    player.sendPacket(successBuffer.getPayload());

    // 2. Send Map Viewport
    this.sendMapDescription(player);

    // 3. Immediately Sync AoI
    this.syncPlayerAoI(player);

    console.log(`Player '${name}' (ID: ${id}) logged in at [${player.pos.x}, ${player.pos.y}, ${player.pos.z}]`);
    return player;
  }

  public handlePlayerDisconnect(player: Player) {
    this.players.delete(player.id);
    this.aoi.removeEntity(player);

    // Notify spectators that player despawned
    const despawnPacket = player.serializeDespawn();
    const spectators = this.aoi.getSpectators(player.pos);
    for (const spec of spectators) {
      if (spec.id !== player.id && spec.sendPacket) {
        spec.sendPacket(despawnPacket);
      }
    }

    console.log(`Player '${player.name}' (ID: ${player.id}) disconnected`);
  }

  public handlePlayerMoveRequest(player: Player, direction: Direction) {
    const now = Date.now();
    const cooldown = player.getMoveCooldown();
    if (now - player.lastMoveTime < cooldown) {
      // Input spamming/speedhack attempt: silently drop or log
      return;
    }

    let dx = 0;
    let dy = 0;
    if (direction === Direction.NORTH) dy = -1;
    else if (direction === Direction.EAST) dx = 1;
    else if (direction === Direction.SOUTH) dy = 1;
    else if (direction === Direction.WEST) dx = -1;

    let tx = player.pos.x + dx;
    let ty = player.pos.y + dy;
    let tz = player.pos.z;

    // Check collision
    if (!this.map.isWalkable(tx, ty, tz)) {
      // Re-sync player position on client if collision occurs
      this.resyncPlayerPosition(player);
      return;
    }

    const tile = this.map.getTileType(tx, ty, tz);
    let floorTransition = false;

    // Handle stairs transition
    if (tile === TileType.STAIRS_UP) {
      tz = tz - 1;
      // Classic Tibia logic shifts you backwards or forwards when stepping on stairs
      // For simplicity, we step you up and shift you slightly East (or wherever the map design dictates, here we keep coordinate same)
      floorTransition = true;
    } else if (tile === TileType.STAIRS_DOWN) {
      tz = tz + 1;
      floorTransition = true;
    }

    const oldPos = { ...player.pos };
    player.pos.x = tx;
    player.pos.y = ty;
    player.pos.z = tz;
    player.lastMoveTime = now;

    const sectorChanged = this.aoi.updateEntitySector(player, oldPos);

    if (floorTransition) {
      // Floor transitions are instantaneous snaps.
      // 1. Reset client known entities (they are all invalid on the new floor)
      player.knownEntityIds.clear();

      // 2. Broadcast despawn to spectators on the old floor
      const despawnPacket = player.serializeDespawn();
      const oldSpectators = this.aoi.getSpectators(oldPos);
      for (const spec of oldSpectators) {
        if (spec.id !== player.id && spec.sendPacket) {
          spec.sendPacket(despawnPacket);
        }
      }

      // 3. Send new map description
      this.sendMapDescription(player);

      // 4. Sync player AoI on new floor
      this.syncPlayerAoI(player);

      // 5. Force a position correction on the player client to place them at the new coordinates immediately
      this.resyncPlayerPosition(player);
    } else {
      // Regular walk: send move packet to old and new spectators so they animate
      const movePacket = this.serializeEntityMove(player.id, oldPos, player.pos, cooldown);
      const spectators = new Set<AoIEntity>([
        ...this.aoi.getSpectators(oldPos),
        ...this.aoi.getSpectators(player.pos),
      ]);

      for (const spec of spectators) {
        if (spec.sendPacket) {
          spec.sendPacket(movePacket);
        }
      }

      // Sync entities in range
      this.syncPlayerAoI(player);
    }
  }

  public handlePlayerChat(player: Player, type: number, message: string) {
    if (message.length === 0 || message.length > 100) return;

    const buffer = new ByteBuffer(128);
    buffer.writeUint8(Opcode.S2C_CHAT_MESSAGE);
    buffer.writeUint32(player.id);
    buffer.writeString(player.name);
    buffer.writeUint8(type);
    buffer.writeString(message);

    const packet = buffer.getPayload();
    const spectators = this.aoi.getSpectators(player.pos);

    for (const spec of spectators) {
      if (spec.sendPacket) {
        spec.sendPacket(packet);
      }
    }
  }

  private sendMapDescription(player: Player) {
    const mapData = this.map.serializeViewport(player.pos.x, player.pos.y, player.pos.z, 20, 16);
    const buffer = new ByteBuffer(mapData.length + 8);
    buffer.writeUint8(Opcode.S2C_MAP_DESCRIPTION);
    
    // Copy the raw map description
    buffer.ensureCapacity(mapData.length);
    buffer.buffer.set(mapData, buffer.writeOffset);
    buffer.writeOffset += mapData.length;

    player.sendPacket(buffer.getPayload());
  }

  private syncPlayerAoI(player: Player) {
    const currentAoI = this.aoi.getEntitiesInAoI(player.pos);
    const inRangeIds = new Set<number>();

    // 1. Spawn newly entered entities
    for (const ent of currentAoI) {
      inRangeIds.add(ent.id);

      // Verify distance: standard visibility bounds
      const dx = Math.abs(ent.pos.x - player.pos.x);
      const dy = Math.abs(ent.pos.y - player.pos.y);

      if (dx <= 20 && dy <= 16 && ent.pos.z === player.pos.z) {
        if (!player.knownEntityIds.has(ent.id)) {
          player.knownEntityIds.add(ent.id);

          // Send spawn details of ent to player
          if (ent.id === player.id) continue; // Don't spawn self
          
          if (ent.isPlayer) {
            player.sendPacket((ent as Player).serializeSpawn());
          } else {
            player.sendPacket((ent as Monster).serializeSpawn());
          }

          // Also, if ent is a player, spawn this player on their client
          if (ent.isPlayer && ent.id !== player.id) {
            const other = ent as Player;
            if (!other.knownEntityIds.has(player.id)) {
              other.knownEntityIds.add(player.id);
              other.sendPacket(player.serializeSpawn());
            }
          }
        }
      } else {
        // Out of visual view but in adjacent sector: despawn if we knew them
        if (player.knownEntityIds.has(ent.id)) {
          player.knownEntityIds.delete(ent.id);
          player.sendPacket(this.serializeDespawn(ent.id));
        }
      }
    }

    // 2. Despawn entities that left sectors
    for (const knownId of player.knownEntityIds) {
      if (!inRangeIds.has(knownId)) {
        player.knownEntityIds.delete(knownId);
        player.sendPacket(this.serializeDespawn(knownId));
      }
    }
  }

  private resyncPlayerPosition(player: Player) {
    const buffer = new ByteBuffer(32);
    buffer.writeUint8(Opcode.S2C_LOGIN_SUCCESS); // Re-use login success packet to force-position
    buffer.writeUint32(player.id);
    buffer.writeUint16(player.pos.x);
    buffer.writeUint16(player.pos.y);
    buffer.writeUint8(player.pos.z);
    player.sendPacket(buffer.getPayload());
  }

  public handlePlayerAttackRequest(player: Player, targetId: number) {
    if (targetId === 0) {
      player.targetId = 0;
      return;
    }
    const targetExists = this.players.has(targetId) || this.monsters.has(targetId);
    if (targetExists) {
      player.targetId = targetId;
    }
  }

  private serializeEntityMove(id: number, from: Position, to: Position, durationMs: number): Uint8Array {
    const buffer = new ByteBuffer(32);
    buffer.writeUint8(Opcode.S2C_ENTITY_MOVE);
    buffer.writeUint32(id);
    buffer.writeUint16(from.x);
    buffer.writeUint16(from.y);
    buffer.writeUint16(to.x);
    buffer.writeUint16(to.y);
    buffer.writeUint8(to.z);
    buffer.writeUint16(durationMs);
    return buffer.getPayload();
  }

  private serializeDespawn(id: number): Uint8Array {
    const buffer = new ByteBuffer(16);
    buffer.writeUint8(Opcode.S2C_ENTITY_DESPAWN);
    buffer.writeUint32(id);
    return buffer.getPayload();
  }
}
