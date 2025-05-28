import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/HomeScreen';
import LocationScreen from '../screens/LocationScreen';
import UpcomingMeetingScreen from '../screens/UpcomingMeetingScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const HomeTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5F83C7',
        tabBarInactiveTintColor: '#777',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home-outline" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="LocationTab"
        component={LocationScreen}
        options={{
          tabBarLabel: 'Location',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map-marker" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="Upcoming Meeting"
        component={UpcomingMeetingScreen}
        options={{
          tabBarLabel: 'Meetings',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="face-agent" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-circle-outline" color={color} size={24} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default HomeTabs;
