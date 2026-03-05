import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ChannelListScreen from '../screens/chat/ChannelListScreen'
import ChannelScreen from '../screens/chat/ChannelScreen'
import UsersListScreen from '../screens/chat/UsersListScreen'
import ProfileScreen from '../screens/chat/ProfileScreen'
import VideoCallScreen from '../screens/chat/VideoCallScreen'

export type RootStackParamList = {
  MainTabs: undefined
  Channel: {
    channelId: string
    channelType: string
    title?: string
    memberId?: string
  }
  VideoCall: {
    callId: string
    callType: string
    title?: string
    audioOnly?: boolean
  }
}

type MainTabParamList = {
  Users: undefined
  Chats: undefined
  Profile: undefined
}

type Props = {
  onLogout: () => void
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

type LogoutButtonProps = {
  onPress: () => void
}

function LogoutButton({ onPress }: LogoutButtonProps) {
  return (
    <Pressable onPress={onPress}>
      <Text style={styles.logoutText}>Log out</Text>
    </Pressable>
  )
}

function MainTabs({ onLogout }: Props) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0b5ed7',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
        },
        // eslint-disable-next-line react/no-unstable-nested-components
        headerRight: () => <LogoutButton onPress={onLogout} />,
      }}
    >
      <Tab.Screen name="Users" component={UsersListScreen} />
      <Tab.Screen name="Chats" component={ChannelListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default function AppNavigator({ onLogout }: Props) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0b5ed7',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        options={{
          headerShown: false,
        }}
      >
        {() => <MainTabs onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen
        name="Channel"
        component={ChannelScreen}
        options={({ route }) => ({
          title: route.params.title ?? 'Chat',
        })}
      />
      <Stack.Screen
        name="VideoCall"
        component={VideoCallScreen}
        options={({ route }) => ({
          title: route.params.audioOnly
            ? route.params.title ?? 'Audio Call'
            : route.params.title ?? 'Video Call',
        })}
      />
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  logoutText: {
    color: '#ffffff',
    fontWeight: '700',
  },
})
