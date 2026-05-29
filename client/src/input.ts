import { Direction } from 'shared';

export class InputController {
  private activeKeys: Set<string> = new Set();
  private isChatFocused = false;
  private onMoveCallback: (direction: Direction) => void;

  constructor(onMove: (direction: Direction) => void) {
    this.onMoveCallback = onMove;
    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (this.isChatFocused) return;

      if (['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        this.activeKeys.add(e.code);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.activeKeys.delete(e.code);
    });

    // Handle chat input focus/blur states to prevent movement keys from typing
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    if (chatInput) {
      chatInput.addEventListener('focus', () => {
        this.isChatFocused = true;
        this.activeKeys.clear();
      });
      chatInput.addEventListener('blur', () => {
        this.isChatFocused = false;
      });
    }
  }

  /**
   * Called on every client game loop frame.
   * Resolves the current active inputs and triggers movement.
   */
  public update(canMove: boolean) {
    if (!canMove || this.isChatFocused) return;
    if (this.activeKeys.size === 0) return;

    // Prioritize the last pressed key, or simply pick one direction
    if (this.activeKeys.has('ArrowUp') || this.activeKeys.has('KeyW')) {
      this.onMoveCallback(Direction.NORTH);
    } else if (this.activeKeys.has('ArrowRight') || this.activeKeys.has('KeyD')) {
      this.onMoveCallback(Direction.EAST);
    } else if (this.activeKeys.has('ArrowDown') || this.activeKeys.has('KeyS')) {
      this.onMoveCallback(Direction.SOUTH);
    } else if (this.activeKeys.has('ArrowLeft') || this.activeKeys.has('KeyA')) {
      this.onMoveCallback(Direction.WEST);
    }
  }

  public clear() {
    this.activeKeys.clear();
  }
}
