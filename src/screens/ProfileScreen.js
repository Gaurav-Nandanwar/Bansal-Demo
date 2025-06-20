import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ProfileScreen = () => {
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      // Get user ID from AsyncStorage
      const userDetails = await AsyncStorage.getItem('userDetails');
      if (!userDetails) {
        setError('User details not found');
        setLoading(false);
        return;
      }

      const { id } = JSON.parse(userDetails);
      console.log('Fetching profile for user ID:', id);

      const response = await axios.post(
        'https://bansal.steponetechnologies.com/bansalProject/appApi/user/profile/',
        {
          student_id: id.toString()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      console.log('Profile API Response:', JSON.stringify(response.data, null, 2));

      if (response.data.statusCode === "01") {
        const userDetails = response.data.profile.userDetails;
        // Construct the full profile image URL
        const profileImageUrl = userDetails.profileImageUrl 
          ? `https://bansal-stepone.s3.ap-south-1.amazonaws.com/media/${userDetails.profileImageUrl}`
          : null;
        
        setProfileData({
          ...userDetails,
          profileImageUrl
        });
      } else {
        setError('Failed to fetch profile data');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (title, data) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {data}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.customHeader}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5F83C7" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.customHeader}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.container}>
        <View style={styles.customHeader}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <Text style={styles.noData}>No profile data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => setIsImageModalVisible(true)}>
            <Image
              source={
                profileData?.profileImageUrl
                  ? { uri: profileData.profileImageUrl }
                  : require('../../assets/school.png')
              }
              style={styles.profileImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.studentName}>{profileData?.studentName}</Text>
          <Text style={styles.schoolName}>{profileData?.branch}</Text>
        </View>

        {/* Sections */}
        {renderSection('Personal Information', [
          <View key="dob" style={styles.infoRow}>
            <Text style={styles.label}>Date of Birth</Text>
            <Text style={styles.value}>{profileData.dob || 'N/A'}</Text>
          </View>,
          <View key="gender" style={styles.infoRow}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>{profileData.gender || 'N/A'}</Text>
          </View>,
          <View key="email" style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profileData.studentEmail || 'N/A'}</Text>
          </View>,
          <View key="mobile" style={styles.infoRow}>
            <Text style={styles.label}>Mobile Number</Text>
            <Text style={styles.value}>{profileData.mobileNo || 'N/A'}</Text>
          </View>,
        ])}

        {renderSection('Academic Information', [
          <View key="class" style={styles.infoRow}>
            <Text style={styles.label}>Class</Text>
            <Text style={styles.value}>{profileData.classes || 'N/A'}</Text>
          </View>,
          <View key="section" style={styles.infoRow}>
            <Text style={styles.label}>Section</Text>
            <Text style={styles.value}>{profileData.section || 'N/A'}</Text>
          </View>,
          <View key="roll" style={styles.infoRow}>
            <Text style={styles.label}>Roll Number</Text>
            <Text style={styles.value}>{profileData.rollNo || 'N/A'}</Text>
          </View>,
          <View key="enroll" style={styles.infoRow}>
            <Text style={styles.label}>Enrollment Number</Text>
            <Text style={styles.value}>{profileData.enrollmentNo || 'N/A'}</Text>
          </View>,
          <View key="session" style={styles.infoRow}>
            <Text style={styles.label}>Session</Text>
            <Text style={styles.value}>{profileData.sessionName || 'N/A'}</Text>
          </View>,
        ])}

        {renderSection('Address', [
          <View key="address" style={styles.infoRow}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{profileData.address || 'N/A'}</Text>
          </View>,
        ])}
      </ScrollView>

      <Modal
        visible={isImageModalVisible}
        transparent={true}
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsImageModalVisible(false)}
          >
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Image
            source={
              profileData?.profileImageUrl
                ? { uri: profileData.profileImageUrl }
                : require('../../assets/school.png')
            }
            style={styles.enlargedImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  customHeader: {
    height: 60,
    backgroundColor: '#5F83C7',
    justifyContent: 'center',
    paddingLeft: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#5F83C7',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 3,
  },
  schoolName: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedImage: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.7,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
  },
  sectionContent: {
    padding: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 10,
    color: '#7f8c8d',
    flex: 1,
  },
  value: {
    fontSize: 10,
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  noData: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
  },
});