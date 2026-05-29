import { Position } from 'shared';
import { Monster } from './Monster.js';

export class Rat extends Monster {
  constructor(id: number, name: string, startPos: Position) {
    super(id, name, startPos);
    this.monsterTypeId = 1;
    this.hp = 30;
    this.maxHp = 30;
    this.speed = 60;
  }

  public getDamageBounds() {
    return { min: 2, max: 6 };
  }

  public getExpReward() {
    return 15;
  }

  public getAggroRange() {
    return 0; // Passive
  }
}
