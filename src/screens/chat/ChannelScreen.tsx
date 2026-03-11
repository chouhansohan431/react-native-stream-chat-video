import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView
} from 'react-native'
import {
  Channel,
  MessageInput,
  MessageList,
  useChatContext,
} from 'stream-chat-react-native'
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
  type CameraOptions,
  type ImageLibraryOptions,
} from 'react-native-image-picker'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/AppNavigator'

import Icon from 'react-native-vector-icons/Ionicons'
type Props = NativeStackScreenProps<RootStackParamList, 'Channel'>

const getDirectMemberId = (
  currentUserId: string | undefined,
  members: Record<string, { user_id?: string }>,
) => {
  const member = Object.values(members).find(
    (channelMember) => channelMember.user_id && channelMember.user_id !== currentUserId,
  )

  return member?.user_id
}

const getDirectCallId = (firstUserId: string, secondUserId: string) =>
  [firstUserId, secondUserId].sort().join('-')

type UserItem = { id: string; name?: string }

export default function ChannelScreen({ navigation, route }: Props) {
  const { client } = useChatContext()
  const [isReady, setIsReady] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [memberId, setMemberId] = useState<string | undefined>(route.params.memberId)
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false)
  const [addMemberUsers, setAddMemberUsers] = useState<UserItem[]>([])
  const [addMemberSelectedIds, setAddMemberSelectedIds] = useState<Set<string>>(new Set())
  const [isAddingMembers, setIsAddingMembers] = useState(false)
  const { channelType, channelId } = route.params

  const channel = useMemo(
    () => client.channel(channelType, channelId),
    [channelId, channelType, client],
  )

  const isGroup = useMemo(() => {
    const members = channel.state.members ?? {}
    const count = Object.keys(members).length
    const data = channel.data as { name?: string } | undefined
    const hasName = !!(data?.name)
    return hasName || count > 2
  }, [channel.state.members, channel.data])

  useEffect(() => {
    let mounted = true

    const setup = async () => {
      await channel.watch()
      const directMemberId =
        route.params.memberId ||
        getDirectMemberId(
          client.userID ?? undefined,
          channel.state.members as Record<string, { user_id?: string }>,
        )

      if (mounted) {
        setMemberId(directMemberId)
        setIsReady(true)
      }
    }

    setup().catch(() => {
      if (mounted) {
        setIsReady(true)
      }
    })

    return () => {
      mounted = false
      setIsReady(false)
      channel.stopWatching().catch(() => {})
    }
  }, [channel, client.userID, route.params.memberId])

  useEffect(() => {
    const startCall = (audioOnly: boolean) => {
      if (!client.userID || !memberId) {
        Alert.alert('Call unavailable', 'Could not identify the user for this call.')
        return
      }

      navigation.navigate('VideoCall', {
        audioOnly,
        callId: getDirectCallId(client.userID, memberId),
        callType: 'default',
        title: route.params.title ?? memberId,
      })
    }

    const currentMemberIds = new Set(
      Object.values(channel.state.members ?? {}).map((m: { user_id?: string }) => m.user_id).filter(Boolean) as string[],
    )

    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <View style={styles.callActions}>
          {isGroup ? (
            <Pressable
              hitSlop={8}
              onPress={() => {
                setAddMemberSelectedIds(new Set())
                setAddMemberModalVisible(true)
              }}
              style={styles.iconButton}
            >
              <Icon style={styles.iconText} name="person-add-outline" size={26} color="#ffffff" />
            </Pressable>
          ) : null}
          <Pressable
            hitSlop={8}
            onPress={() => {
              startCall(false)
            }}
            style={styles.iconButton}
          >
             <Icon style={styles.iconText} name="videocam-outline" size={30} color="#ffffff" />
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() => {
              startCall(true)
            }}
            style={styles.iconButton}
          >
             <Icon style={styles.iconText} name="call-outline" size={30} color="#ffffff" />
           
          </Pressable>
        </View>
      ),
    })
  }, [client.userID, memberId, navigation, route.params.title, isGroup, channel.state.members])

  useEffect(() => {
    if (!addMemberModalVisible || !channel?.state?.members) return

    let mounted = true
    const existingMemberIds = new Set(
      Object.values(channel.state.members).map((m: { user_id?: string }) => m.user_id).filter(Boolean) as string[],
    )

    const loadUsers = async () => {
      try {
        const response = await client.queryUsers(
          { id: { $ne: client.userID } } as unknown as Parameters<typeof client.queryUsers>[0],
          { id: 1, name: 1 },
          { limit: 50 },
        )
        if (mounted) {
          const list = response.users
            .filter((u) => !existingMemberIds.has(u.id))
            .map((u) => ({ id: u.id, name: u.name }))
          setAddMemberUsers(list)
        }
      } catch {
        if (mounted) setAddMemberUsers([])
      }
    }
    loadUsers()
    return () => { mounted = false }
  }, [addMemberModalVisible, client, channel?.state?.members])

  const ensureAndroidGalleryPermissions = async () => {
    if (Platform.OS !== 'android') {
      return true
    }

    if (Platform.Version >= 33) {
      const statuses = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
      ])

      return (
        statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
          PermissionsAndroid.RESULTS.GRANTED
      )
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    )

    return status === PermissionsAndroid.RESULTS.GRANTED
  }

  const ensureAndroidCameraPermissions = async () => {
    if (Platform.OS !== 'android') {
      return true
    }

    const statuses = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      ...(Platform.Version >= 33
        ? [PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO]
        : [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE]),
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ])

    return Object.values(statuses).every(
      (value) => value === PermissionsAndroid.RESULTS.GRANTED,
    )
  }

  const sendPickedAsset = async (asset: Asset) => {
    if (!asset.uri) {
      throw new Error('Selected media does not have a valid URI.')
    }

    const name = asset.fileName || `upload-${Date.now()}`
    const mimeType = asset.type || undefined
    const isImage = mimeType?.startsWith('image/')

    if (isImage) {
      const uploaded = await channel.sendImage(asset.uri, name, mimeType)

      await channel.sendMessage({
        attachments: [
          {
            type: 'image',
            image_url: uploaded.file,
            fallback: name,
          },
        ],
      })

      return
    }

    const uploaded = await channel.sendFile(asset.uri, name, mimeType)

    await channel.sendMessage({
      attachments: [
        {
          type: 'video',
          asset_url: uploaded.file,
          mime_type: mimeType,
          thumb_url: uploaded.thumb_url,
          title: name,
        },
      ],
    })
  }

  const pickFromGallery = async (mediaType: 'photo' | 'video') => {
    const hasPermission = await ensureAndroidGalleryPermissions()

    if (!hasPermission) {
      Alert.alert('Permission denied', 'Gallery permission is required.')
      return
    }

    const options: ImageLibraryOptions = {
      mediaType,
      selectionLimit: 1,
    }
    const result = await launchImageLibrary(options)

    if (result.didCancel || !result.assets?.length) {
      return
    }

    setIsUploading(true)
    try {
      await sendPickedAsset(result.assets[0])
    } finally {
      setIsUploading(false)
    }
  }

  const pickFromCamera = async (mediaType: 'photo' | 'video') => {
    const hasPermission = await ensureAndroidCameraPermissions()

    if (!hasPermission) {
      Alert.alert('Permission denied', 'Camera permission is required.')
      return
    }

    const options: CameraOptions = {
      mediaType,
      ...(mediaType === 'video' ? { videoQuality: 'medium' } : {}),
    }
    const result = await launchCamera(options)

    if (result.didCancel || !result.assets?.length) {
      return
    }

    setIsUploading(true)
    try {
      await sendPickedAsset(result.assets[0])
    } finally {
      setIsUploading(false)
    }
  }



  const toggleAddMemberSelection = (userId: string) => {
    setAddMemberSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const addSelectedMembers = async () => {
    if (addMemberSelectedIds.size === 0) return
    try {
      setIsAddingMembers(true)
      await channel.addMembers(Array.from(addMemberSelectedIds))
      setAddMemberModalVisible(false)
      setAddMemberSelectedIds(new Set())
    } catch (err: any) {
      Alert.alert('Add members', err?.message ?? 'Failed to add members')
    } finally {
      setIsAddingMembers(false)
    }
  }

  if (!isReady) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <Channel channel={channel}>
      <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <View style={styles.container}>
        <MessageList />
        
        {isUploading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.uploadingText}>Uploading media...</Text>
          </View>
        ) : null}
        <MessageInput />
      </View>
      </KeyboardAvoidingView>

      <Modal
        visible={addMemberModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddMemberModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add members</Text>
              <Pressable hitSlop={12} onPress={() => setAddMemberModalVisible(false)}>
                <Icon name="close" size={28} color="#102542" />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>Select users to add to the group</Text>
            <FlatList
              data={addMemberUsers}
              keyExtractor={(item) => item.id}
              style={styles.addMemberList}
              renderItem={({ item }) => {
                const selected = addMemberSelectedIds.has(item.id)
                return (
                  <TouchableOpacity
                    style={[styles.addMemberRow, selected && styles.addMemberRowSelected]}
                    onPress={() => toggleAddMemberSelection(item.id)}
                  >
                    <Text style={styles.addMemberName}>{item.name || item.id}</Text>
                    <View style={styles.addMemberCheck}>
                      {selected ? <Text style={styles.addMemberCheckText}>✓</Text> : null}
                    </View>
                  </TouchableOpacity>
                )
              }}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.addMemberButton, (addMemberSelectedIds.size === 0 || isAddingMembers) && styles.addMemberButtonDisabled]}
                disabled={addMemberSelectedIds.size === 0 || isAddingMembers}
                onPress={addSelectedMembers}
              >
                {isAddingMembers ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.addMemberButtonText}>Add to group</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Channel>
  )
}

const styles = StyleSheet.create({
  actionButton: {
    backgroundColor: '#0b5ed7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  callActions: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 14,
  },
  iconText: {
    color: '#ffffff',
  },
  loaderContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  mediaActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  uploadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  uploadingText: {
    color: '#425466',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#102542',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  addMemberList: {
    maxHeight: 320,
    paddingHorizontal: 20,
  },
  addMemberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addMemberRowSelected: {
    borderColor: '#0b5ed7',
    backgroundColor: '#e7f1ff',
  },
  addMemberName: {
    fontSize: 16,
    color: '#102542',
    fontWeight: '500',
  },
  addMemberCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#0b5ed7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberCheckText: {
    color: '#0b5ed7',
    fontSize: 14,
    fontWeight: '700',
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  addMemberButton: {
    backgroundColor: '#0b5ed7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addMemberButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  addMemberButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
