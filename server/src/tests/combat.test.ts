import { describe, it, expect } from 'vitest';
import { GameWorld } from '../game/GameWorld.js';
import { Player } from '../player/Player.js';
import { Rat } from '../monster/Rat.js';
import { CombatSystem } from '../combat/CombatSystem.js';

class TestGameWorld extends GameWorld {
  constructor() {
    super();
    // Stop the tick loop so it doesn't leak timers
    this.stopTickLoop();
    // Clear initial spawned monsters to isolate tests
    this.monsters.clear();
    this.players.clear();
  }

  // Override broadcast methods to prevent actual socket writes / spectator lookups
  public override broadcastEntityHp() {}
  public override broadcastCombatEffect() {}
  public override syncPlayerAoI() {}
}

describe('CombatSystem', () => {
  it('should not attack if target is out of range', () => {
    const world = new TestGameWorld();
    const player = new Player(100, 'TestPlayer', { x: 50, y: 50, z: 7 });
    const monster = new Rat(200, 'TestMonster', { x: 55, y: 55, z: 7 });
    
    world.players.set(player.id, player);
    world.monsters.set(monster.id, monster);
    
    player.targetId = monster.id;
    player.lastAttackTime = 0;
    
    const now = Date.now();
    CombatSystem.tick(world, now);
    
    // Target HP should remain unchanged (Rat max HP is typically small, let's verify it didn't change)
    expect(monster.hp).toBe(monster.maxHp);
    expect(player.lastAttackTime).toBe(0);
  });

  it('should attack if target is adjacent and cooldown is elapsed', () => {
    const world = new TestGameWorld();
    const player = new Player(100, 'TestPlayer', { x: 50, y: 50, z: 7 });
    const monster = new Rat(200, 'TestMonster', { x: 50, y: 51, z: 7 }); // Adjacent North/South
    
    world.players.set(player.id, player);
    world.monsters.set(monster.id, monster);
    
    player.targetId = monster.id;
    player.lastAttackTime = 0;
    
    const now = Date.now();
    CombatSystem.tick(world, now);
    
    // Rat has HP = 20 by default. It should have taken 5-15 damage.
    expect(monster.hp).toBeLessThan(monster.maxHp);
    expect(player.lastAttackTime).toBe(now);
  });

  it('should reset targetId if target dies', () => {
    const world = new TestGameWorld();
    const player = new Player(100, 'TestPlayer', { x: 50, y: 50, z: 7 });
    const monster = new Rat(200, 'TestMonster', { x: 50, y: 51, z: 7 });
    
    // Set monster HP very low so it dies in 1 hit
    monster.hp = 2; 
    
    world.players.set(player.id, player);
    world.monsters.set(monster.id, monster);
    
    player.targetId = monster.id;
    player.lastAttackTime = 0;
    
    const now = Date.now();
    CombatSystem.tick(world, now);
    
    // Monster should be dead (hp = 0) and player target reset to 0
    expect(monster.hp).toBe(0);
    expect(player.targetId).toBe(0);
  });

  it('should allow monster to attack player if in range', () => {
    const world = new TestGameWorld();
    const player = new Player(100, 'TestPlayer', { x: 50, y: 50, z: 7 });
    const monster = new Rat(200, 'TestMonster', { x: 51, y: 51, z: 7 }); // Diagonally adjacent
    
    world.players.set(player.id, player);
    world.monsters.set(monster.id, monster);
    
    monster.targetId = player.id;
    monster.lastAttackTime = 0;
    
    const now = Date.now();
    CombatSystem.tick(world, now);
    
    expect(player.hp).toBeLessThan(player.maxHp);
    expect(monster.lastAttackTime).toBe(now);
  });
});
