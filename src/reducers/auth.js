import { handleActions } from 'redux-actions';

export const INITIAL_STATE = {
  accessToken: null
};

export default handleActions({
  AUTH_SUCCESS: (state, action) => {
    const { accessToken } = action.payload;
    return { accessToken };
  },
  TOKEN_REFRESH_SUCCESS: (state, action) => {
    const { accessToken } = action.payload;
    return { accessToken };
  },
  DIS_AUTH: (state, action) => {
    return { accessToken: null };
  },
  AUTH_ERROR_RECEIVED: (state, action) => {
    return { accessToken: null };
  }
}, INITIAL_STATE);
