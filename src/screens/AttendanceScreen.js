import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AttendanceScreen = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showClassModal, setShowClassModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceData, setAttendanceData] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [classTeachers, setClassTeachers] = useState([]);
  const [loadingClassTeachers, setLoadingClassTeachers] = useState(true);
  const [errorClassTeachers, setErrorClassTeachers] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [errorStudents, setErrorStudents] = useState('');
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [errorAttendance, setErrorAttendance] = useState('');
  const [submittingAttendance, setSubmittingAttendance] = useState({});
  const [loggedInStaffId, setLoggedInStaffId] = useState(null);

  // Initialize component by restoring state from AsyncStorage
  useEffect(() => {
    const initialize = async () => {
      try {
        const school_id = await AsyncStorage.getItem('school_id');
        const staff_id = await AsyncStorage.getItem('staff_id');
        const storedClass = await AsyncStorage.getItem('selected_class');
        const storedDate = await AsyncStorage.getItem('selected_date');

        setLoggedInStaffId(staff_id);

        if (school_id) {
          await fetchClassTeachers(school_id);
        }

        if (storedClass) {
          const parsedClass = JSON.parse(storedClass);
          setSelectedClass(parsedClass);
          // Fetch students and attendance for the restored class
          if (parsedClass.class_id && parsedClass.section_id) {
            await fetchStudents(parsedClass.class_id, parsedClass.section_id);
            if (storedDate) {
              const parsedDate = new Date(storedDate);
              setSelectedDate(parsedDate);
              await fetchExistingAttendance(parsedClass.class_id, parsedClass.section_id, parsedDate);
            }
          }
        }
      } catch (err) {
        console.log('Error initializing component:', err);
      }
    };
    initialize();
  }, []);

  // Save selectedClass and selectedDate to AsyncStorage when they change
  useEffect(() => {
    const saveState = async () => {
      try {
        if (selectedClass) {
          await AsyncStorage.setItem('selected_class', JSON.stringify(selectedClass));
          console.log('Saved selected_class:', selectedClass);
        } else {
          await AsyncStorage.removeItem('selected_class');
        }
        await AsyncStorage.setItem('selected_date', selectedDate.toISOString());
        console.log('Saved selected_date:', selectedDate);
      } catch (err) {
        console.log('Error saving state to AsyncStorage:', err);
      }
    };
    saveState();
  }, [selectedClass, selectedDate]);

  // Fetch class teachers
  const fetchClassTeachers = async (school_id) => {
    try {
      setErrorClassTeachers('');
      setLoadingClassTeachers(true);
      const url = `https://api.stpl.cloud/class_teacher/get_class_teachers/?school_id=${school_id}`;
      const response = await fetch(url);
      const result = await response.json();
      if (Array.isArray(result)) {
        setClassTeachers(result);
      } else {
        setClassTeachers([]);
        setErrorClassTeachers('No class teachers found.');
      }
    } catch (err) {
      setClassTeachers([]);
      setErrorClassTeachers('Failed to load class teachers.');
    } finally {
      setLoadingClassTeachers(false);
    }
  };

  // Fetch students for selected class and section
  const fetchStudents = async (classId, sectionId) => {
    try {
      setErrorStudents('');
      setLoadingStudents(true);
      const school_id = await AsyncStorage.getItem('school_id');
      if (!school_id) {
        setStudents([]);
        setErrorStudents('Missing school_id. Please log in again.');
        setLoadingStudents(false);
        return;
      }
      const url = `https://api.stpl.cloud/student/get-student/?school_id=${school_id}&class_id=${classId}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result && result.students && Array.isArray(result.students)) {
        const filtered = sectionId
          ? result.students.filter(s => s.section_id === sectionId)
          : result.students;
        setStudents(filtered);
      } else {
        setStudents([]);
        setErrorStudents('No students found for this class and section.');
      }
    } catch (err) {
      setStudents([]);
      setErrorStudents('Failed to load students.');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch existing attendance for selected class, section, and date
  const fetchExistingAttendance = async (classId, sectionId, date) => {
    try {
      setErrorAttendance('');
      setLoadingAttendance(true);
      const school_id = await AsyncStorage.getItem('school_id');
      if (!school_id) {
        setExistingAttendance([]);
        setErrorAttendance('Missing school_id. Please log in again.');
        setLoadingAttendance(false);
        return;
      }
      const formattedDate = date.toLocaleDateString('en-GB').split('/').join('-');
      const url = `https://api.stpl.cloud/school_attendance/get_attendance/?school_id=${school_id}`;
      const response = await fetch(url);
      const result = await response.json();
      if (Array.isArray(result)) {
        const filteredAttendance = result.filter(attendance =>
          attendance.class_id === classId &&
          attendance.section_id === sectionId &&
          attendance.date === formattedDate
        );
        setExistingAttendance(filteredAttendance);
      } else {
        setExistingAttendance([]);
        setErrorAttendance('No attendance data found.');
      }
    } catch (err) {
      setExistingAttendance([]);
      setErrorAttendance('Failed to load attendance data.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Update attendance data when existing attendance is loaded
  useEffect(() => {
    if (existingAttendance.length > 0) {
      setAttendanceData(prevData => {
        const newData = { ...prevData };
        existingAttendance.forEach(attendance => {
          let status = 'present';
          if (attendance.attendance_status?.toLowerCase() === 'absent') {
            status = 'absent';
          } else if (attendance.attendance_status?.toLowerCase() === 'leave') {
            status = 'leave';
          }
          newData[attendance.student_id.toString()] = status;
        });
        console.log('Merged attendance data:', newData);
        return newData;
      });
    } else {
      setAttendanceData({});
    }
  }, [existingAttendance]);

  const updateAttendance = async (studentId, status) => {
    setSubmittingAttendance(prev => ({
      ...prev,
      [studentId]: true
    }));

    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));

    try {
      const school_id = await AsyncStorage.getItem('school_id');
      if (!school_id || !selectedClass) {
        console.log('Missing required data for attendance submission');
        Alert.alert('Error', 'Missing required data for attendance submission.');
        return;
      }

      const formattedDate = selectedDate.toLocaleDateString('en-GB').split('/').join('-');
      let attendanceStatusId;
      switch (status) {
        case 'present':
          attendanceStatusId = 1;
          break;
        case 'absent':
          attendanceStatusId = 2;
          break;
        case 'leave':
          attendanceStatusId = 3;
          break;
        default:
          attendanceStatusId = 1;
      }

      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const requestBody = {
        school_id: parseInt(school_id),
        class_id: selectedClass.class_id,
        section_id: selectedClass.section_id,
        student_id: [parseInt(studentId)],
        date: formattedDate,
        in_time: [currentTime],
        out_time: [currentTime],
        attendance_status_id: [attendanceStatusId]
      };

      let response;
      let result;
      let apiSuccess = false;
      const endpoints = [
        'https://api.stpl.cloud/school_attendance/create/',
        'https://api.stpl.cloud/school_attendance/',
        'https://api.stpl.cloud/attendance/create/',
        'https://api.stpl.cloud/attendance/',
        'https://api.stpl.cloud/student_attendance/create/',
        'https://api.stpl.cloud/student_attendance/'
      ];

      for (const endpoint of endpoints) {
        console.log(`Trying endpoint: ${endpoint}`);
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          console.log(`Endpoint ${endpoint} - Status: ${response.status}`);
          if (response.ok) {
            result = await response.json();
            apiSuccess = true;
            console.log(`Success with endpoint: ${endpoint}`);
            break;
          } else if (response.status === 405) {
            console.log(`Trying PUT method for ${endpoint}`);
            response = await fetch(endpoint, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody)
            });
            if (response.ok) {
              result = await response.json();
              apiSuccess = true;
              console.log(`Success with PUT method on endpoint: ${endpoint}`);
              break;
            }
          }
        } catch (endpointError) {
          console.log(`Error with endpoint ${endpoint}:`, endpointError);
          continue;
        }
      }

      if (apiSuccess && result) {
        console.log('Attendance submitted successfully:', result);
        // Refresh attendance to ensure UI reflects server state
        await fetchExistingAttendance(selectedClass.class_id, selectedClass.section_id, selectedDate);
      } else {
        console.log('Failed to submit attendance:', result);
        Alert.alert('Error', 'Failed to submit attendance. Please try again.');
      }
    } catch (error) {
      console.log('Error submitting attendance:', error);
      Alert.alert('Error', 'Failed to submit attendance. Please check your network and try again.');
    } finally {
      setSubmittingAttendance(prev => ({
        ...prev,
        [studentId]: false
      }));
    }
  };

  // Refresh attendance when class or date changes
  useEffect(() => {
    if (selectedClass && selectedDate) {
      fetchExistingAttendance(selectedClass.class_id, selectedClass.section_id, selectedDate);
    }
  }, [selectedClass, selectedDate]);

  const getAttendanceCounts = () => {
    if (!selectedClass) return { present: 0, absent: 0, leave: 0, total: 0 };

    const sectionFilteredStudents = selectedClass.section_id
      ? students.filter(student => student.section_id === selectedClass.section_id)
      : students;

    const counts = {
      present: 0,
      absent: 0,
      leave: 0,
      total: sectionFilteredStudents.length
    };

    Object.entries(attendanceData).forEach(([studentId, status]) => {
      if (sectionFilteredStudents.some(student => student.student_id.toString() === studentId)) {
        counts[status]++;
      }
    });

    return counts;
  };

  const renderStudentItem = ({ item }) => {
    const currentStatus = attendanceData[item.student_id.toString()];
    const isSubmitting = submittingAttendance[item.student_id.toString()];

    console.log(`Student ${item.studentname} (${item.student_id}): currentStatus = ${currentStatus}`);

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentCardContent}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.studentname}</Text>
            <Text style={styles.rollNumber}>Roll No: {item.rollno}</Text>
            {item.section_name && (
              <Text style={styles.sectionName}>Section: {item.section_name}</Text>
            )}
          </View>
          <View style={styles.attendanceButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.attendanceButton,
                currentStatus === 'present' ? styles.activePresentButton : styles.inactivePresentButton,
                isSubmitting && styles.disabledButton
              ]}
              onPress={() => updateAttendance(item.student_id.toString(), 'present')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={currentStatus === 'present' ? '#fff' : '#4CAF50'} />
              ) : (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={currentStatus === 'present' ? '#fff' : '#4CAF50'}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.attendanceButton,
                currentStatus === 'absent' ? styles.activeAbsentButton : styles.inactiveAbsentButton,
                isSubmitting && styles.disabledButton
              ]}
              onPress={() => updateAttendance(item.student_id.toString(), 'absent')}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={currentStatus === 'absent' ? '#fff' : '#F44336'} />
              ) : (
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={currentStatus === 'absent' ? '#fff' : '#F44336'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const counts = getAttendanceCounts();

  const renderStatsModal = () => (
    <Modal
      visible={showStatsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowStatsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Attendance Summary</Text>
            <TouchableOpacity onPress={() => setShowStatsModal(false)}>
              <Ionicons name="close" size={24} color="#5F83C7" />
            </TouchableOpacity>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{counts.total}</Text>
              <Text style={styles.statsLabel}>Total</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={[styles.statsNumber, { color: '#4CAF50' }]}>{counts.present}</Text>
              <Text style={styles.statsLabel}>Present</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={[styles.statsNumber, { color: '#F44336' }]}>{counts.absent}</Text>
              <Text style={styles.statsLabel}>Absent</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={[styles.statsNumber, { color: '#FF9800' }]}>{counts.leave}</Text>
              <Text style={styles.statsLabel}>Leave</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    if (!selectedClass) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="school-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Please select a class to view students</Text>
        </View>
      );
    }

    const sectionFilteredStudents = selectedClass.section_id
      ? students.filter(student => student.section_id === selectedClass.section_id)
      : students;

    const filteredStudents = sectionFilteredStudents.filter(student =>
      student.studentname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollno.toString().includes(searchQuery.toLowerCase())
    );

    return (
      <>
        <View style={styles.searchFilterContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.filterStatsButton}
            onPress={() => setShowStatsModal(true)}
          >
            <Ionicons name="stats-chart-outline" size={20} color="#5F83C7" />
          </TouchableOpacity>
        </View>

        {(loadingStudents || loadingAttendance) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5F83C7" />
            <Text style={styles.loadingText}>
              {loadingStudents ? 'Loading students...' : 'Loading attendance...'}
            </Text>
          </View>
        ) : (errorStudents || errorAttendance) ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {errorStudents || errorAttendance}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                if (selectedClass) {
                  fetchStudents(selectedClass.class_id, selectedClass.section_id);
                  fetchExistingAttendance(selectedClass.class_id, selectedClass.section_id, selectedDate);
                }
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.student_id.toString()}
            renderItem={renderStudentItem}
            contentContainerStyle={styles.studentList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No students found</Text>
              </View>
            }
          />
        )}
      </>
    );
  };

  const renderClassModal = () => (
    <Modal
      visible={showClassModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowClassModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Class & Section</Text>
            <TouchableOpacity onPress={() => setShowClassModal(false)}>
              <Ionicons name="close" size={24} color="#5F83C7" />
            </TouchableOpacity>
          </View>
          {loadingClassTeachers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5F83C7" />
              <Text style={styles.loadingText}>Loading class teachers...</Text>
            </View>
          ) : errorClassTeachers ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorClassTeachers}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchClassTeachers()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={classTeachers.filter(item => String(item.staff_id) === String(loggedInStaffId))}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.classItem}
                  onPress={async () => {
                    setSelectedClass(item);
                    setAttendanceData({});
                    setSubmittingAttendance({});
                    setShowClassModal(false);
                    await fetchStudents(item.class_id, item.section_id);
                    await fetchExistingAttendance(item.class_id, item.section_id, selectedDate);
                    try {
                      await AsyncStorage.setItem('class_id', item.class_id.toString());
                      await AsyncStorage.setItem('section_id', item.section_id.toString());
                      console.log('Saved class_id:', item.class_id);
                      console.log('Saved section_id:', item.section_id);
                    } catch (err) {
                      console.log('Error saving class_id/section_id:', err);
                    }
                  }}
                >
                  <Text style={styles.classItemText}>
                    Class {item.class_name} - {item.section_name}
                  </Text>
                  <Text style={styles.classItemSubtext}>
                    Teacher: {item.staff_name}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No class teachers found</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Attendance</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowClassModal(true)}
        >
          <Ionicons name="school-outline" size={20} color="#5F83C7" />
          <Text style={styles.filterButtonText}>
            {selectedClass ? `Class ${selectedClass.class_name} - ${selectedClass.section_name}` : 'Select Class'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#5F83C7" />
          <Text style={styles.filterButtonText}>
            {selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
      {renderClassModal()}
      {renderStatsModal()}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date);
            }
          }}
        />
      )}
    </View>
  );
};

export default AttendanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerContainer: {
    padding: 8,
    backgroundColor: '#5F83C7',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 8,
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    flex: 0.48,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterButtonText: {
    marginLeft: 4,
    color: '#5F83C7',
    fontSize: 12,
    fontWeight: '600',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 8,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 1,
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#333',
  },
  studentList: {
    padding: 8,
  },
  studentCard: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  studentCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
    marginRight: 8,
  },
  studentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  rollNumber: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  attendanceButtonsContainer: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    width: '80%',
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5F83C7',
  },
  classItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  classItemText: {
    fontSize: 12,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  filterStatsButton: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  statsItem: {
    width: '48%',
    backgroundColor: '#f5f7fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5F83C7',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#5F83C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  classItemSubtext: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  sectionName: {
    fontSize: 9,
    color: '#888',
    marginTop: 1,
  },
});