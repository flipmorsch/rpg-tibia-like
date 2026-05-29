import { Direction, EntityType } from 'shared';
import { defineCustomElements } from '../ui-dist/loader/index.js';
import { ChatGameplayController } from './gameplay/chatController.js';
import { CombatController } from './gameplay/combatController.js';
import { LoginGameplayController } from './gameplay/loginController.js';
import { InputController } from './input.js';
import { InterpolationEngine } from './interpolation.js';
import { NetworkCallbacks, NetworkHandler } from './network.js';
import { GameRenderer } from './renderer.js';
import { BattleListController } from './ui/features/battle-list/controller.js';
import { selectBattleListProps } from './ui/features/battle-list/selectors.js';
import type { BattleListEntry } from './ui/features/battle-list/state.js';
import { ChatController } from './ui/features/chat/controller.js';
import { selectChatProps } from './ui/features/chat/selectors.js';
import type { ChatMessage } from './ui/features/chat/state.js';
import { LoginController } from './ui/features/login/controller.js';
import { selectLoginProps } from './ui/features/login/selectors.js';
import { createEventHub } from './ui/events/eventHub.js';
import { WorldSnapshot } from './world/worldSnapshot.js';
import { WorldSnapshotStore } from './world/worldSnapshotStore.js';

type BattleListElement = HTMLElement & { entries: BattleListEntry[]; ready: boolean };
type ChatPanelElement = HTMLElement & {
  messages: ChatMessage[];
  enabled: boolean;
  ready: boolean;
  focusInput?: () => Promise<void>;
};
type LoginModalElement = HTMLElement & { open: boolean; name: string; error: string | null; ready: boolean };

defineCustomElements();

class GameClient {
  private network: NetworkHandler;
  private renderer: GameRenderer;
  private input: InputController;
  private interpolation: InterpolationEngine;

  private eventHub = createEventHub();
  private worldSnapshots = new WorldSnapshotStore();
  private battleListController = new BattleListController();
  private chatController = new ChatController();
  private loginController = new LoginController();

  private battleListElement: BattleListElement | null = null;
  private chatPanelElement: ChatPanelElement | null = null;
  private loginModalElement: LoginModalElement | null = null;

  private myPlayerId: number | null = null;
  private myPlayerName = '';
  private myPlayerSpeed = 100;
  private myPlayerLastMoveTime = 0;
  private sidebarThrottleMs = 100; // ms between sidebar updates
  private lastSidebarUpdate = 0;
  private isConnected = false;
  private playerLevel = 1;
  private playerExp = 0;

  constructor() {
    this.interpolation = new InterpolationEngine();
    this.renderer = new GameRenderer('game-viewport');

    // Setup input controller with movement callback
    this.input = new InputController((dir: Direction) => {
      this.handleMoveRequest(dir);
    });

    this.bindUiComponents();
    this.bindEventRouting();
    this.bindFeatureSubscriptions();
    this.bindGlobalShortcuts();

    this.myPlayerName = this.loginController.getState().name;

    // Configure network callbacks
    const callbacks: NetworkCallbacks = {
      onConnect: () => this.handleConnect(),
      onDisconnect: () => this.handleDisconnect(),
      onLoginSuccess: (id, x, y, z) => this.handleLoginSuccess(id, x, y, z),
      onLoginFailure: (reason) => this.handleLoginFailure(reason),
      onMapDescription: (minX, minY, z, w, h, tiles) => this.handleMapDescription(minX, minY, z, w, h, tiles),
      onEntitySpawn: (id, type, name, x, y, z, speed, hp, maxHp, monsterTypeId) =>
        this.handleEntitySpawn(id, type, name, x, y, z, speed, hp, maxHp, monsterTypeId),
      onEntityDespawn: (id) => this.handleEntityDespawn(id),
      onEntityMove: (id, fx, fy, tx, ty, z, dur) => this.handleEntityMove(id, fx, fy, tx, ty, z, dur),
      onChatMessage: (id, name, type, msg) => this.handleChatMessage(id, name, type, msg),
      onEntityHp: (id, hp, maxHp) => this.handleEntityHp(id, hp, maxHp),
      onCombatEffect: (x, y, z, type, amount) => this.handleCombatEffect(x, y, z, type, amount),
      onPlayerExp: (exp, level) => this.handlePlayerExp(exp, level),
      onHeartbeat: () => {}, // Handled silently
    };

    this.network = new NetworkHandler(callbacks);

    new CombatController(this.eventHub.bus, this.network, this.renderer);
    new ChatGameplayController(this.eventHub.bus, this.network);
    new LoginGameplayController(
      this.eventHub.bus,
      this.network,
      (name) => {
        this.myPlayerName = name;
      },
      () => this.getWebSocketUrl()
    );

    this.startLoop();
    this.updateWorldSnapshot();
  }

