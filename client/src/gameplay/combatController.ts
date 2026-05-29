import { GameRenderer } from '../renderer.js';
import { NetworkHandler } from '../network.js';
import { AppEventMap } from '../ui/events/eventHub.js';
import { TypedEventBus } from '../ui/events/typedEventBus.js';

export class CombatController {
  constructor(bus: TypedEventBus<AppEventMap>, network: NetworkHandler, renderer: GameRenderer) {
    bus.on('gameplay:combat:attack', ({ targetId }) => {
      network.sendAttack(targetId);
      renderer.setTargetId(targetId);
    });
  }
}
