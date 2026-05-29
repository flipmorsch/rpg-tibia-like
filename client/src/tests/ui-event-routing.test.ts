import { describe, expect, it, vi } from 'vitest';
import { ChatGameplayController } from '../gameplay/chatController.js';
import { CombatController } from '../gameplay/combatController.js';
import { LoginGameplayController } from '../gameplay/loginController.js';
import { createEventHub } from '../ui/events/eventHub.js';

describe('UI event routing', () => {
  it('routes battle list attack to combat gameplay handler', () => {
    const eventHub = createEventHub();
    const network = { sendAttack: vi.fn() };
    const renderer = { setTargetId: vi.fn() };

    new CombatController(eventHub.bus, network as any, renderer as any);

    eventHub.bus.on('ui:battle-list:attack', (payload) => {
      eventHub.dispatchGameplay('gameplay:combat:attack', payload);
    });

    eventHub.dispatchUi('ui:battle-list:attack', { targetId: 42 });

    expect(network.sendAttack).toHaveBeenCalledWith(42);
    expect(renderer.setTargetId).toHaveBeenCalledWith(42);
  });

  it('routes chat send to chat gameplay handler', () => {
    const eventHub = createEventHub();
    const network = { sendChat: vi.fn() };

    new ChatGameplayController(eventHub.bus, network as any);

    eventHub.bus.on('ui:chat:send', (payload) => {
      eventHub.dispatchGameplay('gameplay:chat:send', payload);
    });

    eventHub.dispatchUi('ui:chat:send', { message: 'hello', type: 1 });

    expect(network.sendChat).toHaveBeenCalledWith(1, 'hello');
  });

  it('routes login submit to login gameplay handler', () => {
    const eventHub = createEventHub();
    const network = { connect: vi.fn() };
    const setPlayerName = vi.fn();
    const getWebSocketUrl = vi.fn(() => 'ws://localhost:8080');

    new LoginGameplayController(eventHub.bus, network as any, setPlayerName, getWebSocketUrl);

    eventHub.bus.on('ui:login:submit', ({ name }) => {
      eventHub.dispatchGameplay('gameplay:login:request', { name });
    });

    eventHub.dispatchUi('ui:login:submit', { name: 'TibiaKnight' });

    expect(setPlayerName).toHaveBeenCalledWith('TibiaKnight');
    expect(getWebSocketUrl).toHaveBeenCalled();
    expect(network.connect).toHaveBeenCalledWith('ws://localhost:8080');
  });
});
