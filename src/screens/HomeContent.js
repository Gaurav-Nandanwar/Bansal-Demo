import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  View,
  FlatList,
  Modal,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const HomeContent = () => {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('0:00:00');
  const [timerActive, setTimerActive] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    inTime: '--:--',
    outTime: '--:--',
    totalHours: '0',
    overallAttendance: '0%',
    present: 0,
    absent: 0,
    leave: 0,
    holiday: 0,
    attendanceRecords: {}
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    let timer;
    if (timerActive && dashboardData.inTime !== '--:--' && dashboardData.outTime === '--:--') {
      const startTime = moment(dashboardData.inTime, 'HH:mm:ss');
      timer = setInterval(() => {
        const now = moment();
        const duration = moment.duration(now.diff(startTime));
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        setElapsedTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    } else {
      setElapsedTime('0:00:00');
    }
    return () => clearInterval(timer);
  }, [timerActive, dashboardData.inTime, dashboardData.outTime]);

  useEffect(() => {
    // Start timer if in time is present but out time is not
    setTimerActive(dashboardData.inTime !== '--:--' && dashboardData.outTime === '--:--');
  }, [dashboardData.inTime, dashboardData.outTime]);

  const fetchDashboardData = async () => {
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
      console.log('Fetching dashboard data for user ID:', id);

      const currentDate = moment();
      const response = await axios.post(
        'https://bansal.steponetechnologies.com/bansalProject/appApi/getStudentDashboard/',
        {
          student_id: id,
          month_id: currentDate.month() + 1, // Adding 1 because moment months are 0-based
          year: currentDate.year()
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      console.log('Dashboard API Response:', JSON.stringify(response.data, null, 2));

      if (response.data.statusCode === "01") {
        // Process and set the dashboard data
        const data = response.data.data;
        const today = data.today || {};
        const summary = data.summary || {};
        
        // Transform attendance records into the expected format
        const attendanceRecords = {};
        if (data.attendance_details) {
          data.attendance_details.forEach(record => {
            const date = record.details.date;
            if (!attendanceRecords[date]) {
              attendanceRecords[date] = [];
            }
            // Calculate total hours if out time exists
            let totalHours = 'NA';
            if (record.details.outTime && record.details.outTime !== '--') {
              const inTime = moment(record.details.inTime, 'HH:mm:ss');
              const outTime = moment(record.details.outTime, 'HH:mm:ss');
              const duration = moment.duration(outTime.diff(inTime));
              const hours = Math.floor(duration.asHours());
              const minutes = duration.minutes();
              totalHours = `${hours}:${minutes.toString().padStart(2, '0')}`;
            }

            attendanceRecords[date].push({
              id: record.details.id,
              time: record.details.inTime,
              outTime: record.details.outTime === '--' ? '--:--' : record.details.outTime,
              totalHours: totalHours,
              status: 'Present'
            });
          });
        }

        setDashboardData({
          inTime: today.in_status || '--:--',
          outTime: today.out_status || '--:--',
          totalHours: today.totalHr || '0',
          overallAttendance: `${summary.attendance_percentage || 0}%`,
          present: summary.present_count || 0,
          absent: summary.absent_count || 0,
          leave: summary.leave_count || 0,
          holiday: summary.holidays_count || 0,
          attendanceRecords: attendanceRecords
        });
      } else {
        // Handle empty data case gracefully
        setDashboardData({
          inTime: '--:--',
          outTime: '--:--',
          totalHours: '0',
          overallAttendance: '0%',
          present: 0,
          absent: 0,
          leave: 0,
          holiday: 0,
          attendanceRecords: {}
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (date) => {
    const formattedDate = moment(date).format('YYYY-MM-DD');
    const attendance = dashboardData.attendanceRecords[formattedDate] || [];
    setSelectedDate(formattedDate);
    setCurrentAttendance(attendance);
    setModalVisible(true);
  };

  const attendanceDates = Object.keys(dashboardData.attendanceRecords);

  const customDatesStyles = useMemo(() => {
    return attendanceDates.map((dateStr) => {
      const attendance = dashboardData.attendanceRecords[dateStr];
      const isAbsent = attendance && attendance.some(record => record.status === 'Absent');
      
      return {
        date: moment(dateStr, 'YYYY-MM-DD').toDate(),
        style: { 
          backgroundColor: isAbsent ? '#ffebee' : '#cce5ff',
          borderWidth: 1,
          borderColor: isAbsent ? '#f44336' : '#003366'
        },
        textStyle: { 
          color: isAbsent ? '#f44336' : '#003366', 
          fontWeight: 'bold' 
        },
      };
    });
  }, [attendanceDates, dashboardData.attendanceRecords]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5F83C7" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchDashboardData}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Today's Attendance</Text>
      
      {/* Time Boxes Section */}
      <View style={styles.timeBoxesContainer}>
        <View style={styles.timeBoxRow}>
          <View style={[styles.timeBox, styles.inTimeBox]}>
            <Text style={styles.timeBoxLabel}>In Time</Text>
            <Text style={styles.timeBoxValue}>{dashboardData.inTime}</Text>
          </View>
          <View style={[styles.timeBox, styles.outTimeBox]}>
            <Text style={styles.timeBoxLabel}>Out Time</Text>
            <Text style={styles.timeBoxValue}>{dashboardData.outTime}</Text>
          </View>
        </View>
        <View style={styles.totalHoursBox}>
          <Text style={styles.totalHoursLabel}>Total Hours</Text>
          <Text style={styles.totalHoursValue}>
            {timerActive ? elapsedTime : dashboardData.totalHours} Hours
          </Text>
        </View>
      </View>

      <CalendarPicker
        onDateChange={onDateChange}
        customDatesStyles={customDatesStyles}
        selectedStartDate={moment().toDate()}
      />

      {/* Monthly Attendance Summary */}
      <View style={styles.monthlyAttendanceContainer}>
        <Text style={styles.monthlyTitle}>Monthly Attendance</Text>
        
        {/* Overall Attendance Box */}
        <View style={styles.overallAttendanceBox}>
          <Text style={styles.overallLabel}>Overall Attendance</Text>
          <Text style={styles.overallValue}>{dashboardData.overallAttendance}</Text>
        </View>

        {/* Status Boxes */}
        <View style={styles.statusBoxesContainer}>
          <View style={[styles.statusBox, styles.presentBox]}>
            <Text style={styles.statusValue}>{dashboardData.present}</Text>
            <Text style={styles.statusLabel}>Present</Text>
          </View>
          <View style={[styles.statusBox, styles.absentBox]}>
            <Text style={styles.statusValue}>{dashboardData.absent}</Text>
            <Text style={styles.statusLabel}>Absent</Text>
          </View>
          <View style={[styles.statusBox, styles.leaveBox]}>
            <Text style={styles.statusValue}>{dashboardData.leave}</Text>
            <Text style={styles.statusLabel}>Leave</Text>
          </View>
          <View style={[styles.statusBox, styles.holidayBox]}>
            <Text style={styles.statusValue}>{dashboardData.holiday}</Text>
            <Text style={styles.statusLabel}>Holiday</Text>
          </View>
        </View>
      </View>

      {/* Attendance Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Attendance for {moment(selectedDate).format('MMMM D, YYYY')}
            </Text>

            {currentAttendance.length > 0 ? (
              <FlatList
                data={currentAttendance}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.attendanceItem}>
                    <View style={styles.attendanceHeader}>
                      <Text style={styles.subjectText}>Attendance Record</Text>
                      <Text style={[styles.statusText, { color: item.status === 'Present' ? '#28a745' : '#dc3545' }]}>
                        {item.status}
                      </Text>
                    </View>
                    <View style={styles.timeDetailsContainer}>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>In Time:</Text>
                        <Text style={styles.timeValue}>{item.time}</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Out Time:</Text>
                        <Text style={styles.timeValue}>{item.outTime}</Text>
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Total Hours:</Text>
                        <Text style={styles.timeValue}>{item.totalHours} Hours</Text>
                      </View>
                    </View>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.noAttendance}>No attendance records found.</Text>
            )}

            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default HomeContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
    marginTop: 5,
  },
  timeBoxesContainer: {
    padding: 8,
    backgroundColor: '#fff',
    marginBottom: 3,
  },
  timeBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeBox: {
    width: '48%',
    padding: 10,
    borderRadius: 5.8,
    alignItems: 'center',
    elevation: 2,
  },
  inTimeBox: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  outTimeBox: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  timeBoxLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#333',
  },
  timeBoxValue: {
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  totalHoursBox: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 5.8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  totalHoursLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#333',
  },
  totalHoursValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  monthlyAttendanceContainer: {
    padding: 10,
    backgroundColor: '#fff',
    marginTop: 1,
  },
  monthlyTitle: {
    fontSize: 11.5,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  overallAttendanceBox: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 5.8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2196f3',
  },
  overallLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  overallValue: {
    fontSize: 14.4,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statusBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statusBox: {
    width: '48%',
    padding: 10,
    borderRadius: 5.8,
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
  },
  presentBox: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  absentBox: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  leaveBox: {
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  holidayBox: {
    backgroundColor: '#e8eaf6',
    borderWidth: 1,
    borderColor: '#3f51b5',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  statusLabel: {
    fontSize: 8.6,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  attendanceItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    elevation: 2,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeDetailsContainer: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  noAttendance: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
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
});

