import { ChatMessage, ChatState, createChatState } from './state.js';

export type ChatListener = (state: ChatState) => void;

export class ChatController {
  private state: ChatState = createChatState();
  private listeners = new Set<ChatListener>();

  public appendMessage(message: ChatMessage) {
    this.setState({
      ...this.state,
      messages: [...this.state.messages, message],
    });
  }

  public appendSystemMessage(text: string) {
    this.appendMessage({
      id: `system-${Date.now()}`,
      name: 'System',
      text,
      kind: 'system',
      isSelf: false,
    });
  }

  public appendPlayerMessage(name: string, text: string, isSelf: boolean) {
    this.appendMessage({
      id: `${name}-${Date.now()}`,
      name,
      text,
      kind: 'player',
      isSelf,
    });
  }

  public setEnabled(enabled: boolean) {
    this.setState({
      ...this.state,
      enabled,
      ready: true,
    });
  }

  public setFocused(focused: boolean) {
    this.setState({
      ...this.state,
      focused,
    });
  }

  public getState(): ChatState {
    return this.state;
  }

  public subscribe(listener: ChatListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(nextState: ChatState) {
    this.state = nextState;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
