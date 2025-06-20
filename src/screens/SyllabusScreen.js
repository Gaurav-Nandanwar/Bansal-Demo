import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  ToastAndroid,
} from 'react-native';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SyllabusScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const { userData } = useAuth();

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get class_id and school_id from AsyncStorage
      const savedIdentifiers = await AsyncStorage.getItem('userIdentifiers');
      const identifiers = JSON.parse(savedIdentifiers);
      const classId = identifiers?.class_id;
      const schoolId = identifiers?.school_id;

      console.log('=== Syllabus Screen ===');
      console.log('Class ID from AsyncStorage:', classId);
      console.log('School ID from AsyncStorage:', schoolId);

      if (!classId) {
        throw new Error('Class ID not found');
      }
      if (!schoolId) {
        throw new Error('School ID not found');
      }

      const response = await fetch(
        `https://api.stpl.cloud/topics/get/?class_id=${classId}&school_id=${schoolId}`
      );
      const data = await response.json();

      console.log('API Response:', data);
      
      if (!data || !Array.isArray(data)) {
        console.error('Invalid response format:', data);
        setTopics([]);
        setError('Invalid response format from server');
        return;
      }

      setTopics(data);
    } catch (err) {
      console.error('Error in fetchTopics:', err);
      setTopics([]);
      setError('Failed to fetch topics');
      Alert.alert('Error', 'Failed to load topics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUniqueSubjects = () => {
    if (!topics || !Array.isArray(topics)) return [];
    return [...new Set(topics.map(topic => topic.subject_name))];
  };

  const getChaptersForSubject = (subjectName) => {
    if (!topics || !Array.isArray(topics)) return [];
    return [...new Set(
      topics
        .filter(topic => topic.subject_name === subjectName)
        .map(topic => topic.chapter_name)
    )];
  };

  const getTopicsForChapter = (subjectName, chapterName) => {
    if (!topics || !Array.isArray(topics)) return [];
    return topics.filter(
      topic => topic.subject_name === subjectName && topic.chapter_name === chapterName
    );
  };

  const handleOpenAttachment = async (url) => {
    try {
      if (!url) {
        ToastAndroid.show('No attachment URL provided', ToastAndroid.SHORT);
        return;
      }
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening attachment:', error);
      Alert.alert('Error', 'Could not open the attachment');
    }
  };

  const handleAttachmentPress = (topic) => {
    if (!topic) return;
    
    if (topic.attachment?.image_id) {
      handleOpenAttachment(topic.attachment.image_id);
    } else {
      ToastAndroid.show('No attachment found', ToastAndroid.SHORT);
    }
  };

  const renderTopicItem = ({ item }) => {
    if (!item) return null;
    
    return (
      <TouchableOpacity
        style={styles.topicCard}
        onPress={() => {
          setSelectedTopic(item);
          setPreviewModalVisible(true);
        }}
      >
        <View style={styles.topicHeader}>
          <Text style={styles.topicName}>{item.topic_name || 'No Title'}</Text>
          <Text style={styles.topicDuration}>{item.duration || 'No Duration'}</Text>
        </View>
        <Text style={styles.topicDescription} numberOfLines={2}>
          {item.description || 'No Description'}
        </Text>
        <View style={styles.topicFooter}>
          <Text style={styles.topicDates}>
            {item.start_date || 'No Start Date'} - {item.end_date || 'No End Date'}
          </Text>
          <View style={styles.footerRight}>
            <Text style={[styles.topicStatus, { color: item.status === 'Pending' ? '#f39c12' : '#27ae60' }]}>
              {item.status || 'Unknown'}
            </Text>
            <TouchableOpacity 
              style={styles.attachmentButton}
              onPress={() => handleAttachmentPress(item)}
            >
              <Text style={styles.attachmentButtonText}>View Attachment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Syllabus" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading topics...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Syllabus" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTopics}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Syllabus" />

      {/* Subject Selection */}
      <View style={styles.subjectContainer}>
        <Text style={styles.sectionTitle}>Select Subject</Text>
        <FlatList
          horizontal
          data={getUniqueSubjects()}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.subjectButton,
                selectedSubject === item && styles.selectedSubjectButton,
              ]}
              onPress={() => {
                setSelectedSubject(item);
                setSelectedChapter(null);
              }}
            >
              <Text
                style={[
                  styles.subjectButtonText,
                  selectedSubject === item && styles.selectedSubjectButtonText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Chapter Selection */}
      {selectedSubject && (
        <View style={styles.chapterContainer}>
          <Text style={styles.sectionTitle}>Select Chapter</Text>
          <FlatList
            horizontal
            data={getChaptersForSubject(selectedSubject)}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.chapterButton,
                  selectedChapter === item && styles.selectedChapterButton,
                ]}
                onPress={() => setSelectedChapter(item)}
              >
                <Text
                  style={[
                    styles.chapterButtonText,
                    selectedChapter === item && styles.selectedChapterButtonText,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Topics List */}
      {selectedSubject && selectedChapter && (
        <View style={styles.topicsContainer}>
          <Text style={styles.sectionTitle}>Topics</Text>
          <FlatList
            data={getTopicsForChapter(selectedSubject, selectedChapter)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTopicItem}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Topic Preview Modal */}
      <Modal
        visible={previewModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTopic && (
              <>
                <Text style={styles.modalTitle}>{selectedTopic.topic_name}</Text>
                <Text style={styles.modalDescription}>{selectedTopic.description}</Text>
                <View style={styles.modalDetails}>
                  <Text style={styles.modalDetailText}>
                    Duration: {selectedTopic.duration}
                  </Text>
                  <Text style={styles.modalDetailText}>
                    Start Date: {selectedTopic.start_date}
                  </Text>
                  <Text style={styles.modalDetailText}>
                    End Date: {selectedTopic.end_date}
                  </Text>
                  <Text style={styles.modalDetailText}>
                    Status: {selectedTopic.status}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalAttachmentButton}
                  onPress={() => handleAttachmentPress(selectedTopic)}
                >
                  <Text style={styles.modalAttachmentButtonText}>View Attachment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setPreviewModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SyllabusScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
  },
  subjectContainer: {
    padding: 8,
    backgroundColor: 'white',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subjectButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginRight: 5,
  },
  selectedSubjectButton: {
    backgroundColor: '#0066cc',
  },
  subjectButtonText: {
    color: '#333',
    fontSize: 12,
  },
  selectedSubjectButtonText: {
    color: 'white',
  },
  chapterContainer: {
    padding: 8,
    backgroundColor: 'white',
    marginBottom: 5,
  },
  chapterButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginRight: 5,
  },
  selectedChapterButton: {
    backgroundColor: '#0066cc',
  },
  chapterButtonText: {
    color: '#333',
    fontSize: 12,
  },
  selectedChapterButtonText: {
    color: 'white',
  },
  topicsContainer: {
    flex: 1,
    padding: 8,
  },
  topicCard: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 8,
    marginBottom: 5,
    elevation: 1,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  topicName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  topicDuration: {
    fontSize: 10,
    color: '#666',
  },
  topicDescription: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicDates: {
    fontSize: 10,
    color: '#666',
  },
  topicStatus: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  attachmentButton: {
    backgroundColor: '#E8F4FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  attachmentButtonText: {
    color: '#007AFF',
    fontSize: 8,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 10,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  modalDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  modalDetails: {
    marginBottom: 10,
  },
  modalDetailText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 3,
  },
  modalAttachmentButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalAttachmentButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 12,
  },
});