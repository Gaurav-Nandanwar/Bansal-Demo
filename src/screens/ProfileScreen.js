// ProfileScreen.js
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { LogBox } from 'react-native';

// LogBox.ignoreLogs(['Failed to '])


const ProfileScreen = () => {
  const { userData, refreshUserData } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUserData();
    setRefreshing(false);
  }, []);

  if (!userData) return null;

  const {
    studentname,
    dateofbirth,
    rollno,
    bloodgroup_name,
    contact_info,
    addresses,
    father,
    mother,
    school_name,
    studentimage,
    student_id,
  } = userData;

  return (
    <View style={styles.container}>
      <Header title="Profile" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileSection}>
          <Image
            source={{ uri: studentimage?.image_url }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{studentname}</Text>
          <Text style={styles.profileSubInfo}>
            {school_name} || {student_id}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name:</Text>
            <Text style={styles.value}>{studentname}</Text>
          </View>
          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>
                {contact_info?.mobilenumber}
              </Text>
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>DOB:</Text>
              <Text style={styles.value}>{dateofbirth}</Text>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>
              {contact_info?.studentemail}
            </Text>
          </View>
          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Roll No.:</Text>
              <Text style={styles.value}>{rollno}</Text>
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>Blood Group:</Text>
              <Text style={styles.value}>{bloodgroup_name}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parent</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Father's Name:</Text>
            <Text style={styles.value}>{father?.fathername}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Father's Email:</Text>
            <Text style={styles.value}>{father?.fatheremail}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Father's Phone:</Text>
            <Text style={styles.value}>{father?.mobilenumber}</Text>
          </View>
          <View style={[styles.field, { marginTop: 10 }]}>
            <Text style={styles.label}>Mother's Name:</Text>
            <Text style={styles.value}>{mother?.mothername}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Mother's Email:</Text>
            <Text style={styles.value}>{mother?.email}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Mother's Phone:</Text>
            <Text style={styles.value}>{mother?.mobilenumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <Text style={styles.value}>
            {addresses?.address1}, {addresses?.address2}, {addresses?.city},{' '}
            {addresses?.state} - {addresses?.pincode}
          </Text>
        </View>

        <TouchableOpacity style={styles.uploadBox}>
          <Text style={styles.uploadText}>Update Profile Picture</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6fb' },
  scrollContainer: { padding: 16, paddingBottom: 30 },

  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#5F83C7',
  },
  profileName: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  profileSubInfo: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },

  section: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  field: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#fdfdfd',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldHalf: {
    flex: 1,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#fdfdfd',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5F83C7',
  },
  value: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
  uploadBox: {
    backgroundColor: '#5F83C7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  uploadText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

