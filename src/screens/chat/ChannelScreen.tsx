import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
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

export default function ChannelScreen({ navigation, route }: Props) {
  const { client } = useChatContext()
  const [isReady, setIsReady] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [memberId, setMemberId] = useState<string | undefined>(route.params.memberId)
  const { channelType, channelId } = route.params

  const channel = useMemo(
    () => client.channel(channelType, channelId),
    [channelId, channelType, client],
  )

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

    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <View style={styles.callActions}>
          <Pressable
            hitSlop={8}
            onPress={() => {
              startCall(true)
            }}
            style={styles.iconButton}
          >
            <Text style={styles.iconText}>📞</Text>
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() => {
              startCall(false)
            }}
            style={styles.iconButton}
          >
            <Text style={styles.iconText}>🎥</Text>
          </Pressable>
        </View>
      ),
    })
  }, [client.userID, memberId, navigation, route.params.title])

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

  const handlePick = async (
    source: 'gallery' | 'camera',
    mediaType: 'photo' | 'video',
  ) => {
    try {
      if (source === 'gallery') {
        await pickFromGallery(mediaType)
      } else {
        await pickFromCamera(mediaType)
      }
    } catch {
      Alert.alert('Upload failed', 'Could not send this media.')
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
      <View style={styles.container}>
        <MessageList />
        <View style={styles.mediaActions}>
          <Pressable
            onPress={() => {
              handlePick('gallery', 'photo').catch(() => {})
            }}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>Gallery Image</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              handlePick('gallery', 'video').catch(() => {})
            }}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>Gallery Video</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              handlePick('camera', 'photo').catch(() => {})
            }}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>Camera Image</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              handlePick('camera', 'video').catch(() => {})
            }}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>Camera Video</Text>
          </Pressable>
        </View>
        {isUploading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.uploadingText}>Uploading media...</Text>
          </View>
        ) : null}
        <MessageInput />
      </View>
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
    fontSize: 18,
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
})
