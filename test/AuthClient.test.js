import { assert } from 'chai'

import AuthClient from '../src/AuthClient'

describe('AuthClient', () => {
  it('is not null', () => {
    assert.isNotNull(AuthClient)
  })

  describe('constructor', () => {
    it('works', () => {
      const authClient = new AuthClient({
        oauthEndpointURL: '/token',
        asyncGetAccessToken: async () => {},
        asyncStoreAccessToken: async () => {},
      })
      assert.isNotNull(authClient)
    })
  })
})
