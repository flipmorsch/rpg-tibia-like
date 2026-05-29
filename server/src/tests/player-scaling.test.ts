import { describe, expect, it } from 'vitest';
import { Player } from '../player/Player.js';
import { Position } from 'shared';

function createPlayerAtLevel(level: number): Player {
  const player = new Player(1, 'TestPlayer', { x: 64, y: 64, z: 7 });
  player.level = level;
  player.maxHp = player.getMaxHpForLevel();
  player.speed = player.getSpeedForLevel();
  return player;
}

describe('Player attribute scaling', () => {
  describe('getMaxHpForLevel', () => {
    it('returns 100 at level 1', () => {
      const p = createPlayerAtLevel(1);
      expect(p.getMaxHpForLevel()).toBe(100);
    });

    it('returns 200 at level 5', () => {
      const p = createPlayerAtLevel(5);
      expect(p.getMaxHpForLevel()).toBe(200);
    });

    it('returns 325 at level 10', () => {
      const p = createPlayerAtLevel(10);
      expect(p.getMaxHpForLevel()).toBe(325);
    });

    it('returns 575 at level 20', () => {
      const p = createPlayerAtLevel(20);
      expect(p.getMaxHpForLevel()).toBe(575);
    });

    it('returns 825 at level 30', () => {
      const p = createPlayerAtLevel(30);
      expect(p.getMaxHpForLevel()).toBe(825);
    });
  });

  describe('getSpeedForLevel', () => {
    it('returns 100 at level 1', () => {
      const p = createPlayerAtLevel(1);
      expect(p.getSpeedForLevel()).toBe(100);
    });

    it('returns 136 at level 10', () => {
      const p = createPlayerAtLevel(10);
      expect(p.getSpeedForLevel()).toBe(136);
    });

    it('returns 176 at level 20', () => {
      const p = createPlayerAtLevel(20);
      expect(p.getSpeedForLevel()).toBe(176);
    });

    it('caps at 250 (level 50 reaches 296, clamped)', () => {
      const p = createPlayerAtLevel(50);
      expect(p.getSpeedForLevel()).toBe(250);
    });
  });

  describe('getDamageBounds', () => {
    it('returns {min:13, max:24} at level 1', () => {
      const p = createPlayerAtLevel(1);
      expect(p.getDamageBounds()).toEqual({ min: 13, max: 24 });
    });

    it('returns {min:40, max:60} at level 10', () => {
      const p = createPlayerAtLevel(10);
      expect(p.getDamageBounds()).toEqual({ min: 40, max: 60 });
    });

    it('returns {min:100, max:140} at level 30', () => {
      const p = createPlayerAtLevel(30);
      expect(p.getDamageBounds()).toEqual({ min: 100, max: 140 });
    });
  });

  describe('getAttackCooldown', () => {
    it('returns 1965 at level 1', () => {
      const p = createPlayerAtLevel(1);
      expect(p.getAttackCooldown()).toBe(1965);
    });

    it('returns 1650 at level 10', () => {
      const p = createPlayerAtLevel(10);
      expect(p.getAttackCooldown()).toBe(1650);
    });

    it('returns 950 at level 30', () => {
      const p = createPlayerAtLevel(30);
      expect(p.getAttackCooldown()).toBe(950);
    });

    it('floors at 500 (level 50)', () => {
      const p = createPlayerAtLevel(50);
      expect(p.getAttackCooldown()).toBe(500);
    });
  });
});
