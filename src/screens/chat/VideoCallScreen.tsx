import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  CallContent,
  StreamCall,
  type Call,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk'
import { RootStackParamList } from '../../navigation/AppNavigator'

type Props = NativeStackScreenProps<RootStackParamList, 'VideoCall'>

export default function VideoCallScreen({ route }: Props) {
  const videoClient = useStreamVideoClient()
  const [call, setCall] = useState<Call | null>(null)
  const [isJoining, setIsJoining] = useState(true)
  const { audioOnly = false, callId, callType } = route.params

  useEffect(() => {
    let mounted = true
    let activeCall: Call | null = null

    const joinCall = async () => {
      if (!videoClient) {
        throw new Error('Video client is not ready yet.')
      }

      setIsJoining(true)
      const nextCall = videoClient.call(callType, callId)
      activeCall = nextCall
      await nextCall.join({ create: true })

      if (audioOnly) {
        await nextCall.camera.disable().catch(() => {})
      }

      if (mounted) {
        setCall(nextCall)
      }
    }

    joinCall().catch((error: any) => {
      if (mounted) {
        Alert.alert('Could not start call', error?.message ?? 'Unknown error')
      }
    }).finally(() => {
      if (mounted) {
        setIsJoining(false)
      }
    })

    return () => {
      mounted = false
      activeCall?.leave().catch(() => {})
      setCall(null)
    }
  }, [audioOnly, callId, callType, videoClient])

  if (isJoining || !call) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <StreamCall call={call}>
      <CallContent />
    </StreamCall>
  )
}

const styles = StyleSheet.create({
  loaderContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
})
