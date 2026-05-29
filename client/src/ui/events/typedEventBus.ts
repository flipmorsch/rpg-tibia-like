export type EventHandler<Payload> = (payload: Payload) => void;

export class TypedEventBus<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<EventHandler<Events[keyof Events]>>>();

  public on<Name extends keyof Events>(name: Name, handler: EventHandler<Events[Name]>): () => void {
    let handlers = this.listeners.get(name);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(name, handlers);
    }

    handlers.add(handler as EventHandler<Events[keyof Events]>);

    return () => {
      this.off(name, handler);
    };
  }

  public off<Name extends keyof Events>(name: Name, handler: EventHandler<Events[Name]>) {
    const handlers = this.listeners.get(name);
    if (!handlers) return;
    handlers.delete(handler as EventHandler<Events[keyof Events]>);
    if (handlers.size === 0) {
      this.listeners.delete(name);
    }
  }

  public emit<Name extends keyof Events>(name: Name, payload: Events[Name]) {
    const handlers = this.listeners.get(name);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(payload);
    }
  }
}
