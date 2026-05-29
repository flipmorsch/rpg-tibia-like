import { ChatState } from './state.js';

export const selectChatProps = (state: ChatState) => ({
  messages: state.messages,
  enabled: state.enabled,
  ready: state.ready,
});
