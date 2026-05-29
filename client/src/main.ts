import { Direction, EntityType } from 'shared';
import { NetworkHandler, NetworkCallbacks } from './network.js';
import { GameRenderer } from './renderer.js';
import { InputController } from './input.js';
import { InterpolationEngine } from './interpolation.js';

class GameClient {
  private network: NetworkHandler;
  private renderer: GameRenderer;
  private input: InputController;
  private interpolation: InterpolationEngine;

  private myPlayerId: number | null = null;
  private myPlayerName = '';
  private myPlayerSpeed = 100;
  private myPlayerLastMoveTime = 0;

  constructor() {
    this.interpolation = new InterpolationEngine();
    this.renderer = new GameRenderer('game-viewport');
    
    // Setup input controller with movement callback
    this.input = new InputController((dir: Direction) => {
      this.handleMoveRequest(dir);
    });

    // Configure network callbacks
    const callbacks: NetworkCallbacks = {
      onConnect: () => this.handleConnect(),
      onDisconnect: () => this.handleDisconnect(),
      onLoginSuccess: (id, x, y, z) => this.handleLoginSuccess(id, x, y, z),
      onLoginFailure: (reason) => this.handleLoginFailure(reason),
      onMapDescription: (minX, minY, z, w, h, tiles) => this.handleMapDescription(minX, minY, z, w, h, tiles),
      onEntitySpawn: (id, type, name, x, y, z, speed, hp, maxHp, monsterTypeId) => this.handleEntitySpawn(id, type, name, x, y, z, speed, hp, maxHp, monsterTypeId),
      onEntityDespawn: (id) => this.handleEntityDespawn(id),
      onEntityMove: (id, fx, fy, tx, ty, z, dur) => this.handleEntityMove(id, fx, fy, tx, ty, z, dur),
      onChatMessage: (id, name, type, msg) => this.handleChatMessage(id, name, type, msg),
      onEntityHp: (id, hp, maxHp) => this.handleEntityHp(id, hp, maxHp),
      onCombatEffect: (x, y, z, type, amount) => this.handleCombatEffect(x, y, z, type, amount),
      onPlayerExp: (exp, level) => this.handlePlayerExp(exp, level),
      onHeartbeat: () => {}, // Handled silently
    };

    this.network = new NetworkHandler(callbacks);
    this.bindUI();
    this.startLoop();
  }

