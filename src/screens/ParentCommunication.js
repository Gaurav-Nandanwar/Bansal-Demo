import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';
import React, { useState } from 'react';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const dummyChats = [
  { id: '1', name: 'Samad Sheikh', lastMessage: 'Please send homework', status: 'pending' },
  { id: '2', name: 'Priya Sharma', lastMessage: 'Thank you!', status: 'solved' },
  { id: '3', name: 'Amit Patel', lastMessage: 'Absent today', status: 'pending' },
  { id: '4', name: 'Neha Singh', lastMessage: 'Can I meet tomorrow?', status: 'solved' },
];

const ParentCommunication = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const navigation = useNavigation();

  const filteredChats = dummyChats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(search.toLowerCase()) || chat.lastMessage.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ? true : chat.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      <Header />
      {/* Search and Filter */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Text style={styles.filterText}>{filter.charAt(0).toUpperCase() + filter.slice(1)}</Text>
          <Ionicons name="chevron-down" size={18} color="#5F83C7" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalContent}>
            {['all', 'pending', 'solved'].map(opt => (
              <TouchableOpacity key={opt} style={styles.modalOption} onPress={() => { setFilter(opt); setShowFilterModal(false); }}>
                <Text style={styles.modalOptionText}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Chat Title */}
      <Text style={styles.chatTitle}>Chat</Text>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatItem} onPress={() => navigation.navigate('ParentChatDetail', { chat: item })}>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{item.name}</Text>
              <Text style={styles.chatMessage}>{item.lastMessage}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'pending' ? '#FF9800' : '#4CAF50' }]} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No chats found</Text>}
        contentContainerStyle={styles.chatList}
      />
    </View>
  );
};

// Dummy ParentChatDetail screen for navigation
export const ParentChatDetail = ({ route }) => {
  const { chat } = route.params;
  const [messages, setMessages] = useState([
    { id: '1', text: chat.lastMessage, sender: 'parent' },
    { id: '2', text: 'Reply to parent', sender: 'staff' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { id: Date.now().toString(), text: input, sender: 'staff' }]);
      setInput('');
    }
  };

  return (
    <View style={styles.chatDetailContainer}>
      <Header />
      <Text style={styles.chatDetailTitle}>{chat.name}</Text>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.sender === 'staff' ? styles.staffBubble : styles.parentBubble]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.chatInput}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="attach" size={24} color="#5F83C7" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    gap: 7,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 7,
    paddingHorizontal: 7,
    elevation: 1.8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 7,
    fontSize: 12.6,
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 7,
    paddingHorizontal: 10.8,
    paddingVertical: 7.2,
    elevation: 1.8,
  },
  filterText: {
    color: '#5F83C7',
    fontWeight: '600',
    marginRight: 3.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 9,
    padding: 14.4,
    minWidth: 162,
    alignItems: 'center',
  },
  modalOption: {
    paddingVertical: 9,
    width: '100%',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 14.4,
    color: '#5F83C7',
  },
  chatTitle: {
    fontSize: 16.2,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 14.4,
    marginTop: 7.2,
    marginBottom: 3.6,
  },
  chatList: {
    padding: 7.2,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 7,
    padding: 10.8,
    marginBottom: 7.2,
    elevation: 1.8,
    justifyContent: 'space-between',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: '#5F83C7',
  },
  chatMessage: {
    fontSize: 11.7,
    color: '#666',
    marginTop: 1.8,
  },
  statusDot: {
    width: 10.8,
    height: 10.8,
    borderRadius: 5.4,
    marginLeft: 7.2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 28.8,
    fontSize: 13.5,
  },
  chatDetailContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  chatDetailTitle: {
    fontSize: 16.2,
    fontWeight: 'bold',
    color: '#5F83C7',
    margin: 14.4,
  },
  messageList: {
    padding: 7.2,
    flexGrow: 1,
  },
  messageBubble: {
    padding: 9,
    borderRadius: 7,
    marginBottom: 7.2,
    maxWidth: '72%',
  },
  staffBubble: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-end',
  },
  parentBubble: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 12.6,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7.2,
    backgroundColor: '#fff',
    borderTopWidth: 0.9,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  chatInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#f5f7fa',
    borderRadius: 7,
    paddingHorizontal: 10.8,
    fontSize: 12.6,
    marginRight: 7.2,
  },
  attachButton: {
    marginRight: 7.2,
  },
  sendButton: {
    backgroundColor: '#5F83C7',
    borderRadius: 7,
    padding: 7.2,
  },
});

export default ParentCommunication;