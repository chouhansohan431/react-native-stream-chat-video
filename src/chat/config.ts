export const CHAT_CONFIG = {
  apiKey: 'zbnfu8kchyby',
  tokenEndpoint: '',
  useDevToken: true,
  defaultUserId: '',
  defaultUserName: '',
  defaultUserImage: '',
  defaultUserToken: '',
}

export const isChatConfigured = () => CHAT_CONFIG.apiKey.trim().length > 0
