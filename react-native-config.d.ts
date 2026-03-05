declare module 'react-native-config' {
  export interface NativeConfig {
    STREAM_API_KEY?: string
    STREAM_TOKEN_ENDPOINT?: string
    STREAM_USE_DEV_TOKEN?: string
    STREAM_DEFAULT_USER_ID?: string
    STREAM_DEFAULT_USER_NAME?: string
    STREAM_DEFAULT_USER_IMAGE?: string
    STREAM_DEFAULT_USER_TOKEN?: string
    FIREBASE_API_KEY?: string
    FIREBASE_AUTH_DOMAIN?: string
    FIREBASE_PROJECT_ID?: string
    FIREBASE_STORAGE_BUCKET?: string
    FIREBASE_MESSAGING_SENDER_ID?: string
    FIREBASE_APP_ID?: string
    FIREBASE_MEASUREMENT_ID?: string
  }

  const Config: NativeConfig
  export default Config
}
