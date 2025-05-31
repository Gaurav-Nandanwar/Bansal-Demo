import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const { userData } = useAuth();

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>No user data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
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
      <Text style={styles.header}>Profile Information</Text>
      <View style={styles.infoBox}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{userData.employeename}</Text>
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{userData.email}</Text>
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.label}>User Role:</Text>
        <Text style={styles.value}>{userData.userRole}</Text>
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
    padding: 20,
    justifyContent: 'flex-start',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#0066cc',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
    color: '#555',
  },
  value: {
    fontSize: 16,
    marginTop: 4,
    color: '#000',
  },
  noData: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
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
});
