import { getStore, setStore } from './store';
import { getProviderURL, setProviderURL } from './providerURL';

import asyncAuth from './asyncAuth';
import asyncDisAuth from './asyncDisAuth';
import asyncRefreshAccessToken from './asyncRefreshAccessToken';
import asyncGetAccessToken from './asyncGetAccessToken';
import sessionFetch from './sessionFetch';

import auth from './reducers/auth';
import authStatus from './reducers/authStatus';

const authClient = {
  getStore,
  setStore,
  getProviderURL,
  setProviderURL,
  asyncAuth,
  asyncDisAuth,
  asyncGetAccessToken,
  asyncRefreshAccessToken,
  sessionFetch,
  fetch: sessionFetch,
  auth,
  authStatus
};

export default authClient;

export { getStore as getStore };
export { setStore as setStore };
export { getProviderURL as getProviderURL };
export { setProviderURL as setProviderURL };
export { asyncAuth as asyncAuth };
export { asyncGetAccessToken as asyncGetAccessToken };
export { asyncRefreshAccessToken as asyncRefreshAccessToken };
export { sessionFetch as sessionFetch };
export { sessionFetch as fetch };
export { auth as auth };
export { authStatus as authStatus };
