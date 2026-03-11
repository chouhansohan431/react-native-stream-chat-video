import AsyncStorage from '@react-native-async-storage/async-storage'
import { ChatSession } from './types'

const SESSION_KEY = '@chat_session'

export async function saveSession(session: ChatSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export async function loadSession(): Promise<ChatSession | null> {
  try {
    const json = await AsyncStorage.getItem(SESSION_KEY)
    return json ? (JSON.parse(json) as ChatSession) : null
  } catch {
    return null
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY)
}
