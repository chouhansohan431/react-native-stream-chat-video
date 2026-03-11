import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Alert,
  ScrollView
} from "react-native";
import { useChatContext } from "stream-chat-react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
  onLogout: () => void;
};

export default function ProfileScreen({ onLogout }: Props) {
  const { client } = useChatContext();

  const userName = client.user?.name ?? client.userID ?? "User";
  const userId = client.userID ?? "Unknown";

  const handleLogout = async () => {
    try {
      await client.disconnectUser(); // disconnect stream socket
      onLogout(); // navigate to login
    } catch (error) {
      Alert.alert("Logout Error", "Something went wrong while logging out.");
      console.log("Logout error", error);
    }
  };

  return (
    <ScrollView  contentContainerStyle={styles.container}>
      
      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: "https://i.pravatar.cc/200" }}
          style={styles.avatar}
        />

        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.userId}>@{userId}</Text>
      </View>

      {/* User Info Card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="person-outline" size={22} color="#555" />
          <View style={styles.info}>
            <Text style={styles.label}>Display Name</Text>
            <Text style={styles.value}>{userName}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="finger-print-outline" size={22} color="#555" />
          <View style={styles.info}>
            <Text style={styles.label}>User ID</Text>
            <Text style={styles.value}>{userId}</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f4f7fb",
    padding: 20,
    paddingBottom:60
  },

  avatarContainer: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 12,
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#102542",
  },

  userId: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    elevation: 3,
    marginBottom: 40,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  info: {
    marginLeft: 12,
  },

  label: {
    fontSize: 13,
    color: "#777",
  },

  value: {
    fontSize: 17,
    fontWeight: "600",
    color: "#102542",
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e53935",
    paddingVertical: 14,
    borderRadius: 10,
  },

  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});