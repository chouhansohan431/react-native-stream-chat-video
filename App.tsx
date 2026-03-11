import React from "react"
import ChatBootstrap from "./src/chat/ChatBootstrap"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Chat, OverlayProvider } from "stream-chat-react-native"
import { StreamChat } from "stream-chat"
import { CHAT_CONFIG, isChatConfigured } from "./src/chat/config"

const client = StreamChat.getInstance(CHAT_CONFIG.apiKey)

console.log("Chat configured:", isChatConfigured())

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <OverlayProvider>
        <Chat client={client}>
          <ChatBootstrap />
        </Chat>
      </OverlayProvider>
    </GestureHandlerRootView>
  )
}