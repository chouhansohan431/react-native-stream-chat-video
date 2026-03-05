import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { ChannelList, useChatContext } from 'stream-chat-react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/AppNavigator'

export default function ChannelListScreen() {
  const { client } = useChatContext()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const filters = useMemo(
    () => ({
      type: 'messaging',
      members: { $in: [client.userID ?? ''] },
    }),
    [client.userID],
  )

  return (
    <View style={styles.container}>
      <ChannelList
        filters={filters}
        options={{
          limit: 20,
          presence: true,
          state: true,
          watch: true,
        }}
        onSelect={(channel) => {
          if (!channel.id) {
            return
          }

          const members = Object.values(channel.state.members || {})
          const directMember = members.find((member) => member.user_id !== client.userID)

          navigation.navigate('Channel', {
            channelId: channel.id,
            channelType: channel.type,
            title: (channel.data as { name?: string } | undefined)?.name,
            memberId: directMember?.user_id,
          })
        }}
        sort={{ last_message_at: -1 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
