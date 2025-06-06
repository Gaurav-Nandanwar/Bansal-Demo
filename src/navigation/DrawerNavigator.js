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

import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

import HomeTabs from '../navigation/HomeTabs';
import VisitScreen from '../screens/VisitScreen';
import TodaysVisitScreen from '../screens/TodaysVisitScreen';
import InquiryScreen from '../screens/InquiryScreen';
import TodaysInquiryScreen from '../screens/TodaysInquiryScreen';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
  const navigation = useNavigation();
  const { userData, setUserData } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          setUserData(null);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerScroll}
    >
      <View style={styles.profileContainer}>
        <Image
          source={
            userData?.studentimage?.image_url
              ? { uri: userData.studentimage.image_url }
              : require('../../assets/AGlobia.png') // fallback avatar
          }
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
          label="Visit"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="nature-people" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('Visit')}
        />
        <DrawerItem
          label="TodaysVisit"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('TodaysVisit')}
        />
        <DrawerItem
          label="Inquiry"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="application" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('Inquiry')}
        />
        <DrawerItem
          label="TodaysInquiry"
          icon={({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={size} color={'white'} />
          )}
          labelStyle={styles.drawerLabel}
          onPress={() => props.navigation.navigate('TodaysInquiry')}
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
      <Drawer.Screen name="Visit" component={VisitScreen} />
      <Drawer.Screen name="TodaysVisit" component={TodaysVisitScreen} />
      <Drawer.Screen name="Inquiry" component={InquiryScreen} />
      <Drawer.Screen name="TodaysInquiry" component={TodaysInquiryScreen} />

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
    bottom: 40
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
