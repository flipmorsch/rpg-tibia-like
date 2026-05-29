import { NetworkHandler } from '../network.js';
import { AppEventMap } from '../ui/events/eventHub.js';
import { TypedEventBus } from '../ui/events/typedEventBus.js';

export class ChatGameplayController {
  constructor(bus: TypedEventBus<AppEventMap>, network: NetworkHandler) {
    bus.on('gameplay:chat:send', ({ message, type }) => {
      network.sendChat(type, message);
    });
  }
}
