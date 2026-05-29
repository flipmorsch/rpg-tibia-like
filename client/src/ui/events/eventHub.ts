import { TypedEventBus } from './typedEventBus.js';
import { UiEventMap } from './uiEvents.js';
import { GameplayEventMap } from './gameplayEvents.js';
import { WorldEventMap } from './worldEvents.js';

export type AppEventMap = UiEventMap & GameplayEventMap & WorldEventMap;

export type UiDispatch = <Name extends keyof UiEventMap>(name: Name, payload: UiEventMap[Name]) => void;
export type GameplayDispatch = <Name extends keyof GameplayEventMap>(
  name: Name,
  payload: GameplayEventMap[Name]
) => void;
export type WorldDispatch = <Name extends keyof WorldEventMap>(name: Name, payload: WorldEventMap[Name]) => void;

export const createEventHub = () => {
  const bus = new TypedEventBus<AppEventMap>();

  const dispatchUi: UiDispatch = (name, payload) => {
    bus.emit(name as any, payload as any);
  };

  const dispatchGameplay: GameplayDispatch = (name, payload) => {
    bus.emit(name as any, payload as any);
  };

  const dispatchWorld: WorldDispatch = (name, payload) => {
    bus.emit(name as any, payload as any);
  };

  return {
    bus,
    dispatchUi,
    dispatchGameplay,
    dispatchWorld,
  };
};
