import { getProviderURL } from './providerURL';
import asyncGetAccessToken from './asyncGetAccessToken';

const sessionFetch = async (uri, options = {}) => {
  if (!uri.match(/^http/)) {
    uri = `${getProviderURL()}${uri}`;
  }

  const accessToken = await asyncGetAccessToken();

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
};

export default sessionFetch;
