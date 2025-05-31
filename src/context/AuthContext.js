// context/AuthContext.js
import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);

  const refreshUserData = async () => {
    if (!userData?.student_id) return;

    try {
      const response = await axios.post(
        'https://api.stpl.cloud/login', 
        { student_id: userData.student_id }
      );

      if (response.data?.student_parent_details) {
        setUserData(response.data.student_parent_details);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ userData, setUserData, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