  private bindUiComponents() {
    this.battleListElement = document.querySelector('battle-list');
    this.chatPanelElement = document.querySelector('chat-panel');
    this.loginModalElement = document.querySelector('login-modal');

    this.battleListElement?.addEventListener('ui:battle-list:attack', (event) => {
      const detail = (event as CustomEvent<{ targetId: number }>).detail;
      this.eventHub.dispatchUi('ui:battle-list:attack', detail);
    });

    this.chatPanelElement?.addEventListener('ui:chat:send', (event) => {
      const detail = (event as CustomEvent<{ message: string; type: number }>).detail;
      this.eventHub.dispatchUi('ui:chat:send', detail);
    });

    this.chatPanelElement?.addEventListener('ui:chat:focus', (event) => {
      const detail = (event as CustomEvent<{ focused: boolean }>).detail;
      this.eventHub.dispatchUi('ui:chat:focus', detail);
    });

    this.loginModalElement?.addEventListener('ui:login:submit', (event) => {
      const detail = (event as CustomEvent<{ name: string }>).detail;
      this.eventHub.dispatchUi('ui:login:submit', detail);
    });

    this.loginModalElement?.addEventListener('ui:login:name', (event) => {
      const detail = (event as CustomEvent<{ name: string }>).detail;
      this.eventHub.dispatchUi('ui:login:name', detail);
    });
  }

  private bindEventRouting() {
    this.eventHub.bus.on('ui:battle-list:attack', (payload) => {
      this.eventHub.dispatchGameplay('gameplay:combat:attack', payload);
    });

    this.eventHub.bus.on('ui:chat:send', (payload) => {
      this.eventHub.dispatchGameplay('gameplay:chat:send', payload);
    });

    this.eventHub.bus.on('ui:chat:focus', ({ focused }) => {
      this.chatController.setFocused(focused);
    });

    this.eventHub.bus.on('ui:login:name', ({ name }) => {
      this.loginController.setName(name);
    });

    this.eventHub.bus.on('ui:login:submit', ({ name }) => {
      this.loginController.setName(name);
      this.eventHub.dispatchGameplay('gameplay:login:request', { name });
    });
  }

  private bindFeatureSubscriptions() {
    this.worldSnapshots.subscribe((snapshot) => {
      this.battleListController.setWorldSnapshot(snapshot);
    });

    this.battleListController.subscribe((state) => {
      if (!this.battleListElement) return;
      const props = selectBattleListProps(state);
      this.battleListElement.entries = props.entries;
      this.battleListElement.ready = props.ready;
    });

    this.chatController.subscribe((state) => {
      const props = selectChatProps(state);
      if (this.chatPanelElement) {
        this.chatPanelElement.messages = props.messages;
        this.chatPanelElement.enabled = props.enabled;
        this.chatPanelElement.ready = props.ready;
      }
      this.input.setChatFocused(state.focused);
    });

    this.loginController.subscribe((state) => {
      if (!this.loginModalElement) return;
      const props = selectLoginProps(state);
      this.loginModalElement.open = props.open;
      this.loginModalElement.name = props.name;
      this.loginModalElement.error = props.error;
      this.loginModalElement.ready = props.ready;
    });
  }

