import { WorldSnapshot, createEmptyWorldSnapshot } from './worldSnapshot.js';

export type WorldSnapshotListener = (snapshot: WorldSnapshot) => void;

export class WorldSnapshotStore {
  private snapshot: WorldSnapshot;
  private listeners = new Set<WorldSnapshotListener>();

  constructor(initialSnapshot: WorldSnapshot = createEmptyWorldSnapshot()) {
    this.snapshot = initialSnapshot;
  }

  public setSnapshot(snapshot: WorldSnapshot) {
    this.snapshot = snapshot;
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  public getSnapshot(): WorldSnapshot {
    return this.snapshot;
  }

  public subscribe(listener: WorldSnapshotListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
