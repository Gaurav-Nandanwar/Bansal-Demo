import React, { useState } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Image,Alert, Modal, Platform, ActivityIndicator} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // 👈 import useAuth
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotVisible, setForgotVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState('email');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const { saveUserSession } = useAuth(); // 👈 use context
  const selectedSchool = route.params?.selectedSchool;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting login with:', { username: email, password });

      const response = await axios.post(
        'https://api.stpl.cloud/login',
        {
          username: email,
          password: password
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log('Login response:', response.data);

      if (response.data && response.data.message === 'Staff Login successful') {
        const userDetails = response.data.staff_details;
        const schoolId = response.data.school_id;
        const staffId = userDetails.id;

        // Log the complete staff data being saved
        console.log('=== STAFF DATA BEING SAVED ===');
        console.log('Complete Staff Details:', JSON.stringify(userDetails, null, 2));
        console.log('School ID:', schoolId);
        console.log('Staff ID:', staffId);
        console.log('Assigned Roles:', response.data.assigned_roles);
        console.log('School Details:', response.data.school_details);
        console.log('================================');

        // Save school_id and staff_id to AsyncStorage
        await AsyncStorage.setItem('school_id', schoolId.toString());
        await AsyncStorage.setItem('staff_id', staffId.toString());
        console.log('Saved school_id:', schoolId);
        console.log('Saved staff_id:', staffId);

        // Get assigned roles (no class_id saved)
        const assignedRoles = response.data.assigned_roles;

        // Save school details if available
        if (response.data.school_details) {
          await AsyncStorage.setItem('school_details', JSON.stringify(response.data.school_details));
          console.log('Saved school details to AsyncStorage');
        }

        // Fetch complete staff data from API
        try {
          const staffResponse = await axios.get('https://api.stpl.cloud/staff/getstaffs/');
          if (staffResponse.data && Array.isArray(staffResponse.data)) {
            // Find the staff member by ID
            const completeStaffData = staffResponse.data.find(staff => staff.id === staffId);
            
            if (completeStaffData) {
              console.log('=== COMPLETE STAFF DATA FROM API ===');
              console.log('Complete Staff Data:', JSON.stringify(completeStaffData, null, 2));
              console.log('====================================');
              
              // Save complete staff data to AsyncStorage
              await AsyncStorage.setItem('staff_data', JSON.stringify(completeStaffData));
              
              // Save user session using the context function with complete data
              await saveUserSession(
                completeStaffData,
                schoolId,
                staffId,
                assignedRoles,
                response.data.school_details
              );
            } else {
              console.log('Staff member not found in API response, using basic data');
              await saveUserSession(
                userDetails,
                schoolId,
                staffId,
                assignedRoles,
                response.data.school_details
              );
            }
          } else {
            console.log('Invalid API response format, using basic data');
            await saveUserSession(
              userDetails,
              schoolId,
              staffId,
              assignedRoles,
              response.data.school_details
            );
          }
        } catch (staffError) {
          console.error('Error fetching complete staff data:', staffError);
          // Fallback to basic user details
          await saveUserSession(
            userDetails,
            schoolId,
            staffId,
            assignedRoles,
            response.data.school_details
          );
        }
        
        Alert.alert('Login Successful', `Welcome, ${userDetails.staff_name}`);
        navigation.replace('Dashboard');
      } else {
        Alert.alert(
          'Login Failed', 
          'Invalid credentials. Please check your email and password.'
        );
      }
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      Alert.alert(
        'Login Error',
        error.response?.data?.message || 'Failed to connect to the server. Please check your internet connection and try again.'
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
      <TouchableOpacity 
        style={styles.schoolSwitchButton}
        onPress={() => navigation.navigate('SelectSchool')}
      >
        <MaterialIcons name="school" size={24} color="#5F83C7" />
      </TouchableOpacity>

      <Image
        source={require('../../assets/teacher.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Staff Login</Text>

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
    marginBottom: 20,
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
  schoolInfo: {
    backgroundColor: '#5F83C7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  schoolName: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
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
});
