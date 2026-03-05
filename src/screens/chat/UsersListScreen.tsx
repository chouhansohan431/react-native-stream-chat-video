import React, { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useChatContext } from 'stream-chat-react-native'
import { RootStackParamList } from '../../navigation/AppNavigator'

type UserItem = {
  id: string
  name?: string
}

export default function UsersListScreen() {
  const { client } = useChatContext()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [users, setUsers] = useState<UserItem[]>([])

  useEffect(() => {
    let mounted = true

    const loadUsers = async () => {
      const response = await client.queryUsers(
        { id: { $ne: client.userID } },
        { id: 1 },
        { limit: 20 },
      )

      if (mounted) {
        setUsers(
          response.users.map((user) => ({
            id: user.id,
            name: user.name,
          })),
        )
      }
    }

    loadUsers().catch(() => {
      if (mounted) {
        setUsers([])
      }
    })

    return () => {
      mounted = false
    }
  }, [client])

  const startChat = async (selectedUser: UserItem) => {
    if (!client.userID) {
      return
    }

    const channel = client.channel('messaging', {
      members: [client.userID, selectedUser.id],
    })

    await channel.watch()

    if (!channel.id) {
      return
    }

    navigation.navigate('Channel', {
      channelId: channel.id,
      channelType: 'messaging',
      title: selectedUser.name ?? selectedUser.id,
      memberId: selectedUser.id,
    })
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            startChat(item).catch(() => {})
          }}
          style={styles.item}
        >
          <Text style={styles.name}>{item.name || item.id}</Text>
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
  item: {
    borderBottomWidth: 1,
    borderColor: '#d5dde8',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  name: {
    color: '#102542',
    fontSize: 16,
    fontWeight: '500',
  },
})
