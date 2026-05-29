export type ChatMessageKind = 'system' | 'player';

export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  kind: ChatMessageKind;
  isSelf: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  enabled: boolean;
  focused: boolean;
  ready: boolean;
}

export const createChatState = (): ChatState => ({
  messages: [
    {
      id: 'system-welcome',
      name: 'System',
      text: 'Welcome to Tibado. Enter your name and click connect to start playing.',
      kind: 'system',
      isSelf: false,
    },
  ],
  enabled: false,
  focused: false,
  ready: false,
});
