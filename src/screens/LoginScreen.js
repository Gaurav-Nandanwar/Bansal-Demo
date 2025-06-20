import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotVisible, setForgotVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState('email');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigation = useNavigation();
  const { setUserData } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting login with:', { email, password });
      
      const response = await axios.post(
        'https://bansal.steponetechnologies.com//bansalProject/appApi/user/login/',
        {
          username: email,
          password: password
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      setLoading(false);
      console.log('API Response:', JSON.stringify(response.data, null, 2));

      if (response.data.statusCode === "01" && response.data.msg === "Login Successful") {
        const userDetails = response.data.userProfile.userDetails;
        
        // Save user details to AsyncStorage
        try {
          await AsyncStorage.setItem('userDetails', JSON.stringify(userDetails));
          
          // Console logs for saved user details
          console.log('=== Saved User Details ===');
          console.log('User Role:', userDetails.userRole);
          console.log('User ID:', userDetails.user_id);
          console.log('ID:', userDetails.id);
          console.log('Student Name:', userDetails.studentName);
          console.log('Student Email:', userDetails.studentEmail);
          console.log('Mobile No:', userDetails.mobileNo);
          console.log('=======================');

        } catch (storageError) {
          console.error('Error saving user details:', storageError);
        }

        setUserData(userDetails);
        Alert.alert('Login Successful', `Welcome, ${userDetails.studentName}`);
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login Failed', response.data.msg || 'Invalid credentials');
      }
    } catch (error) {
      setLoading(false);
      console.error('Login Error:', error);
      
      if (error.response) {
        console.error('Error Response Data:', error.response.data);
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Headers:', error.response.headers);
        
        Alert.alert(
          'Login Failed', 
          error.response.data.msg || 'Invalid credentials. Please check your email and password.'
        );
      } else if (error.request) {
        console.error('Error Request:', error.request);
        Alert.alert('Network Error', 'No response from server. Please check your internet connection.');
      } else {
        console.error('Error Message:', error.message);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
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
      <TouchableOpacity 
        style={styles.schoolSwitchButton}
        onPress={() => navigation.navigate('SelectSchool')}
      >
        <MaterialIcons name="school" size={24} color="#5F83C7" />
      </TouchableOpacity>
      <Image source={require('../../assets/school.png')} style={styles.logo} />
      <Text style={styles.title}>User Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter mail address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity 
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <MaterialIcons 
            name={showPassword ? "visibility" : "visibility-off"} 
            size={24} 
            color="#666"
          />
        </TouchableOpacity>
      </View>

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
  schoolSwitchButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    backgroundColor: '#fff',
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
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
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    height: '100%',
    justifyContent: 'center',
    padding: 10,
  },
});
