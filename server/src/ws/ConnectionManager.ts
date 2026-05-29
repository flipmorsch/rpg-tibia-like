import { WebSocket } from 'ws';

export class ConnectionManager {
  private static instance: ConnectionManager | null = null;
  private sockets: Map<number, WebSocket> = new Map();

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  public register(playerId: number, socket: WebSocket): void {
    this.sockets.set(playerId, socket);
  }

  public remove(playerId: number): void {
    this.sockets.delete(playerId);
  }

  public send(playerId: number, packet: Uint8Array): void {
    const socket = this.sockets.get(playerId);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(packet);
    }
  }

  public broadcast(playerIds: Iterable<number>, packet: Uint8Array): void {
    for (const id of playerIds) {
      this.send(id, packet);
    }
  }
}
