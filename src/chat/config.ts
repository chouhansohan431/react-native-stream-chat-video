export const CHAT_CONFIG = {
   apiKey: 'YOUR_STREAM_API_KEY_HERE',
  
  tokenEndpoint: '',
  useDevToken: true,
  defaultUserId: '',
  defaultUserName: '',
  defaultUserImage: '',
  defaultUserToken: '',
}

export const isChatConfigured = () => CHAT_CONFIG.apiKey.trim().length > 0
