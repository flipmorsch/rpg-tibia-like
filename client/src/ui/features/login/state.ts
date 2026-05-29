export interface LoginState {
  open: boolean;
  name: string;
  error: string | null;
  ready: boolean;
}

export const createLoginState = (): LoginState => ({
  open: true,
  name: 'TibiaKnight',
  error: null,
  ready: true,
});
