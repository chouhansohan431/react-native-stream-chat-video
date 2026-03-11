import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { StreamChat } from 'stream-chat'
import { Chat, OverlayProvider } from 'stream-chat-react-native'
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-native-sdk'
import AppNavigator from '../navigation/AppNavigator'
import AuthScreen from '../screens/chat/AuthScreen'
import SplashScreen from '../screens/chat/SplashScreen'
import { CHAT_CONFIG, isChatConfigured } from './config'
import { createTokenProvider } from './createTokenProvider'
import { ChatSession } from './types'
import { saveSession, loadSession, clearSession } from './sessionStorage'
import { SafeAreaView } from 'react-native-safe-area-context'

const getInitialSession = (): ChatSession | null => {
  const hasDefaultIdentity =
    CHAT_CONFIG.defaultUserId.trim() && CHAT_CONFIG.defaultUserName.trim()
  const hasTokenSource =
    CHAT_CONFIG.defaultUserToken.trim() ||
    CHAT_CONFIG.tokenEndpoint.trim() ||
    CHAT_CONFIG.useDevToken

  if (!hasDefaultIdentity || !hasTokenSource) {
    return null
  }

  return {
    userId: CHAT_CONFIG.defaultUserId,
    userName: CHAT_CONFIG.defaultUserName,
    userImage: CHAT_CONFIG.defaultUserImage || undefined,
    userToken: CHAT_CONFIG.defaultUserToken || undefined,
  }
}

function MissingConfigScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <Text style={styles.title}>Missing Stream API key</Text>
        <Text style={styles.subtitle}>
          Set CHAT_CONFIG.apiKey in src/chat/config.ts.
        </Text>
      </View>
    </SafeAreaView>
  )
}

export default function ChatBootstrap() {
  const [session, setSession] = useState<ChatSession | null>(getInitialSession)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [showSplash, setShowSplash] = useState(true)

  // Load persisted session from AsyncStorage on mount
  useEffect(() => {
    loadSession().then(stored => {
      if (stored) {
        setSession(stored)
      }
      setIsLoadingSession(false)
    })
  }, [])

  // Show splash screen for 3-4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3500) // 3.5 seconds

    return () => clearTimeout(timer)
  }, [])

  const handleSignIn = useCallback((newSession: ChatSession) => {
    setSession(newSession)
    saveSession(newSession)
  }, [])

  const handleLogout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  if (!isChatConfigured()) {
    return <MissingConfigScreen />
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

  if (isLoadingSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    )
  }

  if (!session) {
    return (
      <AuthScreen
        allowDevToken={CHAT_CONFIG.useDevToken}
        hasTokenEndpoint={Boolean(CHAT_CONFIG.tokenEndpoint.trim())}
        onSignIn={handleSignIn}
      />
    )
  }

  return <ConnectedChatApp onLogout={handleLogout} session={session} />
}

type ConnectedChatAppProps = {
  onLogout: () => void
  session: ChatSession
}

function ConnectedChatApp({ onLogout, session }: ConnectedChatAppProps) {
  const [client, setClient] = useState<StreamChat | null>(null)
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null)
  const [isConnecting, setIsConnecting] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let connectedChatClient: StreamChat | null = null
    let connectedVideoClient: StreamVideoClient | null = null

    const connect = async () => {
      try {
        setIsConnecting(true)
        setError(null)

        const chatClient = StreamChat.getInstance(CHAT_CONFIG.apiKey)

        // 🔥 FORCE DEV TOKEN (stable solution)
        const token = CHAT_CONFIG.useDevToken
          ? chatClient.devToken(session.userId)
          : session.userToken

        if (!token) {
          throw new Error(
            'Missing token source. Enable useDevToken or provide userToken.',
          )
        }

        await chatClient.connectUser(
          {
            id: session.userId,
            name: session.userName,
            image: session.userImage,
          },
          token,
        )
        connectedChatClient = chatClient

        const user = {
          id: session.userId,
          name: session.userName,
          image: session.userImage,
        }
        const tokenProvider = CHAT_CONFIG.tokenEndpoint.trim()
          ? createTokenProvider(
            CHAT_CONFIG.tokenEndpoint,
            session.userId,
            session.userName,
          )
          : undefined
        const nextVideoClient = new StreamVideoClient({
          apiKey: CHAT_CONFIG.apiKey,
          user,
          ...(tokenProvider ? { tokenProvider } : { token }),
        })
        connectedVideoClient = nextVideoClient

        if (mounted) {
          setClient(chatClient)
          setVideoClient(nextVideoClient)
        }
      } catch (err: any) {
        if (mounted) {
          console.log('Connect error:', err)
          setError(err.message)
        }
      } finally {
        if (mounted) {
          setIsConnecting(false)
        }
      }
    }

    connect()

    return () => {
      mounted = false
      connectedChatClient?.disconnectUser().catch(() => { })
      connectedVideoClient?.disconnectUser().catch(() => { })
    }
  }, [session.userId, session.userName, session.userImage, session.userToken])

  if (isConnecting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.subtitle}>Connecting to Stream...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !client || !videoClient) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.title}>Connection Error</Text>
          <Text style={styles.subtitle}>{error ?? 'Unknown error'}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <OverlayProvider>
      <StreamVideo client={videoClient}>
        <Chat client={client}>
          <NavigationContainer>
            <AppNavigator onLogout={onLogout} />
          </NavigationContainer>
        </Chat>
      </StreamVideo>
    </OverlayProvider>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    color: '#102542',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#425466',
    lineHeight: 20,
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
    color: '#6a7f95',
  },
})
