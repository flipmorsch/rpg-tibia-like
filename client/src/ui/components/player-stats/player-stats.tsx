import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'player-stats',
  styleUrl: 'player-stats.css',
  shadow: true,
})
export class PlayerStats {
  @Prop() name = '';
  @Prop() level = 1;
  @Prop() exp = 0;
  @Prop() hp = 100;
  @Prop() maxHp = 100;
  @Prop() speed = 100;
  @Prop() cooldownMs = 220;
  @Prop() damageMin = 13;
  @Prop() damageMax = 24;
  @Prop() ready = false;

  render() {
    if (!this.ready) {
      return <div class="placeholder">Loading character stats...</div>;
    }

    const hpPercent = this.maxHp > 0 ? Math.round((this.hp / this.maxHp) * 100) : 0;
    const hpClass = hpPercent > 0.66 ? 'hp-high' : hpPercent > 0.33 ? 'hp-mid' : 'hp-low';
    const expNeeded = this.level * 200;
    const expPercent = Math.round((this.exp / expNeeded) * 100);

    return (
      <div class="stats-panel">
        <div class="stat-row">
          <span class="stat-label">Name</span>
          <span class="stat-value">{this.name}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Level</span>
          <span class="stat-value">{this.level}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Experience</span>
          <span class="stat-value">{this.exp} / {expNeeded} ({expPercent}%)</span>
        </div>

        <div class="hp-section">
          <div class="hp-header">
            <span class="stat-label">HP</span>
            <span class="stat-value">{this.hp} / {this.maxHp}</span>
          </div>
          <div class="hp-bar">
            <div class={`hp-fill ${hpClass}`} style={{ width: `${hpPercent}%` }}></div>
          </div>
        </div>

        <div class="stat-row">
          <span class="stat-label">Speed</span>
          <span class="stat-value">{this.speed}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Walk Cooldown</span>
          <span class="stat-value">{this.cooldownMs}ms</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Damage</span>
          <span class="stat-value">{this.damageMin} - {this.damageMax}</span>
        </div>
      </div>
    );
  }
}
