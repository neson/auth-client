import { getStore } from './store';
import { getProviderURL } from './providerURL';

const asyncRefreshAccessToken = async function() {
  const store = getStore();

  store.dispatch({ type: 'TOKEN_REFRESH_REQUEST' });

  try {
    const backendURL = getProviderURL();
    const refreshToken = (store.getState().auth.accessToken || {}).refresh_token;
    let response = await fetch(`${backendURL}/oauth/tokens`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    let json = await response.json();

    if (json.access_token) {
      const accessToken = json;
      store.dispatch({
        type: 'TOKEN_REFRESH_SUCCESS',
        payload: { accessToken }
      });
    } else {
      const oauthError = json;
      store.dispatch({
        type: 'OAUTH_ERROR_RECEIVED',
        payload: { oauthError }
      });
    }
  } catch (error) {
    store.dispatch({
      type: 'OAUTH_REQUEST_ERROR',
      payload: { error }
    });
  }
};

export default asyncRefreshAccessToken;
