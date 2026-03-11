import React from "react"
import { View, Text, StyleSheet } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import useUnreadCount from "../hooks/useUnreadCount"

type ChatTabIconProps = {
  color: string;
  size: number;
};

export default function ChatTabIcon({ color, size }: ChatTabIconProps) {

  const unread = useUnreadCount()
console.log("unread",unread)
  return (
    <View>      
      <Ionicons name="chatbubble-outline" size={size} color={color} />

      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unread > 99 ? "99+" : unread}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -6,
    top: -3,
    backgroundColor: "red",
    borderRadius: 10,
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
  },
})