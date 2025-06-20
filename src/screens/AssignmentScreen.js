import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Dimensions, Linking, Alert, Clipboard } from 'react-native';
import React, { useState, useEffect } from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const AssignmentScreen = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user ID from AsyncStorage
      const userDetails = await AsyncStorage.getItem('userDetails');
      if (!userDetails) {
        setError('User details not found');
        setLoading(false);
        return;
      }

      const { id } = JSON.parse(userDetails);
      console.log('Fetching assignments for user ID:', id);

      const response = await axios.post(
        'https://bansal.steponetechnologies.com/bansalProject/appApi/getStudentAssignment/',
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

      console.log('Raw API Response:', response);
      console.log('Assignment API Response:', JSON.stringify(response.data, null, 2));

      if (response.data.statusCode === "01") {
        if (Array.isArray(response.data.data)) {
          console.log('Setting assignments:', response.data.data);
          setAssignments(response.data.data);
        } else {
          console.error('Invalid response format:', response.data);
          setAssignments([]);
          setError('Invalid response format from server');
        }
      } else {
        setError(response.data.message || 'Failed to fetch assignments');
        setAssignments([]);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
      }
      setAssignments([]);
      setError('Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  const handleAttachmentPress = async (url) => {
    try {
      if (!url) {
        console.log('No URL provided');
        Alert.alert('Error', 'No attachment URL provided.');
        return;
      }

      // Construct S3 bucket URL
      const s3BaseUrl = 'https://bansal-stepone.s3.ap-south-1.amazonaws.com/media/';
      const normalizedUrl = s3BaseUrl + url;
      console.log(`Attempting to open URL: ${normalizedUrl}`);

      // Attempt to open the URL
      try {
        await axios.head(normalizedUrl);
        console.log('URL is accessible');
        await Linking.openURL(normalizedUrl);
      } catch (headErr) {
        console.warn('URL accessibility check failed:', headErr.message);
        Alert.alert(
          'Warning',
          'The attachment may not be accessible. Do you want to try opening it?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open', onPress: async () => await Linking.openURL(normalizedUrl) },
            { 
              text: 'Copy URL', 
              onPress: async () => {
                await Clipboard.setString(normalizedUrl);
                Alert.alert('Success', 'URL copied to clipboard.');
              }
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert(
        'Error',
        'Failed to open attachment. Please try again or copy the URL.',
        [
          { text: 'OK', style: 'cancel' },
          { 
            text: 'Copy URL', 
            onPress: async () => {
              const s3BaseUrl = 'https://bansal-stepone.s3.ap-south-1.amazonaws.com/media/';
              const fullUrl = s3BaseUrl + url;
              await Clipboard.setString(fullUrl);
              Alert.alert('Success', 'URL copied to clipboard.');
            }
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assignments</Text>
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assignments</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchAssignments}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignments</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {assignments && assignments.length > 0 ? (
          assignments.map((assignment, index) => {
            console.log('Rendering assignment:', assignment);
            return (
              <View key={assignment.details.id || index} style={styles.assignmentCard}>
                <View style={styles.headerRow}>
                  <View style={styles.subjectContainer}>
                    <MaterialIcons name="book" size={12} color="#5F83C7" />
                    <Text style={styles.subjectText}>{assignment.details.subject || 'No Subject'}</Text>
                  </View>
                  <View style={styles.classContainer}>
                    <Text style={styles.classText}>{assignment.details.classSection}</Text>
                  </View>
                </View>

                <Text style={styles.title}>{assignment.details.name || 'No Title'}</Text>
                <Text style={styles.description}>{assignment.details.description || 'No Description'}</Text>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="event" size={10} color="#666" />
                    <Text style={styles.detailText}>From: {formatDate(assignment.details.fromDate)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialIcons name="event" size={10} color="#666" />
                    <Text style={styles.detailText}>To: {formatDate(assignment.details.toDate)}</Text>
                  </View>
                </View>

                {assignment.details.fileImageUrl && (
                  <TouchableOpacity 
                    style={styles.attachmentButton}
                    onPress={() => handleAttachmentPress(assignment.details.fileImageUrl)}
                  >
                    <MaterialIcons name="attachment" size={10} color="#5F83C7" />
                    <Text style={styles.attachmentText}>View Attachment</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.noAssignmentContainer}>
            <Text style={styles.noAssignmentText}>No assignments found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default AssignmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 60,
    backgroundColor: '#5F83C7',
    justifyContent: 'center',
    alignItems: 'flex-start',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
  },
  scrollView: {
    flex: 1,
    padding: 9,
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
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  assignmentCard: {
    backgroundColor: 'white',
    borderRadius: 7,
    padding: 9,
    marginBottom: 9,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#5F83C7',
    marginLeft: 4,
  },
  classContainer: {
    backgroundColor: '#E8F4FA',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
  },
  classText: {
    color: '#5F83C7',
    fontWeight: '600',
    fontSize: 9,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    color: '#666',
    lineHeight: 11,
    marginBottom: 9,
  },
  detailsContainer: {
    marginBottom: 9,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 9,
    color: '#666',
    marginLeft: 4,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FA',
    padding: 7,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  attachmentText: {
    color: '#5F83C7',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 8,
  },
  retryButton: {
    backgroundColor: '#5F83C7',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noAssignmentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noAssignmentText: {
    color: '#666',
    fontSize: 14,
  },
});