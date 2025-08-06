import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList } from 'react-native';
import React, { useState } from 'react';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ParentChatDetail = ({ route }) => {
  const navigation = useNavigation();
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
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Parent Communication')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{chat.name}</Text>
      </View>
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
  chatDetailContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5F83C7',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 4,
    marginBottom: 4,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  messageList: {
    padding: 8,
    flexGrow: 1,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '80%',
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
    fontSize: 14,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  chatInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginRight: 8,
  },
  attachButton: {
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#5F83C7',
    borderRadius: 8,
    padding: 8,
  },
});

export default ParentChatDetail;