  private bindGlobalShortcuts() {
    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      if (this.myPlayerId === null) return;
      if (this.loginController.getState().open) return;
      if (this.chatController.getState().focused || !this.chatController.getState().enabled) return;

      event.preventDefault();
      this.chatPanelElement?.focusInput?.();
    });
  }

  private getMyMoveCooldown(): number {
    return Math.max(100, Math.min(1000, 300 - this.myPlayerSpeed * 0.8));
  }

  private getWebSocketUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.hostname}:8080`;
  }

  private handleMoveRequest(direction: Direction) {
    if (this.myPlayerId === null) return;
    const now = Date.now();
    const cooldown = this.getMyMoveCooldown();

    // Prevent local movement request flooding
    if (now - this.myPlayerLastMoveTime < cooldown) return;

    // Throttle client movement requests locally
    this.myPlayerLastMoveTime = now;
    this.network.sendMove(direction);
  }

  // --- Network Event Handlers ---

  private handleConnect() {
    this.isConnected = true;
    const dot = document.getElementById('status-dot')!;
    const text = document.getElementById('status-text')!;
    dot.className = 'status-dot online';
    text.innerText = 'Connected';

    // Automatically send login request once socket is open
    this.network.sendLogin(this.myPlayerName);
    this.updateWorldSnapshot();
  }

  private handleDisconnect() {
    this.isConnected = false;
    this.myPlayerId = null;
    this.interpolation.clear();
    this.input.clear();
    this.renderer.setTargetId(0);

    const dot = document.getElementById('status-dot')!;
    const text = document.getElementById('status-text')!;
    dot.className = 'status-dot';
    text.innerText = 'Disconnected';

    this.loginController.show();
    this.chatController.setEnabled(false);
    this.chatController.setFocused(false);

    this.pushSystemMessage('Disconnected from game server.');
    this.updateWorldSnapshot();
  }

  private handleLoginSuccess(id: number, x: number, y: number, z: number) {
    this.myPlayerId = id;

    this.loginController.hide();
    this.chatController.setEnabled(true);

    // Spawn self in client local list
    this.interpolation.spawnEntity(id, this.myPlayerName, EntityType.PLAYER, x, y, z, this.myPlayerSpeed);

    // Update HUD
    document.getElementById('player-name')!.innerText = this.myPlayerName;

    this.pushSystemMessage(`Character ${this.myPlayerName} successfully logged in.`);
    this.updateWorldSnapshot();
  }

  private handleLoginFailure(reason: string) {
    this.loginController.show();
    this.loginController.setError(`Login failed: ${reason}`);
    this.network.disconnect();
  }

  private handleMapDescription(minX: number, minY: number, z: number, w: number, h: number, tiles: Uint8Array) {
    this.renderer.setLocalMap({ minX, minY, z, width: w, height: h, tiles });
  }

  private handleEntitySpawn(
    id: number,
    type: number,
    name: string,
    x: number,
    y: number,
    z: number,
    speed: number,
    hp: number,
    maxHp: number,
    monsterTypeId: number
  ) {
    this.interpolation.spawnEntity(id, name, type as EntityType, x, y, z, speed, hp, maxHp, monsterTypeId);
  }

  private handleEntityHp(id: number, hp: number, maxHp: number) {
    this.interpolation.updateEntityHp(id, hp, maxHp);
  }

  private handleCombatEffect(x: number, y: number, z: number, type: number, amount: number) {
    this.renderer.addCombatEffect(x, y, z, type, amount);
  }

  private handlePlayerExp(exp: number, level: number) {
    this.playerExp = exp;
    this.playerLevel = level;
    const expVal = document.getElementById('player-exp');
    if (expVal) expVal.innerText = `${exp}`;
    const lvlVal = document.getElementById('player-level');
    if (lvlVal) lvlVal.innerText = `${level}`;
  }

  private handleEntityDespawn(id: number) {
    this.interpolation.despawnEntity(id);
  }

  private handleEntityMove(id: number, fx: number, fy: number, tx: number, ty: number, z: number, duration: number) {
    this.interpolation.handleEntityMove(id, fx, fy, tx, ty, z, duration);

    if (id === this.myPlayerId) {
      // Release movement lock timing
      this.myPlayerLastMoveTime = Date.now() - (this.getMyMoveCooldown() - duration);

      // Update sidebar HUD positions
      const posLabel = document.getElementById('player-pos')!;
      posLabel.innerText = `${tx}, ${ty}, ${z}`;
    }
  }

  private handleChatMessage(id: number, name: string, _type: number, message: string) {
    const isSelf = id === this.myPlayerId;
    this.chatController.appendPlayerMessage(name, message, isSelf);

    // Bubble message above visual player head
    this.interpolation.setChatBubble(id, message);
  }

  private pushSystemMessage(text: string) {
    this.chatController.appendSystemMessage(text);
  }

  private updateWorldSnapshot(now = Date.now()) {
    const entities = Array.from(this.interpolation.getEntities().values()).map((entity) => ({
      id: entity.id,
      name: entity.name,
      isPlayer: entity.isPlayer,
      gridX: entity.gridX,
      gridY: entity.gridY,
      gridZ: entity.gridZ,
      hp: entity.hp,
      maxHp: entity.maxHp,
      monsterTypeId: entity.monsterTypeId,
    }));

    const playerEntity = this.myPlayerId !== null ? this.interpolation.getEntity(this.myPlayerId) : undefined;
    const player = playerEntity
      ? {
          id: playerEntity.id,
          name: playerEntity.name,
          speed: this.myPlayerSpeed,
          cooldownMs: this.getMyMoveCooldown(),
          position: {
            x: playerEntity.gridX,
            y: playerEntity.gridY,
            z: playerEntity.gridZ,
          },
          level: this.playerLevel,
          exp: this.playerExp,
        }
      : null;

    const snapshot: WorldSnapshot = {
      connected: this.isConnected,
      player,
      entities,
      targetId: this.renderer.getTargetId(),
      lastUpdated: now,
    };

    this.worldSnapshots.setSnapshot(snapshot);
    this.eventHub.dispatchWorld('world:snapshot:update', snapshot);
  }

  // --- Core Loop ---

  private startLoop() {
    const tick = () => {
      this.update();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private update() {
    const now = Date.now();

    // 1. Update visual interpolation movements
    this.interpolation.update();

    // 2. Poll inputs and trigger move requests
    if (this.myPlayerId !== null) {
      const elapsed = now - this.myPlayerLastMoveTime;
      const cooldown = this.getMyMoveCooldown();

      const canMove = elapsed >= cooldown;
      this.input.update(canMove);

      // Render HUD stats
      document.getElementById('player-speed')!.innerText = `${this.myPlayerSpeed}`;
      document.getElementById('player-cooldown')!.innerText = `${cooldown}ms`;
    }

    // 3. Render frame
    if (this.myPlayerId !== null) {
      this.renderer.render(this.interpolation.getEntities(), this.myPlayerId);
    }

    // Throttled world snapshot update (100ms default)
    if (now - this.lastSidebarUpdate >= this.sidebarThrottleMs) {
      this.lastSidebarUpdate = now;
      this.updateWorldSnapshot(now);
    }
  }
}

// Instantiate client runner on page load
window.addEventListener('load', () => {
  new GameClient();
});
