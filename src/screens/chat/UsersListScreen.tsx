import React, { useEffect, useState, useMemo } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View, TextInput, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useChatContext } from 'stream-chat-react-native'
import { RootStackParamList } from '../../navigation/AppNavigator'
import Icon from 'react-native-vector-icons/Ionicons'
import { colors, fonts, spacing, borderRadius } from '../../theme'

type UserItem = {
  id: string
  name?: string
  image?: string
  lastMessageTime?: string
}

export default function UsersListScreen() {
  const { client } = useChatContext()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [users, setUsers] = useState<UserItem[]>([])
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    let mounted = true

    const loadUsers = async () => {
      const response = await client.queryUsers(
        { id: { $ne: client.userID } as any },
        { id: 1 },
        { limit: 50 },
      )

      if (mounted) {
        // Generate random last message times for demo
        const now = new Date()
        setUsers(
          response.users.map((user) => {
            const minutesAgo = Math.floor(Math.random() * 1440) // Last 24 hours
            const lastTime = new Date(now.getTime() - minutesAgo * 60000)
            return {
              id: user.id,
              name: user.name,
              image: user.image,
              lastMessageTime: formatTime(lastTime),
            }
          }),
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

  const filteredUsers = useMemo(() => {
    if (!searchText.trim()) {
      return users
    }
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.id.toLowerCase().includes(searchText.toLowerCase()),
    )
  }, [users, searchText])

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

  const getInitials = (name?: string, id?: string) => {
    const displayName = name || id || ''
    return displayName
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getColorForInitials = (id: string) => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
    ]
    const index = id.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PingApp</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Icon name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Create Group Button */}
      <TouchableOpacity
        style={styles.createGroupButton}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <Icon name="person-add-outline" size={18} color={colors.primary} />
        <Text style={styles.createGroupText}>Create Group</Text>
      </TouchableOpacity>

      {/* Users List */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="person-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>
              {searchText ? 'No users found' : 'No users available'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              startChat(item).catch(() => {})
            }}
            style={styles.item}
          >
            {/* Profile Picture / Avatar */}
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: getColorForInitials(item.id) },
                ]}
              >
                <Text style={styles.avatarText}>{getInitials(item.name, item.id)}</Text>
              </View>
            )}

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name || item.id}</Text>
              <Text style={styles.userId}>@{item.id}</Text>
            </View>

            {/* Last Message Time */}
            <Text style={styles.lastMessageTime}>{item.lastMessageTime}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const formatTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    // paddingTop: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: fonts.xxxlarge,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSecondary,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fonts.regular,
    color: colors.textPrimary,
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#E8F5E9',
    borderRadius: borderRadius.lg,
  },
  createGroupText: {
    marginLeft: spacing.md,
    fontSize: fonts.medium,
    fontWeight: '600',
    color: colors.primary,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.lg,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: fonts.large,
    fontWeight: '600',
    color: colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fonts.medium,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userId: {
    fontSize: fonts.small,
    color: colors.textSecondary,
  },
  lastMessageTime: {
    fontSize: fonts.small,
    color: colors.textTertiary,
    marginLeft: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    marginTop: spacing.lg,
    fontSize: fonts.regular,
    color: colors.textSecondary,
  },
})
