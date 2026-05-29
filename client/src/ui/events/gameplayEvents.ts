export type GameplayEventMap = {
  'gameplay:combat:attack': { targetId: number };
  'gameplay:chat:send': { message: string; type: number };
  'gameplay:login:request': { name: string };
};
