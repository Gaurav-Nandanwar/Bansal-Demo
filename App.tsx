import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import SelectSchoolScreen from './src/screens/SelectSchoolScreen';
import LoadingScreen from './src/components/LoadingScreen';
import 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import useLocationPermission from './src/hooks/useLocationPermission';

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const { userData, isLoading } = useAuth();
  useLocationPermission(); // 👈 trigger on app start

  if (isLoading) {
    return <LoadingScreen message="Checking session..." />;
  }

  // Determine initial route based on authentication state
  let initialRouteName = 'SelectSchool';
  if (userData) {
    // User is logged in - show dashboard
    initialRouteName = 'Dashboard';
  } else {
    // No user data - show school selection (will be handled by navigation)
    initialRouteName = 'SelectSchool';
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="SelectSchool" component={SelectSchoolScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};



export default App;