  private getMyMoveCooldown(): number {
    return Math.max(100, Math.min(1000, 300 - this.myPlayerSpeed * 0.8));
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

  private bindUI() {
    const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
    const charNameInput = document.getElementById('character-name') as HTMLInputElement;

    loginBtn.addEventListener('click', () => {
      const name = charNameInput.value.trim();
      if (name.length === 0) return;
      this.myPlayerName = name;

      // Connect to the local server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:8080`;
      this.network.connect(wsUrl);
    });

    charNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        loginBtn.click();
      }
    });

    // Chat handling
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const chatSend = document.getElementById('chat-send') as HTMLButtonElement;

    const sendMessage = () => {
      const msg = chatInput.value.trim();
      if (msg.length > 0) {
        this.network.sendChat(1, msg); // Type 1: Speak
        chatInput.value = '';
      }
      chatInput.blur();
    };

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // Press Enter to focus chat input
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.activeElement !== chatInput && this.myPlayerId !== null) {
        e.preventDefault();
        chatInput.focus();
      }
    });

    // Viewport left click for combat targeting
    const canvas = document.getElementById('game-viewport') as HTMLCanvasElement;
    canvas.addEventListener('click', (e) => {
      if (this.myPlayerId === null) return;
      const me = this.interpolation.getEntity(this.myPlayerId);
      if (!me) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const tileSize = 32;
      const camX = me.visualX;
      const camY = me.visualY;
      const camZ = me.gridZ;

      const deltaX = clickX - canvas.width / 2;
      const deltaY = clickY - canvas.height / 2;
      const worldDeltaX = deltaX / tileSize + 0.5;
      const worldDeltaY = deltaY / tileSize + 0.5;
      const targetGridX = Math.floor(camX + worldDeltaX);
      const targetGridY = Math.floor(camY + worldDeltaY);

      // Search for any entity at clicked coordinate on current floor
      let clickedEntityId = 0;
      const entities = this.interpolation.getEntities();
      for (const ent of entities.values()) {
        if (ent.gridZ === camZ && ent.gridX === targetGridX && ent.gridY === targetGridY && ent.id !== this.myPlayerId) {
          clickedEntityId = ent.id;
          break;
        }
      }

      this.network.sendAttack(clickedEntityId);
      this.renderer.setTargetId(clickedEntityId);
    });
  }

  // --- Network Event Handlers ---

  private handleConnect() {
    const dot = document.getElementById('status-dot')!;
    const text = document.getElementById('status-text')!;
    dot.className = 'status-dot online';
    text.innerText = 'Connected';

    // Automatically send login request once socket is open
    this.network.sendLogin(this.myPlayerName);
  }

  private handleDisconnect() {
    this.myPlayerId = null;
    this.interpolation.clear();
    this.input.clear();

    const dot = document.getElementById('status-dot')!;
    const text = document.getElementById('status-text')!;
    dot.className = 'status-dot';
    text.innerText = 'Disconnected';

    // Show login modal again
    document.getElementById('login-modal')!.style.display = 'flex';

    // Disable chat
    (document.getElementById('chat-input') as HTMLInputElement).disabled = true;
    (document.getElementById('chat-send') as HTMLButtonElement).disabled = true;

    this.pushSystemMessage('Disconnected from game server.');
  }

  private handleLoginSuccess(id: number, x: number, y: number, z: number) {
    this.myPlayerId = id;
    
    // Hide login modal
    document.getElementById('login-modal')!.style.display = 'none';

    // Enable chat UI
    (document.getElementById('chat-input') as HTMLInputElement).disabled = false;
    (document.getElementById('chat-send') as HTMLButtonElement).disabled = false;

    // Spawn self in client local list
    this.interpolation.spawnEntity(id, this.myPlayerName, EntityType.PLAYER, x, y, z, this.myPlayerSpeed);

    // Update HUD
    document.getElementById('player-name')!.innerText = this.myPlayerName;

    this.pushSystemMessage(`Character ${this.myPlayerName} successfully logged in.`);
  }

  private handleLoginFailure(reason: string) {
    alert(`Login failed: ${reason}`);
    this.network.disconnect();
  }

  private handleMapDescription(minX: number, minY: number, z: number, w: number, h: number, tiles: Uint8Array) {
    this.renderer.setLocalMap({ minX, minY, z, width: w, height: h, tiles });
  }

  private handleEntitySpawn(id: number, type: number, name: string, x: number, y: number, z: number, speed: number, hp: number, maxHp: number, monsterTypeId: number) {
    this.interpolation.spawnEntity(id, name, type as EntityType, x, y, z, speed, hp, maxHp, monsterTypeId);
    this.updateEntitiesSidebar();
  }

  private handleEntityHp(id: number, hp: number, maxHp: number) {
    this.interpolation.updateEntityHp(id, hp, maxHp);
  }

  private handleCombatEffect(x: number, y: number, z: number, type: number, amount: number) {
    this.renderer.addCombatEffect(x, y, z, type, amount);
  }

  private handlePlayerExp(exp: number, level: number) {
    const expVal = document.getElementById('player-exp');
    if (expVal) expVal.innerText = `${exp}`;
    const lvlVal = document.getElementById('player-level');
    if (lvlVal) lvlVal.innerText = `${level}`;
  }

  private handleEntityDespawn(id: number) {
    this.interpolation.despawnEntity(id);
    this.updateEntitiesSidebar();
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
    const chatLog = document.getElementById('chat-log')!;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg';

    const isSelf = id === this.myPlayerId;
    const nameSpan = document.createElement('span');
    nameSpan.className = isSelf ? 'name self' : 'name';
    nameSpan.innerText = `${name}: `;
    msgDiv.appendChild(nameSpan);

    const textNode = document.createTextNode(message);
    msgDiv.appendChild(textNode);

    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;

    // Bubble message above visual player head
    this.interpolation.setChatBubble(id, message);
  }

  private pushSystemMessage(text: string) {
    const chatLog = document.getElementById('chat-log')!;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg';

    const span = document.createElement('span');
    span.className = 'msg-type-system';
    span.innerText = `System: ${text}`;
    msgDiv.appendChild(span);

    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  private updateEntitiesSidebar() {
    const list = document.getElementById('entities-list')!;
    list.innerHTML = '';

    const entities = this.interpolation.getEntities();
    for (const ent of entities.values()) {
      if (ent.id === this.myPlayerId) continue;

      const row = document.createElement('div');
      row.className = 'entity-row';

      const badge = document.createElement('span');
      badge.className = `entity-type-badge ${ent.isPlayer ? 'badge-player' : 'badge-monster'}`;
      badge.innerText = ent.isPlayer ? 'Player' : 'Monster';

      const name = document.createElement('span');
      name.innerText = ent.name;

      row.appendChild(badge);
      row.appendChild(name);
      list.appendChild(row);
    }
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
  }
}

// Instantiate client runner on page load
window.addEventListener('load', () => {
  new GameClient();
});
