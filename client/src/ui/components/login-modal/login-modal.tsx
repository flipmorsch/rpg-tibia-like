import { Component, Event, EventEmitter, h, Method, Prop } from "@stencil/core";

@Component({
  tag: "login-modal",
  styleUrl: "login-modal.css",
  shadow: true,
})
export class LoginModal {
  @Prop({ reflect: true }) open = true;
  @Prop() name = "";
  @Prop() error: string | null = null;
  @Prop() ready = true;

  @Event({ eventName: "ui:login:submit", bubbles: true, composed: true })
  loginSubmit!: EventEmitter<{ name: string }>;

  @Event({ eventName: "ui:login:name", bubbles: true, composed: true })
  loginName!: EventEmitter<{ name: string }>;

  private inputEl?: HTMLInputElement;

  @Method()
  async focusInput() {
    this.inputEl?.focus();
  }

  private handleInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.loginName.emit({ name: target?.value ?? "" });
  }

  private handleSubmit() {
    const trimmed = this.name.trim();
    if (!trimmed) return;
    this.loginSubmit.emit({ name: trimmed });
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  render() {
    if (!this.open) return null;

    return (
      <div class="modal-overlay">
        <div class="modal">
          <h2>Tibado Online</h2>
          <p>Enter your character name to enter the realm.</p>
          <input
            ref={(el) => (this.inputEl = el as HTMLInputElement)}
            type="text"
            value={this.name}
            placeholder="Character Name"
            maxLength={15}
            disabled={!this.ready}
            onInput={(event) => this.handleInput(event)}
            onKeyDown={(event) => this.handleKeyDown(event as KeyboardEvent)}
          />
          {this.error ? <div class="error">{this.error}</div> : null}
          <button
            class="btn"
            type="button"
            onClick={() => this.handleSubmit()}
            disabled={!this.ready}
          >
            Connect &amp; Play
          </button>
        </div>
      </div>
    );
  }
}
