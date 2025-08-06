import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, ActivityIndicator, Alert } from 'react-native';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const ExamWise_Attendance = () => {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedExamType, setSelectedExamType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showExamTypeModal, setShowExamTypeModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schoolId, setSchoolId] = useState(null);
  const [staffId, setStaffId] = useState(null);
  const [submittingAttendance, setSubmittingAttendance] = useState({});
  const [getApiData, setGetApiData] = useState(null);

  useEffect(() => {
    (async () => {
      const sId = await AsyncStorage.getItem('school_id');
      const stId = await AsyncStorage.getItem('staff_id');
      setSchoolId(sId);
      setStaffId(stId);
      fetchClasses(sId);
      fetchExamTypes(sId);
      fetchSessions();
    })();
  }, []);

  // Reset attendanceData when key filters change
  useEffect(() => {
    setAttendanceData({});
  }, [selectedClass, selectedSection, selectedSubject, selectedExamType, selectedSession, selectedDate]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('https://api.stpl.cloud/session/');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessions(data);
      } else {
        setSessions([]);
        setError('No sessions found.');
      }
    } catch (e) {
      setError('Failed to load sessions.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (school_id) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`https://api.stpl.cloud/class_teacher/get_class_teachers/?school_id=${school_id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const uniqueClasses = [];
        const seen = new Set();
        data.forEach(item => {
          if (!seen.has(item.class_id)) {
            seen.add(item.class_id);
            uniqueClasses.push(item);
          }
        });
        setClasses(uniqueClasses);
      } else {
        setClasses([]);
        setError('No classes found.');
      }
    } catch (e) {
      setError('Failed to load classes.');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (class_id) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`https://api.stpl.cloud/class_teacher/get_class_teachers/?school_id=${schoolId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const filtered = data.filter(item => item.class_id === class_id);
        setSections(filtered);
      } else {
        setSections([]);
        setError('No sections found.');
      }
    } catch (e) {
      setError('Failed to load sections.');
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (class_id, section_id) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`https://api.stpl.cloud/class_wise_subject/get_class_wise_subject/?school_id=${schoolId}&class_id=${class_id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSubjects(data);
      } else {
        setSubjects([]);
        setError('No subjects found.');
      }
    } catch (e) {
      setError('Failed to load subjects.');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamTypes = async (school_id) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`https://api.stpl.cloud/exam/type/get/?school_id=${school_id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setExamTypes(data);
      } else {
        setExamTypes([]);
        setError('No exam types found.');
      }
    } catch (e) {
      setError('Failed to load exam types.');
      setExamTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (class_id, section_id, subject_id) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`https://api.stpl.cloud/student/get-student/?school_id=${schoolId}&class_id=${class_id}`);
      const data = await res.json();
      if (data && data.students && Array.isArray(data.students)) {
        let filtered = data.students;
        if (section_id) filtered = filtered.filter(s => s.section_id === section_id);
        setStudents(filtered);
      } else {
        setStudents([]);
        setError('No students found.');
      }
    } catch (e) {
      setError('Failed to load students.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students when class, section, and subject are selected
  useEffect(() => {
    if (selectedClass && selectedSection && selectedSubject) {
      fetchStudents(selectedClass.class_id, selectedSection.section_id, selectedSubject.subject_id);
    } else {
      setStudents([]); // Clear students if any filter is missing
    }
  }, [selectedClass, selectedSection, selectedSubject]);

  // Fetch attendance when all filters and date are selected
  useEffect(() => {
    if (schoolId && selectedClass && selectedSection && selectedSubject && selectedExamType && selectedSession && selectedDate) {
      fetchExamWiseAttendance();
    } else {
      setGetApiData(null); // Clear attendance data if any filter is missing
    }
  }, [schoolId, selectedClass, selectedSection, selectedSubject, selectedExamType, selectedSession, selectedDate]);

  const statusOptions = [
    { key: 1, label: 'Present', color: '#28a745' },
    { key: 2, label: 'Absent', color: '#dc3545' },
  ];

  const setStudentStatus = (student_id, status_id) => {
    setSubmittingAttendance(prev => ({
      ...prev,
      [student_id]: true
    }));

    setAttendanceData(prev => {
      if (prev[student_id] === status_id) {
        const updated = { ...prev };
        delete updated[student_id];
        return updated;
      } else {
        return { ...prev, [student_id]: status_id };
      }
    });

    setTimeout(() => {
      setSubmittingAttendance(prev => ({
        ...prev,
        [student_id]: false
      }));
    }, 500);
  };

  const submitAttendance = async () => {
    if (!selectedSession || !selectedClass || !selectedSection || !selectedSubject || !selectedExamType) {
      Alert.alert('Error', 'Please select all dropdowns.');
      return;
    }
    if (Object.keys(attendanceData).length === 0) {
      Alert.alert('Error', 'Please mark attendance for at least one student.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const payload = {
        school_id: Number(schoolId),
        class_id: selectedClass.class_id,
        section_id: selectedSection.section_id,
        subject_id: selectedSubject.subject_id,
        exam_type_id: selectedExamType.id,
        session_id: selectedSession.id,
        date: dateStr,
        staff_id: Number(staffId),
        student_id: Object.keys(attendanceData).map(Number),
        attendance_status_id: Object.values(attendanceData),
      };
      console.log('Submitting payload:', payload);
      const res = await fetch('https://api.stpl.cloud/exam_wise_attendance/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let resultText = await res.text();
      let result;
      try {
        result = JSON.parse(resultText);
      } catch (err) {
        result = { message: resultText };
      }
      console.log('API response:', result);
      if (res.ok) {
        Alert.alert('Success', result.message || 'Attendance submitted successfully!');
        setAttendanceData({});
      } else {
        setError(result.message || 'Failed to submit attendance.');
        Alert.alert('Error', result.message || 'Failed to submit attendance.');
      }
    } catch (e) {
      setError('Failed to submit attendance. ' + (e?.message || ''));
      Alert.alert('Error', 'Failed to submit attendance. ' + (e?.message || ''));
      console.log('API error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamWiseAttendance = async () => {
    if (!schoolId) {
      Alert.alert('Error', 'School ID not found.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      let url = `https://api.stpl.cloud/exam_wise_attendance/?school_id=${schoolId}&class_id=${selectedClass.class_id}&section_id=${selectedSection.section_id}&subject_id=${selectedSubject.subject_id}&exam_type_id=${selectedExamType.id}&session_id=${selectedSession.id}&date=${dateStr}`;
      console.log('Fetching GET API:', url);
      const res = await fetch(url);
      let resultText = await res.text();
      let result;
      try {
        result = JSON.parse(resultText);
      } catch (err) {
        result = { message: resultText };
      }
      setGetApiData(result);
      if (Array.isArray(result) && result.length > 0) {
        let match = result[0]; // Assuming the API returns a single record for the specific filters
        if (match && Array.isArray(match.students)) {
          const prefill = {};
          match.students.forEach(s => {
            prefill[s.student_id] = s.attendance_status_id;
          });
          setAttendanceData(prefill);
          setError('');
          console.log('Attendance matched for date and filters:', match.date, match);
        } else {
          setError('No attendance found for selected filters and date.');
          console.log('No attendance found for selected filters and date.');
        }
      } else {
        setError('No attendance data found for this school.');
        console.log('No attendance data found for this school.');
      }
      console.log('GET API response:', result);
    } catch (e) {
      setError('Failed to fetch exam-wise attendance. ' + (e?.message || ''));
      setGetApiData({ error: e?.message || 'Unknown error' });
      console.log('GET API error:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderModal = (visible, setVisible, data, onSelect, labelKey, valueKey) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select {labelKey.split('_').join(' ')}</Text>
          <FlatList
            data={data}
            keyExtractor={item => (item && item[valueKey] != null ? item[valueKey].toString() : Math.random().toString())}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item); setVisible(false); }}>
                <Text style={styles.modalItemText}>{item[labelKey]}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No options available</Text>}
          />
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setVisible(false)}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderStudentItem = ({ item }) => {
    const currentStatus = attendanceData[item.student_id];
    const isSubmitting = submittingAttendance[item.student_id];

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <Ionicons name="person-circle-outline" size={20} color="#007bff" />
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{item.studentname || item.student_name}</Text>
            <Text style={styles.studentRoll}>Roll No: {item.rollno || item.student_id}</Text>
          </View>
        </View>
        <View style={styles.attendanceButtons}>
          {statusOptions.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.attendanceButton,
                currentStatus === opt.key
                  ? opt.label === 'Present' ? styles.activePresentButton : styles.activeAbsentButton
                  : opt.label === 'Present' ? styles.inactivePresentButton : styles.inactiveAbsentButton,
                isSubmitting && styles.disabledButton
              ]}
              onPress={() => setStudentStatus(item.student_id, opt.key)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={currentStatus === opt.key ? '#fff' : opt.color} />
              ) : (
                <Ionicons
                  name={opt.label === 'Present' ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={currentStatus === opt.key ? '#fff' : opt.color}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Exam Attendance</Text>
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowSessionModal(true)}
            >
              <Ionicons name="time-outline" size={10} color="#007bff" />
              <Text style={styles.dropdownText}>
                {selectedSession ? selectedSession.session : 'Select Session'}
              </Text>
              <Ionicons name="chevron-down" size={10} color="#007bff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowClassModal(true)}
            >
              <Ionicons name="school-outline" size={10} color="#007bff" />
              <Text style={styles.dropdownText}>
                {selectedClass ? `Class ${selectedClass.class_name}` : 'Select Class'}
              </Text>
              <Ionicons name="chevron-down" size={10} color="#007bff" />
            </TouchableOpacity>
          </View>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                if (selectedClass) {
                  fetchSections(selectedClass.class_id);
                  setShowSectionModal(true);
                } else {
                  Alert.alert('Error', 'Please select a class first.');
                }
              }}
            >
              <Ionicons name="layers-outline" size={10} color="#007bff" />
              <Text style={styles.dropdownText}>
                {selectedSection ? selectedSection.section_name : 'Select Section'}
              </Text>
              <Ionicons name="chevron-down" size={10} color="#007bff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                if (selectedClass && selectedSection) {
                  fetchSubjects(selectedClass.class_id, selectedSection.section_id);
                  setShowSubjectModal(true);
                } else {
                  Alert.alert('Error', 'Please select both class and section first.');
                }
              }}
            >
              <Ionicons name="book-outline" size={10} color="#007bff" />
              <Text style={styles.dropdownText}>
                {selectedSubject ? selectedSubject.subject_name : 'Select Subject'}
              </Text>
              <Ionicons name="chevron-down" size={10} color="#007bff" />
            </TouchableOpacity>
          </View>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowExamTypeModal(true)}
            >
              <Ionicons name="medal-outline" size={10} color="#007bff" />
              <Text style={styles.dropdownText}>
                {selectedExamType ? selectedExamType.exam_type : 'Select Exam'}
              </Text>
              <Ionicons name="chevron-down" size={10} color="#007bff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dropdown, styles.datePicker]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={10} color="#007bff" />
              <Text style={styles.dropdownText}>
                {selectedDate.toLocaleDateString()}
              </Text>
              <Ionicons name="chevron-down" size={10} color="#007bff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007bff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => item.student_id.toString()}
          renderItem={renderStudentItem}
          contentContainerStyle={styles.studentList}
          ListEmptyComponent={<Text style={styles.emptyText}>No students found</Text>}
        />
      )}

      <TouchableOpacity style={styles.submitButton} onPress={submitAttendance}>
        <Ionicons name="checkmark-done" size={12} color="#fff" />
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>

      {renderModal(
        showSessionModal,
        setShowSessionModal,
        sessions,
        (item) => setSelectedSession(item),
        'session',
        'id'
      )}
      {renderModal(
        showClassModal,
        setShowClassModal,
        classes,
        (item) => {
          setSelectedClass(item);
          setSelectedSection(null);
          setSelectedSubject(null);
          setStudents([]);
        },
        'class_name',
        'class_id'
      )}
      {renderModal(
        showSectionModal,
        setShowSectionModal,
        sections,
        (item) => {
          setSelectedSection(item);
          setSelectedSubject(null);
          setStudents([]);
        },
        'section_name',
        'section_id'
      )}
      {renderModal(
        showSubjectModal,
        setShowSubjectModal,
        subjects,
        (item) => {
          setSelectedSubject(item);
          setShowSubjectModal(false);
        },
        'subject_name',
        'subject_id'
      )}
      {renderModal(
        showExamTypeModal,
        setShowExamTypeModal,
        examTypes,
        (item) => setSelectedExamType(item),
        'exam_type',
        'id'
      )}
    </View>
  );
};

export default ExamWise_Attendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerCard: {
    backgroundColor: '#fff',
    margin: 8,
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 130,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  filterContainer: {
    gap: 4,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f4f8',
    padding: 6,
    borderRadius: 6,
    gap: 4,
  },
  datePicker: {
    flex: 1,
    alignSelf: 'center',
  },
  dropdownText: {
    flex: 1,
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
  },
  studentList: {
    padding: 8,
    paddingBottom: 50,
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentDetails: {
    flex: 1,
    marginLeft: 4,
  },
  studentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  studentRoll: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  attendanceButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
  },
  activePresentButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  inactivePresentButton: {
    backgroundColor: '#fff',
    borderColor: '#4CAF50',
  },
  activeAbsentButton: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  inactiveAbsentButton: {
    backgroundColor: '#fff',
    borderColor: '#F44336',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#5F83C7",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
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
    padding: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 10,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 8,
    padding: 6,
    backgroundColor: '#f1f4f8',
    borderRadius: 6,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 10,
    color: '#007bff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 6,
    fontSize: 10,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  errorText: {
    fontSize: 10,
    color: '#dc3545',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});