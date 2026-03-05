const normalizeUrl = (url: string) => url.trim().replace(/\/+$/, '')

export const createTokenProvider = (
  tokenEndpoint: string,
  userId: string,
  userName: string,
) => {
  const endpoint = normalizeUrl(tokenEndpoint)

  return async () => {
    const response = await fetch(`${endpoint}/chat/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch chat token (${response.status})`)
    }

    const payload = (await response.json()) as { token?: string }

    if (!payload.token) {
      throw new Error('Token endpoint did not return a token')
    }

    return payload.token
  }
}
