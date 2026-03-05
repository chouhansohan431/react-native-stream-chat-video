import React from 'react'
import ChatBootstrap from './src/chat/ChatBootstrap'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
export default function App() {
   return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ChatBootstrap />
    </GestureHandlerRootView>
    )
}
