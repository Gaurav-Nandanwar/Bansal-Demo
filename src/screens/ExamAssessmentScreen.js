import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  SectionList,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'https://api.stpl.cloud/exam/assessment/get/';
const { width } = Dimensions.get('window');

const getMarkBadgeColor = (marks) => {
  if (marks >= 90) return '#FFD700'; // Gold
  if (marks >= 40) return '#4CAF50'; // Green
  return '#F44336'; // Red
};
const getRemarkColor = (remark) => {
  if (remark.toLowerCase() === 'pass') return '#4CAF50';
  if (remark.toLowerCase() === 'fail') return '#F44336';
  return '#FFA500';
};

const SCALE = 0.7; // 30% reduction

const ExamAssessmentScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sections, setSections] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [subjectList, setSubjectList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const school_id = await AsyncStorage.getItem('school_id');
        const student_id = await AsyncStorage.getItem('student_id');
        setSchoolId(school_id);
        setStudentId(student_id);
        if (!school_id) throw new Error('School ID not found');
        const response = await fetch(`${API_URL}?school_id=${school_id}`);
        const data = await response.json();
        // Only keep exams where this student appears
        const filtered = data
          .map((exam) => ({
            ...exam,
            students: exam.students.filter(
              (stu) => !student_id || String(stu.student_id) === String(student_id)
            ),
          }))
          .filter((exam) => exam.students.length > 0);
        // Group by subject
        const subjectMap = {};
        filtered.forEach((exam) => {
          if (!subjectMap[exam.subject_name]) {
            subjectMap[exam.subject_name] = [];
          }
          subjectMap[exam.subject_name].push(exam);
        });
        const sectionData = Object.keys(subjectMap).map((subject) => ({
          title: subject,
          data: subjectMap[subject],
        }));
        setAllSections(sectionData);
        setSections(sectionData);
        setSubjectList(['All', ...Object.keys(subjectMap)]);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch exam assessments');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter sections by subject and search query
  useEffect(() => {
    let filteredSections = allSections;
    if (subjectFilter !== 'All') {
      filteredSections = filteredSections.filter((sec) => sec.title === subjectFilter);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      filteredSections = filteredSections
        .map((section) => ({
          ...section,
          data: section.data.map((exam) => ({
            ...exam,
            students: exam.students.filter(
              (stu) =>
                stu.student_name.toLowerCase().includes(q) ||
                (stu.roll_no && String(stu.roll_no).toLowerCase().includes(q))
            ),
          })).filter((exam) => exam.students.length > 0),
        }))
        .filter((section) => section.data.length > 0);
    }
    setSections(filteredSections);
  }, [subjectFilter, allSections, searchQuery]);

  const openImage = (url) => {
    setSelectedImage(url);
    setShowImageModal(true);
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.subjectHeader}>
      <Ionicons name="book" size={22 * SCALE} color="#fff" style={{ marginRight: 8 * SCALE }} />
      <Text style={styles.subjectHeaderText}>{title}</Text>
    </View>
  );

  const renderExamCard = ({ item }) => (
    <View style={styles.examCardShadow}>
      <View style={styles.examCard}>
        <View style={styles.examInfoRow}>
          <Ionicons name="medal-outline" size={18 * SCALE} color="#5F83C7" />
          <Text style={styles.examTypeText}>{item.exam_type}</Text>
          <Ionicons name="calendar-outline" size={16 * SCALE} color="#5F83C7" style={{ marginLeft: 10 * SCALE }} />
          <Text style={styles.examDateText}>{item.date_created}</Text>
        </View>
        <View style={styles.examDetailsRow}>
          <Ionicons name="school-outline" size={16 * SCALE} color="#5F83C7" />
          <Text style={styles.examDetailsText}>Class: {item.class_name}</Text>
          <Ionicons name="people-outline" size={16 * SCALE} color="#5F83C7" style={{ marginLeft: 10 * SCALE }} />
          <Text style={styles.examDetailsText}>Section: {item.section_name}</Text>
        </View>
        <View style={styles.divider} />
        {item.students.map((stu) => (
          <View key={stu.student_id} style={styles.studentRow}>
            <View style={styles.studentInfoWrap}>
              <Ionicons name="person" size={18 * SCALE} color="#5F83C7" style={{ marginRight: 4 * SCALE }} />
              <Text style={styles.studentName}>{stu.student_name}</Text>
            </View>
            <View style={styles.marksCircleWrap}>
              <View style={[styles.marksCircle, { backgroundColor: getMarkBadgeColor(stu.marks) }]}> 
                <Text style={styles.marksCircleText}>{stu.marks}</Text>
              </View>
              <View style={[styles.remarkChip, { backgroundColor: getRemarkColor(stu.remark) }]}> 
                <Text style={styles.remarkChipText}>{stu.remark}</Text>
              </View>
            </View>
                  {stu.answersheet_image && stu.answersheet_image.image_url ? (
                    <TouchableOpacity
                      style={styles.attachmentButton}
                      onPress={() => openImage(stu.answersheet_image.image_url)}
                    >
                      <Image
                        source={{ uri: stu.answersheet_image.image_url }}
                        style={styles.attachmentImage}
                        resizeMode="cover"
                      />
                      <Ionicons name="expand" size={18 * SCALE} color="#5F83C7" style={styles.zoomIcon} />
                    </TouchableOpacity>
                  ) : null}
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5F83C7" />
          <Text style={styles.loadingText}>Loading assessments...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48 * SCALE} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      {/* <Text style={styles.screenTitle}>Exam Assessments</Text> */}
      <View style={styles.filterSearchRow}>
        <View style={styles.searchBarWrap}>
          <Ionicons name="search" size={16 * SCALE} color="#5F83C7" style={{ marginLeft: 6 * SCALE, marginRight: 2 * SCALE }} />
          <TextInput
            style={styles.searchBar}
            placeholder="Search students..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <View style={styles.pickerWrapCompact}>
          <View style={styles.pickerOverlayBox}>
            <Text style={styles.pickerOverlayText}>{subjectFilter}</Text>
            <Picker
              selectedValue={subjectFilter}
              style={[styles.pickerCompact, { opacity: 0, position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }]}
              onValueChange={(itemValue) => setSubjectFilter(itemValue)}
              mode={Platform.OS === 'ios' ? 'dropdown' : 'dialog'}
              dropdownIconColor="#5F83C7"
            >
              {subjectList.map((subject) => (
                <Picker.Item
                  label={subject}
                  value={subject}
                  key={subject}
                />
              ))}
            </Picker>
          </View>
        </View>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderExamCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No assessments found for your student ID.</Text>}
        stickySectionHeadersEnabled={false}
      />
      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalImageContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowImageModal(false)}>
              <Ionicons name="close-circle" size={32 * SCALE} color="#5F83C7" />
            </TouchableOpacity>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ExamAssessmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  screenTitle: {
    fontSize: 22 * SCALE,
    fontWeight: 'bold',
    color: '#5F83C7',
    textAlign: 'center',
    marginVertical: 16 * SCALE,
    letterSpacing: 1,
  },
  filterSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10 * SCALE,
    marginBottom: 0.2 * SCALE,
    marginTop: 2 * SCALE,
    marginTop:10
  },
  searchBarWrap: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8 * SCALE,
    borderWidth: 1,
    borderColor: '#5F83C7',
    marginRight: 6 * SCALE,
    height: 42 * SCALE,
    paddingRight: 4 * SCALE,
  },
  searchBar: {
    flex: 1,
    fontSize: 13 * SCALE,
    color: '#005566',
    paddingVertical: 0,
    paddingHorizontal: 4 * SCALE,
    height: 42 * SCALE,
  },
  pickerWrapCompact: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#5F83C7',
    borderRadius: 8 * SCALE,
    backgroundColor: '#fff',
    overflow: 'hidden',
    height: 42 * SCALE,
    justifyContent: 'center',
    position: 'relative',
  },
  pickerOverlayBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
    height: 42 * SCALE,
  },
  pickerOverlayText: {
    position: 'absolute',
    left: 12 * SCALE,
    top: 0,
    bottom: 0,
    color: '#5F83C7',
    fontWeight: 'bold',
    fontSize: 13 * SCALE,
    textAlignVertical: 'center',
    zIndex: 1,
    lineHeight: 42 * SCALE,
  },
  pickerCompact: {
    height: 42 * SCALE,
    fontSize: 13 * SCALE,
    color: '#005566',
    width: '100%',
  },
  listContainer: {
    padding: 10 * SCALE,
    paddingBottom: 30 * SCALE,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5F83C7',
    borderRadius: 14 * SCALE,
    paddingVertical: 12 * SCALE,
    paddingHorizontal: 18 * SCALE,
    marginBottom: 8 * SCALE,
    marginTop: 18 * SCALE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4 * SCALE,
    elevation: 2,
  },
  subjectHeaderText: {
    color: '#fff',
    fontSize: 18 * SCALE,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  examCardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6 * SCALE,
    elevation: 3,
    borderRadius: 16 * SCALE,
    marginBottom: 18 * SCALE,
    backgroundColor: 'transparent',
  },
  examCard: {
    backgroundColor: '#fff',
    borderRadius: 16 * SCALE,
    overflow: 'hidden',
    paddingBottom: 10 * SCALE,
    paddingTop: 8 * SCALE,
    paddingHorizontal: 10 * SCALE,
  },
  examInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4 * SCALE,
  },
  examTypeText: {
    color: '#5F83C7',
    fontWeight: 'bold',
    fontSize: 14 * SCALE,
    marginLeft: 4 * SCALE,
    marginRight: 10 * SCALE,
  },
  examDateText: {
    color: '#888',
    fontSize: 13 * SCALE,
    marginLeft: 4 * SCALE,
  },
  examDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4 * SCALE,
  },
  examDetailsText: {
    fontSize: 13 * SCALE,
    color: '#5F83C7',
    marginLeft: 4 * SCALE,
    marginRight: 8 * SCALE,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e6e6e6',
    marginVertical: 8 * SCALE,
    borderRadius: 1,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10 * SCALE,
    marginBottom: 8 * SCALE,
    marginTop: 2 * SCALE,
    paddingVertical: 10 * SCALE,
    paddingHorizontal: 8 * SCALE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2 * SCALE,
    elevation: 1,
  },
  studentInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentName: {
    color: '#005566',
    fontSize: 15 * SCALE,
    fontWeight: '600',
    marginLeft: 2 * SCALE,
  },
  marksCircleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10 * SCALE,
  },
  marksCircle: {
    width: 36 * SCALE,
    height: 36 * SCALE,
    borderRadius: 18 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8 * SCALE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2 * SCALE,
    elevation: 2,
  },
  marksCircleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15 * SCALE,
  },
  remarkChip: {
    borderRadius: 10 * SCALE,
    paddingHorizontal: 10 * SCALE,
    paddingVertical: 3 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remarkChipText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12 * SCALE,
    letterSpacing: 0.5,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f3f3',
    borderRadius: 8 * SCALE,
    padding: 4 * SCALE,
    marginLeft: 8 * SCALE,
    position: 'relative',
  },
  attachmentImage: {
    width: 38 * SCALE,
    height: 38 * SCALE,
    borderRadius: 6 * SCALE,
    marginRight: 2 * SCALE,
    borderWidth: 1,
    borderColor: '#5F83C7',
  },
  zoomIcon: {
    position: 'absolute',
    right: 4 * SCALE,
    bottom: 4 * SCALE,
    backgroundColor: '#fff',
    borderRadius: 10 * SCALE,
    padding: 1 * SCALE,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContent: {
    backgroundColor: '#fff',
    borderRadius: 14 * SCALE,
    padding: 10 * SCALE,
    alignItems: 'center',
    width: width * 0.9 * SCALE,
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 8 * SCALE,
  },
  fullImage: {
    width: width * 0.8 * SCALE,
    height: width * 1.1 * SCALE,
    borderRadius: 8 * SCALE,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 8 * SCALE,
    fontSize: 12 * SCALE,
    color: '#5F83C7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16 * SCALE,
  },
  errorText: {
    marginTop: 8 * SCALE,
    fontSize: 12 * SCALE,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 16 * SCALE,
  },
  emptyText: {
    marginTop: 20 * SCALE,
    fontSize: 14 * SCALE,
    color: '#888',
    textAlign: 'center',
  },
});