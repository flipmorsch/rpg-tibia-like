import { Position } from 'shared';
import { Monster } from './Monster.js';

export class CaveRat extends Monster {
  constructor(id: number, name: string, startPos: Position) {
    super(id, name, startPos);
    this.monsterTypeId = 2;
    this.hp = 45;
    this.maxHp = 45;
    this.speed = 65;
  }

  public getDamageBounds() {
    return { min: 3, max: 8 };
  }

  public getExpReward() {
    return 25;
  }

  public getAggroRange() {
    return 5;
  }
}
