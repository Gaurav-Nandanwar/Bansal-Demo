import React from 'react';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerItem } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

import HomeTabs from '../navigation/HomeTabs';
import TimetableScreen from '../screens/TimetableScreen';
import ExaminationScreen from '../screens/ExaminationScreen';
import ResultScreen from '../screens/ResultScreen';
import SyllabusScreen from '../screens/SyllabusScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AssignmentScreen from '../screens/AssignmentScreen';
import HomeworkScreen from '../screens/HomeworkScreen';
import EventScreen from '../screens/EventScreen';
import DetailsScreen from '../screens/DetailsScreen';

import FeeScreen from '../screens/FeeScreen';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
  const navigation = useNavigation();
  const { userData, setUserData } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear all AsyncStorage data
            await AsyncStorage.multiRemove([
              'userData',
              'userIdentifiers',
              'token',
              'isLoggedIn'
            ]);

            // Clear user data from context
            setUserData(null);

            // Reset navigation to Login screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.profileContainer}>
        <Image
          source={
            userData?.studentimage?.image_url
              ? { uri: userData.studentimage.image_url }
              : require('../../assets/school.png')
          }
          style={styles.profileImage}
          resizeMode="cover"
        />
        <Text style={styles.profileName}>{userData?.studentname || 'Student'}</Text>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          <DrawerItem
            label="Home"
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="home-outline" size={size} color={'white'} />
            )}
            labelStyle={styles.drawerLabel}
            onPress={() => props.navigation.navigate('Home')}
          />
          <DrawerItem
            label="Examination"
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="calendar-clock" size={size} color={'white'} />
            )}
            labelStyle={styles.drawerLabel}
            onPress={() => props.navigation.navigate('Examination')}
          />
          
          {/* <DrawerItem
            label="Fees"
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="cash-multiple" size={size} color={'white'} />
            )}
            labelStyle={styles.drawerLabel}
            onPress={() => props.navigation.navigate('Fees')}
          /> */}
          {/* <DrawerItem
            label="Timetable"
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="application" size={size} color={'white'} />
            )}
            labelStyle={styles.drawerLabel}
            onPress={() => props.navigation.navigate('Timetable')}
          /> */}
          <DrawerItem
            label="Result"
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="nature-people" size={size} color={'white'} />
            )}
            labelStyle={styles.drawerLabel}
            onPress={() => props.navigation.navigate('Result')}
          />
          {/* <DrawerItem
            label="Calendar"
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="calendar-today" size={size} color={'white'} />
            )}
            labelStyle={styles.drawerLabel}
            onPress={() => props.navigation.navigate('Calendar')}
          /> */}
          {/* <DrawerItem
            label="Assignment"
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="book-edit" size={size} color={'white'} />
            )}
            labelStyle={styles.drawerLabel}
            onPress={() => props.navigation.navigate('Assignment')}
          /> */}
          {/* <DrawerItem
            label="Homework"
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="book-open-page-variant" size={size} color={'white'} />
            )}
            labelStyle={styles.drawerLabel}
            onPress={() => props.navigation.navigate('Homework')}
          /> */}
          {/* <DrawerItem
            label="Event"
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="cabin-a-frame" size={size} color={'white'} />
            )}
            labelStyle={styles.drawerLabel}
            onPress={() => props.navigation.navigate('Event')}
          /> */}
        </View>
      </DrawerContentScrollView>

      <TouchableOpacity 
        onPress={handleLogout} 
        style={styles.logoutButton}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="logout" size={24} color="white" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerType: 'front',
        headerShown: false,
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#e0e0e0',
        drawerStyle: styles.drawer,
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Home" component={HomeTabs} />
      <Drawer.Screen name="Result" component={ResultScreen} />
      <Drawer.Screen name="Details" component={DetailsScreen} />
      <Drawer.Screen name="Examination" component={ExaminationScreen} />
      <Drawer.Screen name="Timetable" component={TimetableScreen} />
      <Drawer.Screen name="Syllabus" component={SyllabusScreen} />
      <Drawer.Screen name="Calendar" component={CalendarScreen} />
      <Drawer.Screen name="Assignment" component={AssignmentScreen} />
      <Drawer.Screen name="Homework" component={HomeworkScreen} />
      <Drawer.Screen name="Fees" component={FeeScreen} />
      <Drawer.Screen name="Event" component={EventScreen} />

    </Drawer.Navigator>
  );
};

export default DrawerNavigator;

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#5F83C7',
  },
  drawerLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 1,
  },
  drawer: {
    width: 230,
    backgroundColor: '#5F83C7',
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    marginBottom: 5,
    marginTop: 5,
  },
  drawerScroll: {
    flexGrow: 1,
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  menuContainer: {
    paddingVertical: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
});
