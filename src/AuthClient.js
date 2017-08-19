export default class AuthClient {
  constructor({
    oauthEndpointURL,
    asyncGetAccessToken,
    asyncStoreAccessToken,
  } = {}) {
    if (typeof asyncGetAccessToken !== 'function') {
      throw new Error(
        'You must provide a asyncGetAccessToken function ' +
        'that returns a Promise that resolves with the access token object ' +
        '(or null) for the constructor of AuthClient.',
      )
    }

    if (typeof asyncStoreAccessToken !== 'function') {
      throw new Error(
        'You must provide a asyncStoreAccessToken function ' +
        'that stores the access token object to a place ' +
        'for asyncGetAccessToken() to access.',
      )
    }

    this.props = {
      oauthEndpointURL,
      asyncGetAccessToken,
      asyncStoreAccessToken,
    }

    this.refreshing = false
    this.getAccessTokenWhileRefreshingResolveFunctions = []
  }

  async asyncAuth({ username, password }) {
    try {
      const {
        oauthEndpointURL,
        asyncStoreAccessToken,
      } = this.props

      const response = await fetch(`${oauthEndpointURL}/tokens`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'password',
          username,
          password,
        }),
      })

      const json = await response.json()

      if (!json.access_token) {
        const authError = json
        throw authError
      }

      await asyncStoreAccessToken(json)
      return json
    } catch (error) {
      throw error
    }
  }

  async asyncDisAuth({ force = false } = {}) {
    try {
      // TODO: Call the backend to revoke the session
      await this.asyncClearAccessToken()
    } catch (error) {
      if (force) {
        await this.asyncClearAccessToken()
      }
      throw error
    }
  }

  async asyncGetAccessToken() {
    const { asyncGetAccessToken } = this.props

    let accessToken = await asyncGetAccessToken()

    if (this.refreshing) {
      const p = new Promise((resolve) => {
        this.getAccessTokenWhileRefreshingResolveFunctions.push(resolve)
      })
      const t = await p
      return t
    }

    if (!accessToken) {
      return null
    }

    if (typeof accessToken !== 'object') {
      throw new Error(
        'The value given by by asyncGetAccessToken is not an object',
      )
    }

    const accessTokenExpireTime = accessToken.created_at + accessToken.expires_in
    const currentTime = Date.now() / 1000

    if (accessTokenExpireTime - currentTime < 60) {
      accessToken = await this.asyncRefreshAccessToken()
    }

    return accessToken
  }

  async asyncClearAccessToken() {
    await this.props.asyncStoreAccessToken(null)
  }

  async asyncRefreshAccessToken(accessToken) {
    this.refreshing = true

    try {
      const currentAccessToken = accessToken || await this.props.asyncGetAccessToken()

      const {
        oauthEndpointURL,
        asyncStoreAccessToken,
      } = this.props

      const response = await fetch(`${oauthEndpointURL}/tokens`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: currentAccessToken.refresh_token,
        }),
      })
      const json = await response.json()

      if (!json.access_token) {
        const authError = json
        throw authError
      }

      await asyncStoreAccessToken(json)
      this.refreshing = false
      this.getAccessTokenWhileRefreshingResolveFunctions.forEach(f => f(json))
      this.getAccessTokenWhileRefreshingResolveFunctions = []
      return json
    } catch (error) {
      this.refreshing = false
      throw error
    }
  }

  async fetch(uri, options = {}) {
    const accessToken = await this.asyncGetAccessToken()

    const fetchOptions = {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': accessToken ? `Bearer ${accessToken.access_token}` : null,
        ...(options.headers || {}),
      },
    }

    const response = await fetch(uri, fetchOptions)

    if (response.status === 401) {
      // Session revoked, clear access token
      if (accessToken) this.asyncClearAccessToken()
    }

    return response
  }
}
