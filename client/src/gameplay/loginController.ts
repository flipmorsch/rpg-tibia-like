import { NetworkHandler } from '../network.js';
import { AppEventMap } from '../ui/events/eventHub.js';
import { TypedEventBus } from '../ui/events/typedEventBus.js';

export class LoginGameplayController {
  constructor(
    bus: TypedEventBus<AppEventMap>,
    network: NetworkHandler,
    setPlayerName: (name: string) => void,
    getWebSocketUrl: () => string
  ) {
    bus.on('gameplay:login:request', ({ name }) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setPlayerName(trimmed);
      network.connect(getWebSocketUrl());
    });
  }
}
