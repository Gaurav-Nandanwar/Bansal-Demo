import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView } from 'react-native';
import React, { useState } from 'react';
import Header from '../components/Header';

const SendAnnouncement = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    // Placeholder for send logic (e.g., API call to send announcement)
    console.log('Announcement sent:', { title, message });
    // Clear inputs after sending
    setTitle('');
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header/>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoidingView}>
        
        {/* <Text style={styles.title}>Send Announcement</Text> */}
        <TextInput
          style={styles.input}
          placeholder="Title (optional)"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.messageInput}
          placeholder="Write your announcement here..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SendAnnouncement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  messageInput: {
    height: 150,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingTop: 10,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: "#5F83C7",
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});