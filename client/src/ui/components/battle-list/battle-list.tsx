import {
  Component,
  Event,
  EventEmitter,
  h,
  Prop,
  Fragment,
} from "@stencil/core";
import type { BattleListEntry } from "../../features/battle-list/state.js";

@Component({
  tag: "battle-list",
  styleUrl: "battle-list.css",
  shadow: true,
})
export class BattleList {
  @Prop() entries: BattleListEntry[] = [];
  @Prop() ready = false;

  @Event({ eventName: "ui:battle-list:attack", bubbles: true, composed: true })
  battleListAttack!: EventEmitter<{ targetId: number }>;

  private handleAttack(entry: BattleListEntry) {
    if (!entry.canAttack) return;
    this.battleListAttack.emit({ targetId: entry.id });
  }

  private renderEntry(entry: BattleListEntry) {
    const hpPercent = Math.round(entry.hpPercent * 100);
    const hpClass =
      entry.hpPercent > 0.66
        ? "hp-high"
        : entry.hpPercent > 0.33
          ? "hp-mid"
          : "hp-low";
    const classes = {
      entry: true,
      targeted: entry.isTarget,
      clickable: entry.canAttack,
    };

    const className = Object.entries(classes)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)
      .join(" ");

    const content = (
      <>
        <span
          class={`badge ${entry.isPlayer ? "badge-player" : "badge-monster"}`}
        >
          {entry.isPlayer ? "Player" : "Monster"}
        </span>
        <div class="meta">
          <span class="name">
            {entry.name} ({hpPercent}% HP)
          </span>
          <div class="hp-bar">
            <div
              class={`hp-fill ${hpClass}`}
              style={{ width: `${hpPercent}%` }}
            ></div>
          </div>
        </div>
      </>
    );

    if (entry.canAttack) {
      return (
        <button
          class={className}
          type="button"
          onClick={() => this.handleAttack(entry)}
        >
          {content}
        </button>
      );
    }

    return <div class={className}>{content}</div>;
  }

  render() {
    if (!this.ready) {
      return <div class="placeholder">Scanning for combatants...</div>;
    }

    if (this.entries.length === 0) {
      return <div class="placeholder">No targets in range.</div>;
    }

    return (
      <div class="list">
        {this.entries.map((entry) => this.renderEntry(entry))}
      </div>
    );
  }
}
