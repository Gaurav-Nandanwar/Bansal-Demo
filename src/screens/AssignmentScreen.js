import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment';

const AssignmentScreen = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [uniqueSubjects, setUniqueSubjects] = useState([]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    // Extract unique subjects from assignments
    const subjects = [...new Set(assignments.map(assignment => ({
      id: assignment.subject_id,
      name: assignment.subject_name
    })))].filter((subject, index, self) =>
      index === self.findIndex((s) => s.id === subject.id)
    );
    setUniqueSubjects(subjects);
  }, [assignments]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const schoolId = await AsyncStorage.getItem('school_id');
      const staffId = await AsyncStorage.getItem('staff_id');

      if (!schoolId || !staffId) {
        setError('School ID or Staff ID not found');
        return;
      }

      const response = await axios.get('https://api.stpl.cloud/assignment/get/');
      
      if (response.data) {
        setAssignments(response.data);
      }
    } catch (err) {
      setError('Failed to fetch assignments');
      console.error('Assignment fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAssignments = () => {
    let filtered = assignments;

    if (searchQuery) {
      filtered = filtered.filter(assignment =>
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.class_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedClass) {
      filtered = filtered.filter(assignment => 
        assignment.class_id === selectedClass
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter(assignment => 
        assignment.subject_id === selectedSubject
      );
    }

    return filtered;
  };

  // Helper to filter out duplicate assignments by id
  const getUniqueAssignments = () => {
    const seen = new Set();
    return getFilteredAssignments().filter(item => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const renderAssignmentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.assignmentCard}
      onPress={() => {
        setSelectedAssignment(item);
        setShowDetailsModal(true);
      }}
    >
      <        View style={styles.assignmentHeader}>
        <View style={styles.subjectBadge}>
          <Text style={styles.subjectText}>{item.subject_name}</Text>
        </View>
        <Text style={styles.dueDate}>
          Due: {moment(item.due_date).format('DD MMM YYYY')}
        </Text>
      </View>

      <Text style={styles.assignmentTitle}>{item.title}</Text>
      
      <View style={styles.classInfoContainer}>
        <View style={styles.classBadge}>
          <Text style={styles.classText}>{item.class_name}</Text>
        </View>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionText}>{item.section_name}</Text>
        </View>
      </View>

      <View style={styles.marksContainer}>
        <View style={styles.marksItem}>
          <Text style={styles.marksLabel}>Total Marks</Text>
          <Text style={styles.marksValue}>{item.total_marks}</Text>
        </View>
        <View style={styles.marksItem}>
          <Text style={styles.marksLabel}>Passing Marks</Text>
          <Text style={styles.marksValue}>{item.passing_marks}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowDetailsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assignment Details</Text>
            <TouchableOpacity 
              onPress={() => setShowDetailsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close-circle" size={28} color="#5F83C7" />
            </TouchableOpacity>
          </View>

          {selectedAssignment && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Title</Text>
                <Text style={styles.detailValue}>{selectedAssignment.title}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{selectedAssignment.description}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Class & Section</Text>
                <Text style={styles.detailValue}>
                  {selectedAssignment.class_name} - {selectedAssignment.section_name}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Subject</Text>
                <Text style={styles.detailValue}>{selectedAssignment.subject_name}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Due Date</Text>
                <Text style={styles.detailValue}>
                  {moment(selectedAssignment.due_date).format('DD MMMM YYYY')}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Marks</Text>
                <View style={styles.marksDetailContainer}>
                  <Text style={styles.marksDetailText}>
                    Total: {selectedAssignment.total_marks}
                  </Text>
                  <Text style={styles.marksDetailText}>
                    Passing: {selectedAssignment.passing_marks}
                  </Text>
                </View>
              </View>

              {selectedAssignment.attachment && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Attachment</Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(selectedAssignment.attachment.image_url)}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={{ uri: selectedAssignment.attachment.image_url }}
                      style={styles.attachmentImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by Subject</Text>
            <TouchableOpacity 
              onPress={() => setFilterModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close-circle" size={24} color="#5F83C7" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterList}>
            <TouchableOpacity
              key="all-subjects"
              style={[
                styles.filterItem,
                !selectedSubject && styles.selectedFilterItem
              ]}
              onPress={() => {
                setSelectedSubject(null);
                setFilterModalVisible(false);
              }}
            >
              <Text style={[
                styles.filterItemText,
                !selectedSubject && styles.selectedFilterItemText
              ]}>All Subjects</Text>
            </TouchableOpacity>

            {uniqueSubjects.map((subject, idx) => (
              <TouchableOpacity
                key={
                  subject.id && uniqueSubjects.filter(s => s.id === subject.id).length === 1
                    ? `subject-${subject.id}`
                    : `subject-noid-${idx}`
                }
                style={[
                  styles.filterItem,
                  selectedSubject === subject.id && styles.selectedFilterItem
                ]}
                onPress={() => {
                  setSelectedSubject(subject.id);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={[
                  styles.filterItemText,
                  selectedSubject === subject.id && styles.selectedFilterItemText
                ]}>{subject.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5F83C7" />
          <Text style={styles.loadingText}>Loading assignments...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAssignments}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      {/* <View style={styles.headerContainer}>
        <Text style={styles.header}>Assignments</Text>
      </View> */}

      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search assignments..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter-outline" size={20} color="#5F83C7" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={getUniqueAssignments()}
        keyExtractor={(item, idx) => item.id ? `assignment-${item.id}` : `assignment-noid-${idx}`}
        renderItem={renderAssignmentItem}
        contentContainerStyle={styles.assignmentList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No assignments found</Text>
          </View>
        }
      />

      {renderDetailsModal()}
      {renderFilterModal()}
    </View>
  );
};

export default AssignmentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    padding: 4,
    backgroundColor: '#5F83C7',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  header: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 4,
    gap: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 4,
    fontSize: 10,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  assignmentList: {
    padding: 4,
  },
  assignmentCard: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectBadge: {
    backgroundColor: '#e6f3f3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  subjectText: {
    fontSize: 10,
    color: '#5F83C7',
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 8,
    color: '#666',
  },
  assignmentTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  classInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  classBadge: {
    backgroundColor: '#f0f7f7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 2,
  },
  classText: {
    fontSize: 8,
    color: '#5F83C7',
    fontWeight: '500',
  },
  sectionBadge: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  sectionText: {
    fontSize: 8,
    color: '#666',
  },
  marksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 4,
    borderRadius: 3,
  },
  marksItem: {
    alignItems: 'center',
  },
  marksLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 1,
  },
  marksValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5F83C7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    width: '90%',
    maxHeight: '80%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5F83C7',
  },
  closeButton: {
    padding: 2,
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
  },
  modalBody: {
    maxHeight: '80%',
  },
  detailSection: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  marksDetailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 4,
    borderRadius: 3,
  },
  marksDetailText: {
    fontSize: 10,
    color: '#5F83C7',
    fontWeight: '600',
  },
  attachmentImage: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 4,
    fontSize: 10,
    color: '#5F83C7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
  },
  errorText: {
    marginTop: 4,
    fontSize: 10,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#5F83C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 3,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  emptyText: {
    marginTop: 4,
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  filterList: {
    maxHeight: '80%',
  },
  filterItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedFilterItem: {
    backgroundColor: '#e6f3f3',
  },
  filterItemText: {
    fontSize: 12,
    color: '#333',
  },
  selectedFilterItemText: {
    color: '#5F83C7',
    fontWeight: '600',
  },
}); 