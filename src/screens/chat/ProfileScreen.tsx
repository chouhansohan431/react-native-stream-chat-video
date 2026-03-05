import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useChatContext } from 'stream-chat-react-native'

export default function ProfileScreen() {
  const { client } = useChatContext()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.label}>User ID</Text>
      <Text style={styles.value}>{client.userID ?? 'Unknown user'}</Text>
      <Text style={styles.label}>Display Name</Text>
      <Text style={styles.value}>
        {client.user?.name ?? client.userID ?? 'Not set'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f7fb',
  },
  title: {
    color: '#102542',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 24,
  },
  label: {
    color: '#425466',
    fontSize: 14,
    marginBottom: 6,
  },
  value: {
    color: '#102542',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
})
