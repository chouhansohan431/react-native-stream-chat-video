import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useChatContext } from 'stream-chat-react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';

type UserItem = {
  id: string;
  name?: string;
};

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export default function CreateGroupScreen() {
  const { client } = useChatContext();
  const navigation = useNavigation<Navigation>();

  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUsers = async () => {
      try {
        const response = await client.queryUsers(
          { id: { $ne: client.userID } } as unknown as Parameters<typeof client.queryUsers>[0],
          { id: 1 },
          { limit: 50 },
        );

        if (mounted) {
          setUsers(
            response.users.map(user => ({
              id: user.id,
              name: user.name,
            })),
          );
        }
      } catch (e) {
        setUsers([]);
      }
    };

    loadUsers();

    return () => {
      mounted = false;
    };
  }, [client]);

  const toggleSelect = (userId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });
  };

  const canCreate = useMemo(() => {
    return (
      groupName.trim().length > 0 &&
      selectedIds.size > 0 &&
      Boolean(client.userID)
    );
  }, [groupName, selectedIds.size, client.userID]);

  const createGroup = async () => {
    if (!client.userID) {
      Alert.alert('Error', 'User not connected');
      return;
    }

    try {
      setIsCreating(true);

      const members = Array.from(
        new Set([client.userID, ...Array.from(selectedIds)]),
      );

      // Use an explicit unique ID so this is always a separate channel from any
      // 1:1 chat with the same members (Stream would otherwise reuse the distinct channel).
      const groupChannelId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const channel = client.channel('messaging', groupChannelId, {
        name: groupName.trim(),
        members,
      } as any);

      await channel.create();
      await channel.watch();

      navigation.replace('Channel', {
        channelId: groupChannelId,
        channelType: 'messaging',
        title: groupName,
      });
    } catch (error: any) {
      Alert.alert('Group Error', error?.message || 'Something went wrong');
    } finally {
      setIsCreating(false);
    }
  };

  const renderUser = ({ item }: { item: UserItem }) => {
    const selected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.userRow, selected && styles.selectedUser]}
        onPress={() => toggleSelect(item.id)}
      >
        <Text style={styles.userName}>{item.name || item.id}</Text>

        <View style={styles.checkBox}>
          {selected && <Text style={styles.check}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Group</Text>

        <TextInput
          placeholder="Enter group name"
          value={groupName}
          onChangeText={setGroupName}
          style={styles.input}
        />

        <Text style={styles.memberTitle}>Select Members</Text>

        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={item => item.id}
        />

        <TouchableOpacity
          style={[styles.button, (!canCreate || isCreating) && styles.disabled]}
          disabled={!canCreate || isCreating}
          onPress={createGroup}
        >
          <Text style={styles.buttonText}>
            {isCreating ? 'Creating...' : 'Create Group'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },

  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 20,
  },

  memberTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },

  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    // borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    marginBottom: 8,
    // backgroundColor: '#fff',
  },

  selectedUser: {
    borderColor: '#0b5ed7',
  },

  userName: {
    fontSize: 15,
  },

  checkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    height: 20,
    width: 20,
    justifyContent: 'center',
  },
  check: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0b5ed7',
  },

  button: {
    marginTop: 15,
    backgroundColor: '#0b5ed7',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  disabled: {
    backgroundColor: '#a5b4c8',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
