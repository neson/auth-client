import { getStore } from './store';
import asyncRefreshAccessToken from './asyncRefreshAccessToken';

function getCurrentUnixTime() {
  return parseInt((new Date()).getTime()/1000, 10);
}

export default function asyncGetAccessToken() {
  const store = getStore();

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
        asyncRefreshAccessToken();
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
