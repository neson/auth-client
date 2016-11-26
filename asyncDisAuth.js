import { getStore } from './store';
import { getProviderURL } from './providerURL';

const asyncDisAuth = async function () {
  const store = getStore();
  store.dispatch({ type: 'DIS_AUTH_REQUEST' });

  try {
    // TODO: notify the backend to dis-auth (revoke the current session)
    store.dispatch({ type: 'DIS_AUTH' });

  } catch (error) {
    store.dispatch({
      type: 'DIS_AUTH_REQUEST_ERROR',
      payload: { error }
    });

    throw error;
  }
};

export default asyncDisAuth;
