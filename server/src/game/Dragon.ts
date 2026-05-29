import { Position } from 'shared';
import { Monster } from './Monster.js';

export class Dragon extends Monster {
  constructor(id: number, name: string, startPos: Position) {
    super(id, name, startPos);
    this.monsterTypeId = 4;
    this.hp = 800;
    this.maxHp = 800;
    this.speed = 80;
  }

  public getDamageBounds() {
    return { min: 25, max: 70 };
  }

  public getExpReward() {
    return 700;
  }

  public getAggroRange() {
    return 6;
  }
}
