import { Position } from 'shared';
import { Monster } from './Monster.js';

export class Orc extends Monster {
  constructor(id: number, name: string, startPos: Position) {
    super(id, name, startPos);
    this.monsterTypeId = 3;
    this.hp = 120;
    this.maxHp = 120;
    this.speed = 75;
  }

  public getDamageBounds() {
    return { min: 8, max: 22 };
  }

  public getExpReward() {
    return 110;
  }

  public getAggroRange() {
    return 5;
  }
}
