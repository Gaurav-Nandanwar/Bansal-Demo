// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved session data on app start
  useEffect(() => {
    loadSavedSession();
  }, []);

  const loadSavedSession = async () => {
    try {
      setIsLoading(true);
      
      // Load saved user data
      const savedUserData = await AsyncStorage.getItem('userData');
      const savedSchoolId = await AsyncStorage.getItem('school_id');
      const savedStaffId = await AsyncStorage.getItem('staff_id');
      const savedStaffData = await AsyncStorage.getItem('staff_data');

      if (savedUserData && savedSchoolId && savedStaffId) {
        let parsedUserData = JSON.parse(savedUserData);
        
        // If we have complete staff data, use that instead
        if (savedStaffData) {
          const completeStaffData = JSON.parse(savedStaffData);
          parsedUserData = completeStaffData;
          console.log('Complete staff data loaded from storage');
        } else {
          console.log('Basic user data loaded from storage');
        }
        
        setUserData(parsedUserData);
      }
    } catch (error) {
      console.error('Error loading saved session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (!userData?.staff_id) return;

    try {
      const response = await axios.post(
        'https://api.stpl.cloud/login', 
        { 
          username: userData.email || userData.staff_email,
          password: userData.password // Note: This might not be stored for security
        }
      );

      if (response.data && response.data.message === 'Staff Login successful') {
        const userDetails = response.data.staff_details;
        const schoolId = response.data.school_id;
        const staffId = userDetails.id;
        
        const updatedUserData = {
          ...userDetails,
          school_id: schoolId,
          assigned_roles: response.data.assigned_roles,
          school_details: response.data.school_details
        };

        // Save updated data
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
        await AsyncStorage.setItem('school_id', schoolId.toString());
        await AsyncStorage.setItem('staff_id', staffId.toString());

        setUserData(updatedUserData);
        return updatedUserData;
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  const saveUserSession = async (userDetails, schoolId, staffId, assignedRoles, schoolDetails) => {
    try {
      const userDataToSave = {
        ...userDetails,
        school_id: schoolId,
        assigned_roles: assignedRoles,
        school_details: schoolDetails
      };

      await AsyncStorage.setItem('userData', JSON.stringify(userDataToSave));
      await AsyncStorage.setItem('school_id', schoolId.toString());
      await AsyncStorage.setItem('staff_id', staffId.toString());

      setUserData(userDataToSave);
    } catch (error) {
      console.error('Error saving user session:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        'userData',
        'school_id', 
        'staff_id',
        'class_id',
        'school_details',
        'staff_data'
      ]);
      setUserData(null);
      console.log('All session data cleared');
    } catch (error) {
      console.error('Error clearing user session:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      userData, 
      setUserData, 
      refreshUserData, 
      saveUserSession,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
