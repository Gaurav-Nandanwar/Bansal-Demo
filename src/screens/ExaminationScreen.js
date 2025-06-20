import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ExaminationScreen = () => {
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState([]);
  const [error, setError] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [subjectDetails, setSubjectDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchExamSchedule = async () => {
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

      const { user_id } = JSON.parse(userDetails);
      console.log('Fetching exam schedule for user ID:', user_id);

      const response = await axios({
        method: 'post',
        url: 'https://bansal.steponetechnologies.com/bansalProject/appApi/getStudentExamSchedule/',
        data: {
          student_id: user_id.toString()
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        timeout: 10000
      });

      // Handle the case when no exam data exists
      if (!response.data) {
        setExamData([]);
        setError('No exam schedule available for this student');
        setLoading(false);
        return;
      }

      if (response.data.statusCode === "01") {
        if (Array.isArray(response.data.data) && response.data.data.length > 0) {
          // Group exams by exam type
          const groupedExams = response.data.data.reduce((acc, exam) => {
            if (!acc[exam.exam_type]) {
              acc[exam.exam_type] = {
                id: exam.exam_type_id,
                exam_type: exam.exam_type,
                category_name: exam.category_name || 'General',
                subjects: []
              };
            }
            acc[exam.exam_type].subjects.push({
              subject_id: exam.subject_id,
              subject_name: exam.subject_name,
              date: exam.exam_date,
              time: exam.exam_time,
              total_marks: exam.total_marks,
              passing_marks: exam.passing_marks
            });
            return acc;
          }, {});

          setExamData(Object.values(groupedExams));
        } else {
          setExamData([]);
          setError('No exam schedule available for this student');
        }
      } else {
        setExamData([]);
        setError('No exam schedule available');
      }
    } catch (err) {
      console.error('Error fetching exam schedule:', err);
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        
        // Check if the error is about missing exam data
        if (err.response.data && typeof err.response.data === 'string' && 
            err.response.data.includes('ExaminationModel matching query does not exist')) {
          setError('No exam schedule available for this student');
        } else {
          setError('Failed to fetch exam schedule');
        }
      } else {
        setError('Failed to fetch exam schedule');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSubjectDetails = async (subjectId, examTypeId) => {
    try {
      setLoadingDetails(true);
      
      // Get user ID from AsyncStorage
      const userDetails = await AsyncStorage.getItem('userDetails');
      if (!userDetails) {
        throw new Error('User details not found');
      }

      const { user_id } = JSON.parse(userDetails);

      const response = await axios.post(
        'https://bansal.steponetechnologies.com/bansalProject/appApi/getStudentExamSchedule/',
        {
          student_id: user_id.toString()
        }
      );

      if (response.data.statusCode === "01") {
        const subjectData = response.data.data.find(
          exam => exam.subject_id === subjectId && exam.exam_type_id === examTypeId
        );

        if (subjectData) {
          setSubjectDetails({
            school_name: subjectData.school_name,
            class_name: subjectData.class_name,
            section_name: subjectData.section_name,
            exam_type: subjectData.exam_type,
            remark: subjectData.remarks,
            attachment: subjectData.attachment
          });
        } else {
          Alert.alert('Info', 'No additional details found for this subject');
        }
      }
    } catch (err) {
      console.error('Error fetching subject details:', err);
      Alert.alert('Error', 'Failed to load subject details');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchExamSchedule();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExamSchedule();
  }, []);

  const handleSubjectClick = async (subject, exam) => {
    try {
      setSelectedSubject(subject);
      await fetchSubjectDetails(subject.subject_id, exam.id);
      setSubjectModalVisible(true);
    } catch (err) {
      console.error('Error in handleSubjectClick:', err);
      Alert.alert('Error', 'Failed to load subject details');
    }
  };

  const handleOpenAttachment = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Could not open the attachment');
    }
  };

  const toggleCategory = (examType) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory(expandedCategory === examType ? null : examType);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Exam Schedule" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5F83C7" />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <Header title="Exam Schedule" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchExamSchedule}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Exam Schedule" />
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5F83C7']}
            tintColor="#5F83C7"
          />
        }
      >
        {examData.length > 0 ? (
          examData.map((exam) => (
            <View key={`exam-${exam.id}`} style={styles.examContainer}>
              <TouchableOpacity
                onPress={() => toggleCategory(exam.exam_type)}
                style={styles.examHeader}
              >
                <View style={styles.examHeaderContent}>
                  <Text style={styles.examType}>{exam.exam_type}</Text>
                  <Text style={styles.examCategory}>{exam.category_name}</Text>
                </View>
                <Text style={styles.toggleIcon}>
                  {expandedCategory === exam.exam_type ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {expandedCategory === exam.exam_type && (
                <View style={styles.subjectsContainer}>
                  {exam.subjects.map((subject, index) => (
                    <TouchableOpacity
                      key={`subject-${exam.id}-${subject.subject_id}`}
                      style={styles.subjectCard}
                      onPress={() => handleSubjectClick(subject, exam)}
                    >
                      <View style={styles.subjectInfo}>
                        <Text style={styles.subjectName}>{subject.subject_name}</Text>
                        <Text style={styles.subjectDateTime}>
                          {subject.date} at {subject.time}
                        </Text>
                        <Text style={styles.marksText}>
                          Marks: {subject.passing_marks}/{subject.total_marks}
                        </Text>
                      </View>
                      <Text style={styles.viewDetails}>View Details</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No exam schedule available</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={subjectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSubjectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.modalTitle}>{selectedSubject?.subject_name}</Text>
              
              <View style={styles.modalDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>School:</Text>
                  <Text style={styles.detailValue}>{subjectDetails?.school_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Class:</Text>
                  <Text style={styles.detailValue}>{subjectDetails?.class_name} - {subjectDetails?.section_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Exam:</Text>
                  <Text style={styles.detailValue}>{subjectDetails?.exam_type}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{selectedSubject?.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>{selectedSubject?.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Marks:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSubject?.passing_marks}/{selectedSubject?.total_marks}
                  </Text>
                </View>
                {subjectDetails?.remark && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notes:</Text>
                    <Text style={styles.detailValue}>{subjectDetails.remark}</Text>
                  </View>
                )}
              </View>

              {subjectDetails?.attachment?.image_url && (
                <TouchableOpacity
                  style={styles.attachmentButton}
                  onPress={() => handleOpenAttachment(subjectDetails.attachment.image_url)}
                >
                  <Text style={styles.attachmentButtonText}>View Attachment</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSubjectModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ExaminationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  scrollView: {
    flex: 1,
    padding: 8,
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
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#5F83C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  examContainer: {
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    overflow: 'hidden',
    elevation: 2,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#5F83C7',
    padding: 12,
  },
  examHeaderContent: {
    flex: 1,
  },
  examType: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  examCategory: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
  toggleIcon: {
    color: '#fff',
    fontSize: 14,
  },
  subjectsContainer: {
    padding: 12,
  },
  subjectCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  subjectDateTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  marksText: {
    fontSize: 12,
    color: '#5F83C7',
    marginTop: 4,
    fontWeight: '500',
  },
  viewDetails: {
    color: '#5F83C7',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  modalScrollView: {
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDetails: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  attachmentButton: {
    backgroundColor: '#5F83C7',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  attachmentButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
