import { LoginState } from './state.js';

export const selectLoginProps = (state: LoginState) => ({
  open: state.open,
  name: state.name,
  error: state.error,
  ready: state.ready,
});
