import { Position, Opcode, ByteBuffer, Direction } from 'shared';
import { MapGrid, TileType } from '../map/MapGrid.js';
import { AoIManager, AoIEntity } from '../map/AoIManager.js';
import { Player } from '../player/Player.js';
import { Monster } from '../monster/Monster.js';
import { Rat } from '../monster/Rat.js';
import { CaveRat } from '../monster/CaveRat.js';
import { Orc } from '../monster/Orc.js';
import { Dragon } from '../monster/Dragon.js';
import { WebSocket } from 'ws';
import { ConnectionManager } from '../ws/ConnectionManager.js';
import { MonsterAI } from '../monster/MonsterAI.js';
import { CombatSystem } from '../combat/CombatSystem.js';

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
    CombatSystem.tick(this, now);
  }

  public broadcastEntityHp(entity: Player | Monster) {
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

  public broadcastCombatEffect(pos: Position, type: number, amount: number) {
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

  public broadcastPlayerExp(player: Player) {
    const buffer = new ByteBuffer(32);
    buffer.writeUint8(Opcode.S2C_PLAYER_EXP);
    buffer.writeUint32(player.exp);
    buffer.writeUint16(player.level);
    player.sendPacket(buffer.getPayload());
  }

  public respawnMonster(id: number, name: string, spawnPos: Position, monsterTypeId: number) {
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
    MonsterAI.tick(this, now);
  }

  public handlePlayerLogin(name: string, socket: WebSocket): Player {
    const id = this.nextEntityId++;
    const spawnPos: Position = { x: 64, y: 64, z: 7 }; // Center surface
    const player = new Player(id, name, spawnPos);
    ConnectionManager.getInstance().register(id, socket);
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
    ConnectionManager.getInstance().remove(player.id);

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

  public sendMapDescription(player: Player) {
    const mapData = this.map.serializeViewport(player.pos.x, player.pos.y, player.pos.z, 20, 16);
    const buffer = new ByteBuffer(mapData.length + 8);
    buffer.writeUint8(Opcode.S2C_MAP_DESCRIPTION);
    
    // Copy the raw map description
    buffer.ensureCapacity(mapData.length);
    buffer.buffer.set(mapData, buffer.writeOffset);
    buffer.writeOffset += mapData.length;

    player.sendPacket(buffer.getPayload());
  }

  public syncPlayerAoI(player: Player) {
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

  public resyncPlayerPosition(player: Player) {
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

  public serializeEntityMove(id: number, from: Position, to: Position, durationMs: number): Uint8Array {
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

  public serializeDespawn(id: number): Uint8Array {
    const buffer = new ByteBuffer(16);
    buffer.writeUint8(Opcode.S2C_ENTITY_DESPAWN);
    buffer.writeUint32(id);
    return buffer.getPayload();
  }
}
