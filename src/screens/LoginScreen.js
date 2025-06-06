import React, { useState } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Image,Alert, Modal, Platform, ActivityIndicator} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // 👈 import useAuth

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotVisible, setForgotVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState('email');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const { setUserData } = useAuth(); // 👈 use context

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting login with:', { username: email, password }); // Debug log

      const response = await axios.post(
        'https://aglobiaerp.com/aglobiaerpProject/webApi/user/login/',
        { 
          username: email, 
          password: password,
          staff: 7 // Adding staff ID as per API requirements
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Login response:', response.data); // Debug log

      if (response.data && response.data.statusCode === '01') {
        const userDetails = response.data.userProfile.userDetails;
        setUserData(userDetails);
        Alert.alert('Login Successful', `Welcome, ${userDetails.employeename}`);
        navigation.replace('Dashboard');
      } else {
        Alert.alert(
          'Login Failed', 
          response.data?.msg || 'Invalid credentials. Please check your email and password.'
        );
      }
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      Alert.alert(
        'Login Error',
        error.response?.data?.msg || 'Failed to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = () => {
    Alert.alert(
      'Reset Link Sent',
      `A reset link has been sent to your ${selectedOption === 'email' ? 'email' : 'phone number'}.`
    );
    setForgotVisible(false);
    setSelectedOption('email');
    setInputValue('');
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/AGlobia.png')} style={styles.logo} />
      <Text style={styles.title}>User Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter mail address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Enter password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setForgotVisible(true)}>
        <Text style={styles.forgotPassword}>Forgot Password</Text>
      </TouchableOpacity>

      {/* Forgot Password Modal */}
      <Modal visible={forgotVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Forgot Password</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedOption}
              onValueChange={(itemValue) => setSelectedOption(itemValue)}
              mode="dropdown"
              style={styles.picker}
            >
              <Picker.Item label="Select one" value="" enabled={false} />
              <Picker.Item label="Email" value="email" />
              <Picker.Item label="Phone Number" value="phone" />
            </Picker>
          </View>

          <TextInput
            style={styles.modalInput}
            placeholder={selectedOption === 'email' ? 'Enter your email' : 'Enter your phone number'}
            keyboardType={selectedOption === 'email' ? 'email-address' : 'numeric'}
            value={inputValue}
            onChangeText={setInputValue}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleForgotSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setForgotVisible(false)} style={styles.cancelLink}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#0066cc',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  forgotPassword: {
    marginTop: 10,
    color: '#0066cc',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    justifyContent: 'center',
    padding: 30,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  modalInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  submitButton: {
    backgroundColor: '#0066cc',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelText: {
    color: '#0066cc',
    fontSize: 16,
  },
});
