export type UiEventMap = {
  'ui:battle-list:attack': { targetId: number };
  'ui:chat:send': { message: string; type: number };
  'ui:chat:focus': { focused: boolean };
  'ui:login:submit': { name: string };
  'ui:login:name': { name: string };
};
