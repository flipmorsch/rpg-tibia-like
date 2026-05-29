import { Direction } from 'shared';
import { ClientEntity } from './interpolation.js';

export interface LocalMap {
  minX: number;
  minY: number;
  z: number;
  width: number;
  height: number;
  tiles: Uint8Array;
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private localMap: LocalMap | null = null;
  private tileSize = 32;
  private targetId = 0;
  private effects: { x: number; y: number; z: number; text: string; color: string; spawnTime: number }[] = [];

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false; // Keep retro pixel aesthetic crisp
  }

  public setTargetId(id: number) {
    this.targetId = id;
  }

  public getTargetId(): number {
    return this.targetId;
  }

  public setLocalMap(mapData: LocalMap) {
    this.localMap = mapData;
  }

  public getLocalMap(): LocalMap | null {
    return this.localMap;
  }

  public render(entities: Map<number, ClientEntity>, myPlayerId: number) {
    // 1. Clear screen with a dark void color
    this.ctx.fillStyle = '#030712';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Find self to center the camera
    const me = entities.get(myPlayerId);
    if (!me) {
      // If we are not spawned yet, draw loading screen
      this.drawLoadingScreen();
      return;
    }

    const camX = me.visualX;
    const camY = me.visualY;
    const camZ = me.gridZ;

    // 3. Render Ground Map Layer
    this.renderMap(camX, camY, camZ);

    // 4. Render Entities sorted by Y coordinate for correct overlap sorting
    const sortedEntities = Array.from(entities.values())
      .filter(ent => ent.gridZ === camZ) // Only render entities on same floor
      .sort((a, b) => a.visualY - b.visualY);

    for (const ent of sortedEntities) {
      this.renderEntity(ent, camX, camY);
    }

    // 5. Render Entity Names and Health Bars (drawn after sprites to overlay correctly)
    for (const ent of sortedEntities) {
      this.renderEntityUI(ent, camX, camY);
    }

    // 6. Render Speech Bubbles (drawn at the absolute top layer)
    for (const ent of sortedEntities) {
      this.renderChatBubble(ent, camX, camY);
    }

    // 6.5 Render Floating Combat Damage Text
    this.renderFloatingEffects(camX, camY, camZ);

    // 7. Draw HUD Overlay (current level depth)
    this.drawHUD(camZ, me.gridX, me.gridY);
  }

  private drawLoadingScreen() {
    this.ctx.fillStyle = '#f3f4f6';
    this.ctx.font = 'bold 16px "Space Grotesk", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Logging in and entering world...', this.canvas.width / 2, this.canvas.height / 2);
  }

  private drawHUD(z: number, x: number, y: number) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(10, 10, 140, 52);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.strokeRect(10, 10, 140, 52);

    this.ctx.fillStyle = '#9ca3af';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Floor: ${z === 7 ? 'Surface (Z=7)' : z < 7 ? `Mountain (Z=${z})` : `Dungeon (Z=${z})`}`, 16, 26);
    this.ctx.fillText(`Coords: X:${x} Y:${y}`, 16, 40);
    this.ctx.fillText(`FPS: 60`, 16, 54);
  }

  private renderMap(camX: number, camY: number, camZ: number) {
    if (!this.localMap || this.localMap.z !== camZ) return;

    const startCol = Math.floor(camX - 10);
    const endCol = Math.ceil(camX + 10);
    const startRow = Math.floor(camY - 8);
    const endRow = Math.ceil(camY + 8);

    const map = this.localMap;

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        // Calculate viewport pixel location
        const px = Math.floor((c - camX) * this.tileSize + this.canvas.width / 2 - this.tileSize / 2);
        const py = Math.floor((r - camY) * this.tileSize + this.canvas.height / 2 - this.tileSize / 2);

        // Check if coordinate lies in our streamed local map
        if (c >= map.minX && c < map.minX + map.width && r >= map.minY && r < map.minY + map.height) {
          const tileIndex = (r - map.minY) * map.width + (c - map.minX);
          const tileType = map.tiles[tileIndex];
          this.drawTile(tileType, px, py);
        } else {
          // Render unstreamed area as void/fog
          this.ctx.fillStyle = '#02040a';
          this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
        }
      }
    }
  }

  private drawTile(type: number, x: number, y: number) {
    const size = this.tileSize;
    switch (type) {
      case 1: // Grass
        this.ctx.fillStyle = '#1b431c';
        this.ctx.fillRect(x, y, size, size);
        
        // Draw grass patterns
        this.ctx.fillStyle = '#225223';
        this.ctx.fillRect(x + 4, y + 6, 2, 4);
        this.ctx.fillRect(x + 18, y + 20, 2, 4);
        this.ctx.fillRect(x + 24, y + 10, 2, 4);
        break;

      case 2: // Stone Wall
        // Wall face
        this.ctx.fillStyle = '#374151';
        this.ctx.fillRect(x, y, size, size);

        // Brick borders
        this.ctx.strokeStyle = '#1f2937';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, size, size);
        
        // Horizontal brick divisions
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + size / 2);
        this.ctx.lineTo(x + size, y + size / 2);
        this.ctx.stroke();
        
        // Vertical lines
        this.ctx.beginPath();
        this.ctx.moveTo(x + size / 2, y);
        this.ctx.lineTo(x + size / 2, y + size / 2);
        this.ctx.moveTo(x + size / 4, y + size / 2);
        this.ctx.lineTo(x + size / 4, y + size);
        this.ctx.moveTo(x + (3 * size) / 4, y + size / 2);
        this.ctx.lineTo(x + (3 * size) / 4, y + size);
        this.ctx.stroke();
        break;

      case 3: // Dirt
        this.ctx.fillStyle = '#3f2a1d';
        this.ctx.fillRect(x, y, size, size);
        
        // Dirt spots
        this.ctx.fillStyle = '#2c1d14';
        this.ctx.fillRect(x + 10, y + 12, 3, 3);
        this.ctx.fillRect(x + 22, y + 8, 3, 3);
        this.ctx.fillRect(x + 15, y + 24, 3, 3);
        break;

      case 4: // Stone Floor
        this.ctx.fillStyle = '#4b5563';
        this.ctx.fillRect(x, y, size, size);
        
        // Grid pattern
        this.ctx.strokeStyle = '#374151';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, size, size);
        break;

      case 5: // Stairs Up
        this.ctx.fillStyle = '#d97706';
        this.ctx.fillRect(x, y, size, size);
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 2;
        
        // Step lines
        for (let i = 1; i <= 4; i++) {
          this.ctx.beginPath();
          this.ctx.moveTo(x, y + (i * size) / 5);
          this.ctx.lineTo(x + size, y + (i * size) / 5);
          this.ctx.stroke();
        }
        break;

      case 6: // Stairs Down
        this.ctx.fillStyle = '#1e1b4b';
        this.ctx.fillRect(x, y, size, size);

        // Center drop hole
        this.ctx.fillStyle = '#030712';
        this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        this.ctx.strokeStyle = '#312e81';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + 4, y + 4, size - 8, size - 8);
        break;

      default: // Void
        this.ctx.fillStyle = '#02040a';
        this.ctx.fillRect(x, y, size, size);
    }
  }

  private renderEntity(ent: ClientEntity, camX: number, camY: number) {
    const px = Math.floor((ent.visualX - camX) * this.tileSize + this.canvas.width / 2);
    const py = Math.floor((ent.visualY - camY) * this.tileSize + this.canvas.height / 2);

    this.ctx.save();
    
    // Draw visual targeting outline border
    if (ent.id === this.targetId) {
      this.ctx.strokeStyle = '#ef4444';
      this.ctx.lineWidth = 1.5;
      const pulse = 1.0 + Math.sin(Date.now() / 150) * 0.1;
      const rectSize = this.tileSize * pulse;
      this.ctx.strokeRect(px - rectSize / 2, py - rectSize / 2, rectSize, rectSize);
    }

    // Draw body
    if (ent.isPlayer) {
      // Knight/Wizard body shape (Blue sphere)
      this.ctx.fillStyle = '#4f46e5';
      this.ctx.strokeStyle = '#818cf8';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(px, py, 11, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Wizard Hat / Crown ornament
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.beginPath();
      this.ctx.moveTo(px - 6, py - 8);
      this.ctx.lineTo(px, py - 14);
      this.ctx.lineTo(px + 6, py - 8);
      this.ctx.closePath();
      this.ctx.fill();
    } else {
      // Draw Monster depending on type
      let fillColor = '#dc2626'; // Default red
      let strokeColor = '#f87171';
      let radius = 9;
      let isDragon = false;
      let isOrc = false;
      let hasEars = false;

      switch (ent.monsterTypeId) {
        case 1: // Rat
          fillColor = '#9ca3af'; // Grey
          strokeColor = '#d1d5db';
          radius = 7;
          hasEars = true;
          break;
        case 2: // Cave Rat
          fillColor = '#4b5563'; // Dark grey
          strokeColor = '#9ca3af';
          radius = 8;
          hasEars = true;
          break;
        case 3: // Orc
          fillColor = '#059669'; // Green
          strokeColor = '#34d399';
          radius = 11;
          isOrc = true;
          break;
        case 4: // Dragon
          fillColor = '#ea580c'; // Orange-Red
          strokeColor = '#f97316';
          radius = 16;
          isDragon = true;
          break;
      }

      // Draw custom shapes
      this.ctx.fillStyle = fillColor;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(px, py, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      if (hasEars) {
        // Draw Rat ears
        this.ctx.fillStyle = '#fca5a5';
        this.ctx.beginPath();
        this.ctx.arc(px - radius * 0.6, py - radius * 0.7, radius * 0.35, 0, Math.PI * 2);
        this.ctx.arc(px + radius * 0.6, py - radius * 0.7, radius * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (isOrc) {
        // Draw Orc horns or warband helm/spikes
        this.ctx.fillStyle = '#1e293b';
        this.ctx.beginPath();
        this.ctx.moveTo(px - 6, py - 9);
        this.ctx.lineTo(px - 10, py - 14);
        this.ctx.lineTo(px - 3, py - 9);
        this.ctx.moveTo(px + 6, py - 9);
        this.ctx.lineTo(px + 10, py - 14);
        this.ctx.lineTo(px + 3, py - 9);
        this.ctx.fill();
      } else if (isDragon) {
        // Draw Dragon horns & wings indicator
        this.ctx.fillStyle = '#7c2d12';
        this.ctx.beginPath();
        // Left horn
        this.ctx.moveTo(px - 8, py - 12);
        this.ctx.lineTo(px - 14, py - 20);
        this.ctx.lineTo(px - 3, py - 14);
        // Right horn
        this.ctx.moveTo(px + 8, py - 12);
        this.ctx.lineTo(px + 14, py - 20);
        this.ctx.lineTo(px + 3, py - 14);
        this.ctx.fill();

        // Extra thick black borders for boss dragon
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px - radius, py - radius, radius * 2, radius * 2);
      }
    }

    // Draw Facing Direction Indicator
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    const arrowDist = ent.isPlayer ? 8 : 6;
    if (ent.facingDirection === Direction.NORTH) {
      this.ctx.arc(px, py - arrowDist, 2.5, 0, Math.PI * 2);
    } else if (ent.facingDirection === Direction.EAST) {
      this.ctx.arc(px + arrowDist, py, 2.5, 0, Math.PI * 2);
    } else if (ent.facingDirection === Direction.SOUTH) {
      this.ctx.arc(px, py + arrowDist, 2.5, 0, Math.PI * 2);
    } else if (ent.facingDirection === Direction.WEST) {
      this.ctx.arc(px - arrowDist, py, 2.5, 0, Math.PI * 2);
    }
    this.ctx.fill();

    this.ctx.restore();
  }

  private renderEntityUI(ent: ClientEntity, camX: number, camY: number) {
    const px = Math.floor((ent.visualX - camX) * this.tileSize + this.canvas.width / 2);
    const py = Math.floor((ent.visualY - camY) * this.tileSize + this.canvas.height / 2);

    const nameOffset = 22;

    // Draw Health Bar
    const barWidth = 26;
    const barHeight = 4;
    const bx = px - barWidth / 2;
    const by = py - nameOffset;

    // Bar background
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    this.ctx.fillRect(bx, by, barWidth, barHeight);

    // Bar green/red fill
    const hpPercent = ent.maxHp > 0 ? ent.hp / ent.maxHp : 0;
    this.ctx.fillStyle = ent.isPlayer ? '#10b981' : '#ef4444';
    this.ctx.fillRect(bx, by, barWidth * hpPercent, barHeight);

    // Border line
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 0.5;
    this.ctx.strokeRect(bx, by, barWidth, barHeight);

    // Draw Nameplate text
    this.ctx.fillStyle = ent.isPlayer ? '#a5b4fc' : '#fca5a5';
    this.ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'bottom';
    
    // Add text shadow outline for legibility
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeText(ent.name, px, by - 2);
    this.ctx.fillText(ent.name, px, by - 2);
  }

  private renderChatBubble(ent: ClientEntity, camX: number, camY: number) {
    if (!ent.chatText || Date.now() - ent.chatTime > 4000) return;

    const elapsed = Date.now() - ent.chatTime;
    const px = Math.floor((ent.visualX - camX) * this.tileSize + this.canvas.width / 2);
    const py = Math.floor((ent.visualY - camY) * this.tileSize + this.canvas.height / 2);

    const bubbleY = py - 42;

    this.ctx.save();
    
    // Set opacity based on lifecycle (fade out over last 500ms)
    let opacity = 0.9;
    if (elapsed > 3500) {
      opacity = 0.9 * (1.0 - (elapsed - 3500) / 500);
    }
    
    this.ctx.font = '11px monospace';
    const textWidth = this.ctx.measureText(ent.chatText).width;
    
    const paddingX = 10;
    const paddingY = 6;
    const bubbleW = textWidth + paddingX * 2;
    const bubbleH = 14 + paddingY * 2;
    const bx = px - bubbleW / 2;
    const by = bubbleY - bubbleH;

    // Draw rounded background
    this.ctx.fillStyle = `rgba(15, 23, 42, ${opacity})`;
    this.ctx.strokeStyle = `rgba(99, 102, 241, ${opacity * 0.7})`;
    this.ctx.lineWidth = 1.5;
    
    // Draw bubble shape
    this.ctx.beginPath();
    this.ctx.roundRect(bx, by, bubbleW, bubbleH, 6);
    this.ctx.fill();
    this.ctx.stroke();

    // Draw speech bubble indicator tail
    this.ctx.beginPath();
    this.ctx.moveTo(px - 5, by + bubbleH);
    this.ctx.lineTo(px, by + bubbleH + 5);
    this.ctx.lineTo(px + 5, by + bubbleH);
    this.ctx.fillStyle = `rgba(15, 23, 42, ${opacity})`;
    this.ctx.fill();

    // Draw text inside
    this.ctx.fillStyle = `rgba(254, 243, 199, ${opacity})`; // Warm cream text
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(ent.chatText, px, by + bubbleH / 2 + 1);

    this.ctx.restore();
  }

  public addCombatEffect(x: number, y: number, z: number, type: number, amount: number) {
    this.effects.push({
      x,
      y,
      z,
      text: type === 0 ? `-${amount}` : 'Blocked',
      color: type === 0 ? '#ef4444' : '#9ca3af',
      spawnTime: Date.now(),
    });
  }

  private renderFloatingEffects(camX: number, camY: number, camZ: number) {
    const now = Date.now();
    const duration = 1000; // 1 second duration
    this.effects = this.effects.filter((fx) => now - fx.spawnTime < duration);

    this.ctx.save();
    this.ctx.font = 'bold 13px "Space Grotesk", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    for (const fx of this.effects) {
      if (fx.z !== camZ) continue;

      const elapsed = now - fx.spawnTime;
      const progress = elapsed / duration;

      // Float upwards
      const visualYOffset = -progress * 28;

      const px = Math.floor((fx.x - camX) * this.tileSize + this.canvas.width / 2);
      const py = Math.floor((fx.y - camY) * this.tileSize + this.canvas.height / 2) + visualYOffset;

      // Text outline
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(fx.text, px, py);

      // Text fill
      this.ctx.fillStyle = fx.color;
      this.ctx.fillText(fx.text, px, py);
    }
    this.ctx.restore();
  }
}
