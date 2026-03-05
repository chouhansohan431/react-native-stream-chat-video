# Stream Chat React Native v8 App

This project is a React Native CLI app wired to Stream Chat React Native SDK v8.

## Features

- Stream-authenticated user sign-in
- Channel list with unread/read state and live updates
- Channel screen with message list + composer
- Secure token flow support through a backend token endpoint
- Optional default user bootstrap for local development

## 1. Configure Stream

Edit [src/chat/config.ts](/Users/apple/Desktop/React native/testTask/src/chat/config.ts):

```ts
export const CHAT_CONFIG = {
  apiKey: 'YOUR_STREAM_API_KEY',
  tokenEndpoint: 'https://your-api.example.com',
  defaultUserId: '',
  defaultUserName: '',
  defaultUserImage: '',
  defaultUserToken: '',
}
```

Notes:
- `apiKey` is required.
- Use `tokenEndpoint` for production. The app calls `POST {tokenEndpoint}/chat/token` with `{ userId, userName }` and expects `{ token }`.
- If you do not set `tokenEndpoint`, enter a valid Stream user token on the sign-in screen (or `defaultUserToken`).
- Do not install `stream-chat` separately; this app uses the SDK package directly.

## 2. Install dependencies

```bash
npm install
```

## 3. iOS pods

```bash
cd ios
bundle exec pod install
cd ..
```

## 4. Run

```bash
npm start
npm run ios
# or
npm run android
```

## Production checklist

1. Mint user tokens on your backend (never in the app).
2. Keep Stream key/token values in runtime environment config, not hardcoded.
3. Pin SDK minor versions if UI stability matters.
4. Validate offline behavior, push notifications, and attachment permissions per platform.
