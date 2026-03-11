import React from 'react'
import { StyleSheet } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import ChannelListScreen from '../screens/chat/ChannelListScreen'
import ChannelScreen from '../screens/chat/ChannelScreen'
import UsersListScreen from '../screens/chat/UsersListScreen'
import ProfileScreen from '../screens/chat/ProfileScreen'
import VideoCallScreen from '../screens/chat/VideoCallScreen'
import CreateGroupScreen from '../screens/chat/CreateGroupScreen'
import Ionicons from 'react-native-vector-icons/Ionicons'
import ChatTabIcon from '../components/ChatTabIcon'
import { colors } from '../theme'
 

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
  CreateGroup: undefined
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

function MainTabs({ onLogout }: Props) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '700',
        },

        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === "Chats") {
            return <ChatTabIcon color={color} size={size} />
          }

          let iconName = ""

          if (route.name === "Users") {
            iconName = focused ? "people" : "people-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="Users"
        component={UsersListScreen}
        options={{ title: 'Users', headerShown: false }}
      />

      <Tab.Screen
        name="Chats"
        component={ChannelListScreen}
        options={{ title: "Chats" }}
      />

      <Tab.Screen
        name="Profile"
        options={{ title: 'Profile' }}
      >
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

export default function AppNavigator({ onLogout }: Props) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        options={{ headerShown: false }}
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
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: 'New group' }}
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



