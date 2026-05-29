import { LoginState, createLoginState } from './state.js';

export type LoginListener = (state: LoginState) => void;

export class LoginController {
  private state: LoginState = createLoginState();
  private listeners = new Set<LoginListener>();

  public setName(name: string) {
    this.setState({
      ...this.state,
      name,
      error: null,
    });
  }

  public setError(error: string) {
    this.setState({
      ...this.state,
      error,
    });
  }

  public show() {
    this.setState({
      ...this.state,
      open: true,
    });
  }

  public hide() {
    this.setState({
      ...this.state,
      open: false,
      error: null,
    });
  }

  public getState(): LoginState {
    return this.state;
  }

  public subscribe(listener: LoginListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(nextState: LoginState) {
    this.state = nextState;
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
