import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Image, Modal, Dimensions } from 'react-native'
import React, { useState, useEffect } from 'react'
import Header from '../components/Header'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const HomeworkScreen = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchHomeworks();
  }, []);

  const fetchHomeworks = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.stpl.cloud/homework/get/?school_id=3');
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        console.error('Invalid response format:', data);
        setHomeworks([]);
        setError('Invalid response format from server');
        return;
      }

      console.log('Homework data received:', data);
      setHomeworks(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching homework:', err);
      setHomeworks([]);
      setError('Failed to fetch homework');
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

  const handleImagePress = (imageUrl) => {
    if (!imageUrl) return;
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Header />
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Header />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchHomeworks}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.scrollView}>
        {homeworks && homeworks.length > 0 ? (
          homeworks.map((homework) => (
            <View key={homework.id} style={styles.homeworkCard}>
              <View style={styles.headerRow}>
                <View style={styles.subjectContainer}>
                  <MaterialIcons name="school" size={11} color="#007AFF" />
                  <Text style={styles.subjectText}>{homework.subject_name || 'No Subject'}</Text>
                </View>
                <View style={styles.marksContainer}>
                  <Text style={styles.marksText}>
                    {homework.passing_marks || 0}/{homework.total_marks || 0} Marks
                  </Text>
                </View>
              </View>

              <Text style={styles.title}>{homework.title || 'No Title'}</Text>
              <Text style={styles.description}>{homework.description || 'No Description'}</Text>

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="person" size={11} color="#666" />
                  <Text style={styles.detailText}>Teacher: {homework.staff_name || 'Not Assigned'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="event" size={11} color="#666" />
                  <Text style={styles.detailText}>Due: {formatDate(homework.due_date)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="class" size={11} color="#666" />
                  <Text style={styles.detailText}>Class: {homework.class_name || 'N/A'} - {homework.section_name || 'N/A'}</Text>
                </View>
              </View>

              {homework.attachment?.image_url && (
                <View style={styles.attachmentContainer}>
                  <TouchableOpacity 
                    style={styles.attachmentButton}
                    onPress={() => handleImagePress(homework.attachment.image_url)}
                  >
                    <MaterialIcons name="image" size={11} color="#007AFF" />
                    <Text style={styles.attachmentText}>View Image</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noHomeworkContainer}>
            <Text style={styles.noHomeworkText}>No homework assignments found</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImage }}
            style={styles.enlargedImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
}

export default HomeworkScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
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
  },
  errorText: {
    color: 'red',
    fontSize: 9,
  },
  homeworkCard: {
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
    color: '#007AFF',
    marginLeft: 4,
  },
  marksContainer: {
    backgroundColor: '#E8F4FA',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
  },
  marksText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 9,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 8,
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
    fontSize: 8,
    color: '#666',
    marginLeft: 4,
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FA',
    padding: 7,
    borderRadius: 4,
  },
  attachmentText: {
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 8,
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
    padding: 8,
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noHomeworkContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noHomeworkText: {
    color: '#666',
    fontSize: 9,
  },
})