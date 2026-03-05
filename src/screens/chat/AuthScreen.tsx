import React, { useMemo, useState } from 'react'
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { ChatSession } from '../../chat/types'

type Props = {
  hasTokenEndpoint: boolean
  allowDevToken: boolean
  onSignIn: (session: ChatSession) => void
}

const trim = (value: string) => value.trim()

export default function AuthScreen({
  hasTokenEndpoint,
  allowDevToken,
  onSignIn,
}: Props) {
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [userImage, setUserImage] = useState('')
  const [userToken, setUserToken] = useState('')

  const canSubmit = useMemo(() => {
    if (!trim(userId) || !trim(userName)) {
      return false
    }

    if (hasTokenEndpoint) {
      return true
    }

    if (allowDevToken) {
      return true
    }

    return trim(userToken).length > 0
  }, [allowDevToken, hasTokenEndpoint, userId, userName, userToken])

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Stream Chat v8</Text>
        <Text style={styles.subtitle}>
          Sign in with your Stream user so channels and messages sync securely.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>User ID</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setUserId}
            placeholder="alice"
            style={styles.input}
            value={userId}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            onChangeText={setUserName}
            placeholder="Alice"
            style={styles.input}
            value={userName}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Avatar URL (optional)</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setUserImage}
            placeholder="https://..."
            style={styles.input}
            value={userImage}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            User Token
            {hasTokenEndpoint || allowDevToken
              ? ' (optional)'
              : ''}
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setUserToken}
            placeholder="paste Stream user token"
            style={styles.input}
            value={userToken}
          />
        </View>

        <Pressable
          disabled={!canSubmit}
          onPress={() => {
            // Debug: log sign-in payload before connecting
            // Do NOT log full token in production
            // eslint-disable-next-line no-console
            console.log('AuthScreen Connect pressed', {
              userId: trim(userId),
              userName: trim(userName),
              hasUserImage: Boolean(trim(userImage)),
              hasUserToken: Boolean(trim(userToken)),
            })

            onSignIn({
              userId: trim(userId),
              userName: trim(userName),
              userImage: trim(userImage) || undefined,
              // When using dev tokens or a backend token endpoint,
              // ignore any manually entered userToken to avoid
              // mismatches between token.user_id and userId.
              userToken:
                hasTokenEndpoint || allowDevToken
                  ? undefined
                  : trim(userToken) || undefined,
            })
          }}
          style={({ pressed }) => [
            styles.signInButton,
            !canSubmit && styles.disabledButton,
            pressed && canSubmit && styles.pressedButton,
          ]}
        >
          <Text style={styles.signInButtonText}>Connect</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  container: {
    gap: 16,
    padding: 20,
  },
  title: {
    color: '#102542',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#425466',
    fontSize: 14,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: '#23364d',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d5dde8',
    borderRadius: 10,
    borderWidth: 1,
    color: '#091a2f',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  signInButton: {
    alignItems: 'center',
    backgroundColor: '#0b5ed7',
    borderRadius: 10,
    paddingVertical: 14,
  },
  pressedButton: {
    opacity: 0.9,
  },
  disabledButton: {
    backgroundColor: '#a5b4c8',
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
})
