import { handleActions } from 'redux-actions';

export const INITIAL_STATE = {
  status: 'ready',
  error: null,
  authError: null
};

export default handleActions({
  AUTH_REQUEST: (state) => {
    return {
      ...state,
      status: 'authenticating',
      error: null,
      authError: null
    };
  },
  AUTH_SUCCESS: (state, action) => {
    return {
      ...state,
      status: 'ready'
    };
  },
  TOKEN_REFRESH_REQUEST: (state) => {
    return {
      ...state,
      status: 'token-refreshing',
      error: null,
      authError: null
    };
  },
  TOKEN_REFRESH_SUCCESS: (state, action) => {
    const { accessToken } = action.payload;

    return {
      ...state,
      status: 'ready'
    };
  },
  AUTH_REQUEST_ERROR: (state, action) => {
    const { error } = action.payload;

    return {
      ...state,
      status: 'ready',
      error
    };
  },
  AUTH_ERROR_RECEIVED: (state, action) => {
    const { authError } = action.payload;

    return {
      ...state,
      status: 'ready',
      authError
    };
  }
}, INITIAL_STATE);
