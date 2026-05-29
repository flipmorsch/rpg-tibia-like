import {
  Component,
  Event,
  EventEmitter,
  h,
  Method,
  Prop,
  State,
  Fragment,
} from "@stencil/core";
import type { ChatMessage } from "../../features/chat/state.js";

@Component({
  tag: "chat-panel",
  styleUrl: "chat-panel.css",
  shadow: true,
})
export class ChatPanel {
  @Prop() messages: ChatMessage[] = [];
  @Prop() enabled = false;
  @Prop() ready = false;

  @State() draft = "";

  @Event({ eventName: "ui:chat:send", bubbles: true, composed: true })
  chatSend!: EventEmitter<{ message: string; type: number }>;

  @Event({ eventName: "ui:chat:focus", bubbles: true, composed: true })
  chatFocus!: EventEmitter<{ focused: boolean }>;

  private inputEl?: HTMLInputElement;
  private logEl?: HTMLDivElement;

  @Method()
  async focusInput() {
    this.inputEl?.focus();
  }

  private handleSend() {
    const message = this.draft.trim();
    if (!message) return;
    this.chatSend.emit({ message, type: 1 });
    this.draft = "";
    this.inputEl?.blur();
    this.chatFocus.emit({ focused: false });
  }

  private handleInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.draft = target?.value ?? "";
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.handleSend();
    }
  }

  private handleFocusChange(focused: boolean) {
    this.chatFocus.emit({ focused });
  }

  componentDidRender() {
    if (!this.logEl) return;
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  render() {
    const interactive = this.ready && this.enabled;

    return (
      <div class="chat-panel">
        <div class="chat-log" ref={(el) => (this.logEl = el as HTMLDivElement)}>
          {this.ready ? (
            this.messages.map((message) => (
              <div class="chat-msg" key={message.id}>
                {message.kind === "system" ? (
                  <span class="msg-type-system">System: {message.text}</span>
                ) : (
                  <>
                    <span class={`name ${message.isSelf ? "self" : ""}`}>
                      {message.name}:{" "}
                    </span>
                    <span>{message.text}</span>
                  </>
                )}
              </div>
            ))
          ) : (
            <div class="placeholder">Connecting to chat...</div>
          )}
        </div>
        <div class="chat-input-container">
          <input
            ref={(el) => (this.inputEl = el as HTMLInputElement)}
            type="text"
            class="chat-input"
            placeholder={
              interactive
                ? "Type a message and press Enter..."
                : "Chat unavailable"
            }
            disabled={!interactive}
            value={this.draft}
            onInput={(event) => this.handleInput(event)}
            onKeyDown={(event) => this.handleKeyDown(event as KeyboardEvent)}
            onFocus={() => this.handleFocusChange(true)}
            onBlur={() => this.handleFocusChange(false)}
          />
          <button
            class="btn"
            type="button"
            disabled={!interactive}
            onClick={() => this.handleSend()}
          >
            Send
          </button>
        </div>
      </div>
    );
  }
}
