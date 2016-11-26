export default class AuthClient {
  constructor({ store = undefined, providerURL = undefined } = {}) {
    if (!store) throw 'You must specify the store to use in the constructor of AuthClient.';
    if (!providerURL) throw 'You must specify the providerURL in the constructor of AuthClient.';

    this.store = store;
    this.providerURL = providerURL;

    this.getStore = this.getStore.bind(this);
    this.setStore = this.setStore.bind(this);
    this.getProviderURL = this.getProviderURL.bind(this);
    this.setProviderURL = this.setProviderURL.bind(this);
    this.asyncAuth = this.asyncAuth.bind(this);
    this.asyncDisAuth = this.asyncDisAuth.bind(this);
    this.asyncGetAccessToken = this.asyncGetAccessToken.bind(this);
    this.asyncRefreshAccessToken = this.asyncRefreshAccessToken.bind(this);
    this.fetch = this.fetch.bind(this);
  }

  getStore() {
    return this.store;
  }

  setStore(store) {
    this.store = store;
  }

  getProviderURL() {
    return this.providerURL;
  }

  setProviderURL(providerURL) {
    this.providerURL = providerURL;
  }

  async asyncAuth(username, password) {
    const store = this.getStore();
    store.dispatch({ type: 'AUTH_REQUEST' });

    try {
      const backendURL = this.getProviderURL();
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
  }

  async asyncDisAuth() {
    const store = this.getStore();
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
  }

  async asyncGetAccessToken() {
    const store = this.getStore();

    /**
     * An original solution is: https://git.io/vrTMb,
     * this is better while less rely on setTimeout.
     */
    return new Promise((resolve, reject) => {
      const currentAuth = store.getState().auth;
      const currentStatus = store.getState().authStatus;

      const waitForRefreshingDoneThenResolve = () => {
        const unsubscribe = store.subscribe(() => {
          const status = store.getState().authStatus;
          if (status.status === 'ready') {
            clearTimeout(waitForRefreshingTimeout);
            resolve(status.accessToken);
          } else if (status.status === 'not-authorized') {
            clearTimeout(waitForRefreshingTimeout);
            resolve();
          }
        });

        const waitForRefreshingTimeout = setTimeout(() => {
          unsubscribe();
          reject('asyncGetAccessToken waitForRefreshingTimeout');
        }, 10000);

        // Check the status again to prevent token refreshing is done before the store.subscribe
        const status = store.getState().authStatus;
        if (status.status === 'ready') {
          unsubscribe();
          clearTimeout(waitForRefreshingTimeout);
          const auth = store.getState().auth;
          resolve(auth.accessToken);
        }
      };

      if (currentStatus.status === 'ready' && currentAuth.accessToken) {
        const currentUnixTime = getCurrentUnixTime();
        const accessTokenExpireTime =
          currentAuth.accessToken.created_at + currentAuth.accessToken.expires_in;

        // If the token is ablout to expire, refresh it
        if (accessTokenExpireTime - currentUnixTime < 60 * 5) {
          this.asyncRefreshAccessToken();
          waitForRefreshingDoneThenResolve();
        } else {
          resolve(currentAuth.accessToken);
        }
      } else if (currentStatus.status === 'token-refreshing') {
        waitForRefreshingDoneThenResolve();
      } else {
        resolve();
      }
    });
  }

  async asyncRefreshAccessToken() {
    const store = this.getStore();

    store.dispatch({ type: 'TOKEN_REFRESH_REQUEST' });

    try {
      const backendURL = this.getProviderURL();
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
  }

  async fetch(uri, options = {}) {
    if (!uri.match(/^http/)) {
      uri = `${this.getProviderURL()}${uri}`;
    }

    const accessToken = await this.asyncGetAccessToken();

    options = {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': accessToken ? `Bearer ${accessToken.access_token}` : null,
        ...(options.headers || {})
      }
    };

    return fetch(uri, options).then((response) => {
      if (response.status === 401) {
        // TODO: Sign out the user?
      }

      return response;
    });
  }
}

function getCurrentUnixTime() {
  return parseInt((new Date()).getTime()/1000, 10);
}
