import React, { useState, useEffect } from 'react';
import {createDrawerNavigator,DrawerContentScrollView,DrawerItemList,} from '@react-navigation/drawer';
import {View,StyleSheet,TouchableOpacity,Text,Image,Alert,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerItem } from '@react-navigation/drawer';

import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeTabs from '../navigation/HomeTabs';
import TimetableScreen from '../screens/TimetableScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import AssignmentScreen from '../screens/AssignmentScreen';
import WebSocketScreen from '../screens/WebSocketScreen';
import ExamAssessmentScreen from '../screens/ExamAssessmentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LeaveForm from '../screens/LeaveForm';
import AuthorityScreen from '../screens/AuthorityScreen';
import LeaveDashboard from '../screens/LeaveDashboard';
import Subjectwise_Attendance from '../screens/Subjectwise_Attendance';
import ParentCommunication from '../screens/ParentCommunication';
import ParentChatDetail from '../screens/ParentChatDetail';
import SendAnnouncement from '../screens/SendAnnouncement';
import ExamWise_Attendance from '../screens/ExamWise_Attendance';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
  const navigation = useNavigation();
  const { userData, logout } = useAuth();
  const [schoolLogo, setSchoolLogo] = useState(null);

  useEffect(() => {
    const loadSchoolLogo = async () => {
      try {
        const schoolStr = await AsyncStorage.getItem('selectedSchool');
        if (schoolStr) {
          const school = JSON.parse(schoolStr);
          if (school?.school_logo?.image_url) {
            setSchoolLogo(school.school_logo.image_url);
          }
        }
      } catch (e) {}
    };
    loadSchoolLogo();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.navigate('Login');
        },
      },
    ]);
  };

  let profileImageSource = null;
  if (userData?.staff_image_url) {
    profileImageSource = { uri: userData.staff_image_url };
  } else if (schoolLogo) {
    profileImageSource = { uri: schoolLogo };
  } else {
    profileImageSource = require('../../assets/teacher.png');
  }

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerScroll}
    >
      <View style={styles.profileContainer}>
        <Image
          source={profileImageSource}
          style={styles.profileImage}
          resizeMode="contain"
        />
      </View>

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
          label="Timetable"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="nature-people" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('Timetable')}
        />
        <DrawerItem
          label="Attendance"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('Attendance')}
        />
        {/* <DrawerItem
          label="Subject-Wise Attendance"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="android-messages" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('Subject-Wise Attendance')}
        /> */}
        <DrawerItem
          label="Assignment"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="application" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('Assignment')}
        />
        <DrawerItem
          label="ExamAssessment"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="book" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('ExamAssessment')}
        />
        <DrawerItem
          label="Leave Form"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('Leave Form')}
        />
        <DrawerItem
          label="Authority"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="android-messages" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('Authority')}
        />
        <DrawerItem
          label="Leave Dashboard"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="android-messages" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('Leave Dashboard')}
        />
        <DrawerItem
          label="Parent Communication"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="application" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('Parent Communication')}
        />
        <DrawerItem
          label="Send Announcement"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="android-messages" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('Send Announcement')}
        />
        <DrawerItem
          label="Exam Wise Attendance"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="android-messages" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('Exam Wise Attendance')}
        />
        
      </View>

      <View style={styles.logoutContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
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
      <Drawer.Screen name="Timetable" component={TimetableScreen} />
      <Drawer.Screen name="Attendance" component={AttendanceScreen} />
      <Drawer.Screen name="Assignment" component={AssignmentScreen} />
      <Drawer.Screen name="WebSocket" component={WebSocketScreen} />
      <Drawer.Screen name="ExamAssessment" component={ExamAssessmentScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Leave Form" component={LeaveForm} />
      <Drawer.Screen name="Authority" component={AuthorityScreen} />
      <Drawer.Screen name="Leave Dashboard" component={LeaveDashboard} />
      <Drawer.Screen name="Subject-Wise Attendance" component={Subjectwise_Attendance} />
      <Drawer.Screen name="Parent Communication" component={ParentCommunication} />
      <Drawer.Screen name="ParentChatDetail" component={ParentChatDetail} />
      <Drawer.Screen name="Send Announcement" component={SendAnnouncement} />
      <Drawer.Screen name="Exam Wise Attendance" component={ExamWise_Attendance} />



    </Drawer.Navigator>
  );
};

export default DrawerNavigator;

const styles = StyleSheet.create({
  drawerLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 1, // aligns text with icon better
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
    paddingTop: 40,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
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
    flexGrow: 1,
    justifyContent: 'center',
    bottom: 20
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  logoutButton: {
    paddingVertical: 10,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
