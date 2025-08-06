import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';

const Subjectwise_Attendance = ({ staff_id = "Nikhil Nimbekar", school_id = 6 }) => {
  const [proxySlots, setProxySlots] = useState([]);
  // Fetch proxy timetable data for today
  useEffect(() => {
    const fetchProxyTimetable = async () => {
      try {
        const response = await fetch(`https://api.stpl.cloud/proxy_timetable/proxy_timetable_creation?school_id=${school_id}`);
        const data = await response.json();
        // Get today's date in dd-mm-yyyy format
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const todayStr = `${dd}-${mm}-${yyyy}`;
        // Filter proxy slots for today (by date_created)
        const todayProxySlots = Array.isArray(data)
          ? data.filter(slot => slot.date_created === todayStr)
          : [];
        setProxySlots(todayProxySlots);
      } catch (err) {
        setProxySlots([]);
      }
    };
    fetchProxyTimetable();
  }, [school_id]);
  const [attendanceData, setAttendanceData] = useState({});
  const [submittingAttendance, setSubmittingAttendance] = useState({});
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'present', 'absent'
  const [teacherAttendanceStatus, setTeacherAttendanceStatus] = useState(null);
  const [todaySlots, setTodaySlots] = useState([]); // List of slots for today for staff
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student data from API
  const [students, setStudents] = useState([]);

  // Fetch students for selected class and section
  useEffect(() => {
    // Get class and section from today's slots (first slot)
    if (todaySlots.length === 0) {
      setStudents([]);
      return;
    }
    const class_id = 4; // You can get this from todaySlots[0].class_id if available
    const section_name = todaySlots[0].section;
    const fetchStudents = async () => {
      try {
        const response = await fetch(`https://api.stpl.cloud/student/get-student/?school_id=${school_id}&class_id=${class_id}`);
        const data = await response.json();
        // Filter by section name
        const filtered = Array.isArray(data.students)
          ? data.students.filter(s => s.section_name === section_name)
          : [];
        // Map to UI format
        setStudents(filtered.map(s => ({
          id: s.student_id,
          name: s.studentname,
          rollNo: s.rollno ? s.rollno.toString() : '',
        })));
      } catch (err) {
        setStudents([]);
      }
    };
    fetchStudents();
  }, [school_id, todaySlots]);

  // Fetch timetable data from API and show all slots for staff_id today
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`https://api.stpl.cloud/timetable/classwise/?school_id=${school_id}`);
        const data = await response.json();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[new Date().getDay()];
        // Find all timetable entries for today for this staff_id
        let slots = [];
        if (Array.isArray(data.timetable)) {
          data.timetable.forEach(entry => {
            const daySlots = entry[`day: ${currentDay}`];
            if (Array.isArray(daySlots)) {
              daySlots.forEach(slot => {
                if (slot.staff_name.trim() === staff_id.trim()) {
                  slots.push({
                    class: entry.class,
                    section: entry.section,
                    slot: slot.slot,
                    staff_name: slot.staff_name,
                    subject_name: slot.subject_name,
                  });
                }
              });
            }
          });
        }
        setTodaySlots(slots);
        if (slots.length === 0) {
          setError('No classes scheduled for you today.');
        }
      } catch (err) {
        setError('Failed to fetch timetable data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [staff_id, school_id]);

  const updateAttendance = (studentId, status) => {
    setSubmittingAttendance(prev => ({
      ...prev,
      [studentId]: true
    }));

    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));

    setTimeout(() => {
      setSubmittingAttendance(prev => ({
        ...prev,
        [studentId]: false
      }));
    }, 500);
  };

  const getAttendanceStats = () => {
    const totalStudents = students.length;
    const presentCount = Object.values(attendanceData).filter(status => status === 'present').length;
    const absentCount = Object.values(attendanceData).filter(status => status === 'absent').length;
    return {
      total: totalStudents,
      present: presentCount,
      absent: absentCount
    };
  };

  const getFilteredStudents = () => {
    if (selectedFilter === 'all') {
      return students;
    }
    return students.filter(student => {
      const studentStatus = attendanceData[student.id.toString()];
      return studentStatus === selectedFilter;
    });
  };

  const renderStudentItem = ({ item }) => {
    const currentStatus = attendanceData[item.id.toString()];
    const isSubmitting = submittingAttendance[item.id.toString()];

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentCardContent}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.rollNumber}>Roll No: {item.rollNo}</Text>
          </View>
          <View style={styles.attendanceButtonsContainer}>
            <TouchableOpacity
              style={[styles.attendanceButton, 
                      currentStatus === 'present' ? styles.activePresentButton : styles.inactivePresentButton,
                      isSubmitting ? styles.disabledButton : null]}
              onPress={() => updateAttendance(item.id.toString(), 'present')}
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
              style={[styles.attendanceButton,
                      currentStatus === 'absent' ? styles.activeAbsentButton : styles.inactiveAbsentButton,
                      isSubmitting ? styles.disabledButton : null]}
              onPress={() => updateAttendance(item.id.toString(), 'absent')}
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5F83C7" />
          <Text style={styles.loadingText}>Loading timetable...</Text>
        </View>
      </View>
    );
  }

  // Remove error UI for no classes , just show empty classes section

  return (
    <View style={styles.container}>
      <Header />
      {/* Timetable slots for today for this staff */}
      <View style={styles.headerContainer}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Today's Classes</Text>
        {todaySlots.length > 0 ? (
          todaySlots.map((slot, idx) => (
            <View key={idx} style={{ backgroundColor: '#fff', borderRadius: 8, marginBottom: 8, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: '#5F83C7', fontWeight: 'bold', fontSize: 14 }}>{slot.class} - {slot.section}</Text>
                <Text style={{ color: '#333', fontSize: 13 }}>{slot.subject_name}</Text>
                <Text style={{ color: '#666', fontSize: 12 }}>{slot.slot}</Text>
              </View>
              <Text style={{ color: '#5F83C7', fontWeight: 'bold', fontSize: 13 }}>{slot.staff_name}</Text>
            </View>
          ))
        ) : (
          <Text style={{ color: '#fff', fontSize: 14 }}>No classes scheduled for you today.</Text>
        )}
      </View>
      {/* ...existing dashboard, student header, and student list code... */}
      <View style={styles.dashboardContainer}>
        <View style={styles.teacherInfo}>
          <View style={styles.teacherNameContainer}>
            <Ionicons name="person-circle-outline" size={24} color="#5F83C7" />
            <Text style={styles.teacherName}>{staff_id}</Text>
          </View>
          <View style={styles.teacherAttendanceButtons}>
            <TouchableOpacity
              style={[styles.attendanceButton, 
                      teacherAttendanceStatus === 'present' ? styles.activePresentButton : styles.inactivePresentButton]}
              onPress={() => setTeacherAttendanceStatus('present')}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={teacherAttendanceStatus === 'present' ? '#fff' : '#4CAF50'} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attendanceButton, 
                      teacherAttendanceStatus === 'absent' ? styles.activeAbsentButton : styles.inactiveAbsentButton]}
              onPress={() => setTeacherAttendanceStatus('absent')}
            >
              <Ionicons 
                name="close-circle" 
                size={16} 
                color={teacherAttendanceStatus === 'absent' ? '#fff' : '#F44336'} 
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={[styles.statBox, selectedFilter === 'all' && styles.selectedStatBox]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={styles.statNumber}>{getAttendanceStats().total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statBox, selectedFilter === 'present' && styles.selectedStatBox]}
            onPress={() => setSelectedFilter('present')}
          >
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{getAttendanceStats().present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statBox, selectedFilter === 'absent' && styles.selectedStatBox]}
            onPress={() => setSelectedFilter('absent')}
          >
            <Text style={[styles.statNumber, { color: '#F44336' }]}>{getAttendanceStats().absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.studentHeader}>
        <Text style={styles.studentHeaderText}>Students</Text>
        <View style={styles.attendanceLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Active</Text>
          </View>
          {proxySlots.length > 0 && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Proxy</Text>
            </View>
          )}
        </View>
      </View>
      <FlatList
        data={getFilteredStudents()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStudentItem}
        contentContainerStyle={styles.studentList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all' 
                ? 'No students found' 
                : `No students marked as ${selectedFilter}`}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerContainer: {
    padding: 12,
    backgroundColor: '#5F83C7',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  classInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.3,
    alignItems: 'center',
  },
  classText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5F83C7',
  },
  subjectBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.35,
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5F83C7',
  },
  timeBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.3,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5F83C7',
  },
  dashboardContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  teacherNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  teacherAttendanceButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedStatBox: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#5F83C7',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5F83C7',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  studentHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  attendanceLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#5F83C7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
});

export default Subjectwise_Attendance;