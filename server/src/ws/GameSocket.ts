import { WebSocket } from 'ws';
import { Player } from '../player/Player.js';

export interface GameSocket extends WebSocket {
  player?: Player;
  isAlive?: boolean;
}
