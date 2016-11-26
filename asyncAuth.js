import { getStore } from './store';
import { getProviderURL } from './providerURL';

const asyncAuth = async function(username, password) {
  const store = getStore();
  store.dispatch({ type: 'AUTH_REQUEST' });

  try {
    const backendURL = getProviderURL();
    let response = await fetch(`${backendURL}/oauth/tokens`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'password',
        username: username,
        password: password
      })
    });
    let json = await response.json();

    if (json.access_token) {
      const accessToken = json;
      store.dispatch({
        type: 'AUTH_SUCCESS',
        payload: { accessToken }
      });
    } else {
      const authError = json;
      store.dispatch({
        type: 'AUTH_ERROR_RECEIVED',
        payload: { authError }
      });

      throw authError;
    }
  } catch (error) {
    store.dispatch({
      type: 'AUTH_REQUEST_ERROR',
      payload: { error }
    });

    throw error;
  }
};

export default asyncAuth;
