import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, ScrollView, Dimensions, Modal, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const { userData } = useAuth();
  const [staffData, setStaffData] = useState(null);
  const [schoolLogo, setSchoolLogo] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    loadStaffData();
    loadSchoolLogo();
  }, []);

  const loadStaffData = async () => {
    try {
      const savedStaffData = await AsyncStorage.getItem('staff_data');
      if (savedStaffData) {
        const parsedData = JSON.parse(savedStaffData);
        setStaffData(parsedData);
        console.log('=== LOADED STAFF DATA FROM STORAGE ===');
        console.log('Staff Data:', JSON.stringify(parsedData, null, 2));
        console.log('=====================================');
      }
    } catch (error) {
      console.error('Error loading staff data:', error);
    }
  };

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

  if (!userData && !staffData) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>My Profile</Text>
        </View>
        <View style={styles.noDataContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#ccc" />
          <Text style={styles.noData}>No user data available</Text>
        </View>
      </View>
    );
  }

  const displayData = staffData || userData;

  let profileImageSource = null;
  if (displayData?.staff_image_url) {
    profileImageSource = { uri: displayData.staff_image_url };
  } else if (schoolLogo) {
    profileImageSource = { uri: schoolLogo };
  } else {
    profileImageSource = require('../../assets/teacher.png');
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>My Profile</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={() => setImageModalVisible(true)}>
              <Image
                source={profileImageSource}
                style={styles.profileImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {/* <View style={styles.onlineIndicator} /> */}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{displayData?.staff_name || 'Staff Name'}</Text>
            <Text style={styles.designation}>{displayData?.designation_name || 'Staff Role'}</Text>
            <Text style={styles.department}>{displayData?.department_name || 'Department'}</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="school-outline" size={24} color="#5F83C7" />
            <Text style={styles.statNumber}>{displayData?.years_of_experience || '0'}</Text>
            <Text style={styles.statLabel}>Years Exp</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={24} color="#5F83C7" />
            <Text style={styles.statNumber}>{displayData?.date_of_joining ? 'Active' : 'N/A'}</Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="location-outline" size={24} color="#5F83C7" />
            <Text style={styles.statNumber}>{displayData?.city || 'N/A'}</Text>
            <Text style={styles.statLabel}>Location</Text>
          </View>
        </View>

        {/* Information Sections */}
        <View style={styles.sectionsContainer}>
          {/* Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle-outline" size={24} color="#5F83C7" />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            <View style={styles.sectionContent}>
              <InfoRow label="Full Name" value={displayData?.staff_name} />
              <InfoRow label="Date of Birth" value={displayData?.date_of_birth} />
              <InfoRow label="Gender" value={displayData?.gender} />
              <InfoRow label="Blood Group" value={displayData?.blood_group} />
              <InfoRow label="Marital Status" value={displayData?.marital_status} />
              <InfoRow label="Religion" value={displayData?.religion_name} />
              <InfoRow label="Caste" value={displayData?.caste_name} />
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call-outline" size={24} color="#5F83C7" />
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>
            <View style={styles.sectionContent}>
              <InfoRow label="Email" value={displayData?.email_id} />
              <InfoRow label="Mobile Number" value={displayData?.mobile_number} />
              <InfoRow label="Aadhar Number" value={displayData?.aadharnumber} />
              <InfoRow label="PAN Number" value={displayData?.pan_number} />
              <InfoRow label="Address" value={`${displayData?.address1 || ''} ${displayData?.address2 || ''}`} />
              <InfoRow label="City" value={displayData?.city} />
              <InfoRow label="State" value={displayData?.state} />
              <InfoRow label="Pincode" value={displayData?.pincode} />
            </View>
          </View>

          {/* Professional Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="briefcase-outline" size={24} color="#5F83C7" />
              <Text style={styles.sectionTitle}>Professional Information</Text>
            </View>
            <View style={styles.sectionContent}>
              <InfoRow label="School Name" value={displayData?.school_name} />
              <InfoRow label="Department" value={displayData?.department_name} />
              <InfoRow label="Designation" value={displayData?.designation_name} />
              <InfoRow label="Date of Joining" value={displayData?.date_of_joining} />
              <InfoRow label="Education" value={displayData?.education_background} />
              <InfoRow label="Experience" value={displayData?.years_of_experience ? `${displayData.years_of_experience} years` : 'N/A'} />
              <InfoRow label="Last School" value={displayData?.last_school_working_in} />
            </View>
          </View>

          {/* Bank Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card-outline" size={24} color="#5F83C7" />
              <Text style={styles.sectionTitle}>Bank Details</Text>
            </View>
            <View style={styles.sectionContent}>
              <InfoRow label="Account Holder" value={displayData?.account_holder_name} />
              <InfoRow label="Bank Name" value={displayData?.bank_name} />
              <InfoRow label="Branch" value={displayData?.branch_name} />
              <InfoRow label="Account Number" value={displayData?.account_number} />
              <InfoRow label="IFSC Code" value={displayData?.ifsc_code} />
            </View>
          </View>

          {/* Additional Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={24} color="#5F83C7" />
              <Text style={styles.sectionTitle}>Additional Information</Text>
            </View>
            <View style={styles.sectionContent}>
              <InfoRow label="Staff ID" value={displayData?.id?.toString()} />
              <InfoRow label="School ID" value={displayData?.school_id?.toString()} />
              <InfoRow label="Department ID" value={displayData?.department_id?.toString()} />
              <InfoRow label="Designation ID" value={displayData?.designation_id?.toString()} />
              <InfoRow label="Is Active" value={displayData?.is_active ? 'Yes' : 'No'} />
              <InfoRow label="Date Created" value={displayData?.date_created} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close-circle" size={30} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.modalImageContainer}
            onPress={() => setImageModalVisible(false)}
            activeOpacity={1}
          >
            <Image
              source={profileImageSource}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

// InfoRow Component
const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || 'N/A'}</Text>
  </View>
);

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerContainer: {
    backgroundColor: '#5F83C7',
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noData: {
    fontSize: 10,
    color: '#666',
    marginTop: 16,
  },
  profileHeader: {
    backgroundColor: '#fff',
    margin: 4,
    borderRadius: 6,
    padding: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  profileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#5F83C7',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: width * 0.25 - 18,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  designation: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5F83C7',
    marginBottom: 2,
  },
  department: {
    fontSize: 8,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 4,
    marginBottom: 4,
    borderRadius: 6,
    padding: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 4,
  },
  sectionsContainer: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  sectionContent: {
    padding: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 20,
  },
  modalImage: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 10,
  },
});
