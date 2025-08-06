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
} from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'https://api.stpl.cloud/timetable/staffwise/';

const urgencyStyles = {
  High: {
    backgroundColor: '#ffe6e6',
    borderColor: '#cc0000',
    iconColor: '#cc0000',
  },
  Medium: {
    backgroundColor: '#fff5e6',
    borderColor: '#e67300',
    iconColor: '#e67300',
  },
  Low: {
    backgroundColor: '#e6ffe6',
    borderColor: '#339933',
    iconColor: '#339933',
  },
};

const dummyNotifications = [
  { id: 'n1', title: 'Parent-Teacher Meeting', time: '9:00 AM', detail: 'Scheduled with Grade 10 parents at 2:00 PM', urgency: 'High' },
  { id: 'n2', title: 'Exam Schedule Update', time: '10:00 AM', detail: 'Mid-term exams rescheduled to next week', urgency: 'Medium' },
  { id: 'n3', title: 'Staff Meeting', time: '1:00 PM', detail: 'Discussion on new curriculum changes', urgency: 'High' },
  { id: 'n4', title: 'Library Reminder', time: '2:30 PM', detail: 'Return overdue books by end of day', urgency: 'Low' },
  { id: 'n5', title: 'Training Session', time: '3:00 PM', detail: 'Workshop on digital teaching tools', urgency: 'Medium' },
];

const HomeContent = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(moment().format('DD-MM-YYYY'));
  const [modalVisible, setModalVisible] = useState(false);
  const [timetableData, setTimetableData] = useState({}); // { 'YYYY-MM-DD': [ { ... } ] }
  const [currentTimetable, setCurrentTimetable] = useState([]);
  const [attendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(moment().format('DD-MM-YYYY'));
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Fetch timetable on mount
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const staff_id = await AsyncStorage.getItem('staff_id');
        if (!staff_id) return;
        const response = await fetch(API_URL);
        const data = await response.json();
        const staffEntry = data.timetable.find((entry) => String(entry.staff_id) === String(staff_id));
        if (!staffEntry) return;
        // Build a date-to-schedule map for the next 7 days
        const map = {};
        for (let i = 0; i < 14; i++) {
          const date = moment().add(i, 'days');
          const dayName = date.format('dddd');
          const key = date.format('YYYY-MM-DD');
          const dayKey = `day: ${dayName}`;
          if (staffEntry[dayKey]) {
            map[key] = staffEntry[dayKey].map((item, idx) => ({
              id: `${key}-${idx}`,
              time: item.slot,
              subject: item.subject_name,
              room: `${item.class_name} - ${item.section_name}`,
              school: item.school_name,
            }));
          }
        }
        setTimetableData(map);
        // Set today's timetable
        const todayKey = moment().format('YYYY-MM-DD');
        setCurrentTimetable(map[todayKey] || []);
      } catch (err) {
        setTimetableData({});
        setCurrentTimetable([]);
      }
    };
    fetchTimetable();
  }, []);

  // When date changes in calendar modal
  const onDateChange = (date) => {
    const formattedDate = moment(date).format('YYYY-MM-DD');
    setSelectedDate(formattedDate);
    setCurrentTimetable(timetableData[formattedDate] || []);
    setModalVisible(true);
  };

  // Dummy attendance data for demonstration
  const dummyAttendance = {
    '2025-07-25': { inTime: '09:05', outTime: '17:15' },
    '2025-07-24': { inTime: '09:10', outTime: '17:00' },
    '2025-07-23': { inTime: '09:00', outTime: '16:45' },
    // ... more dates
  };

  const onCalendarDatePress = (date) => {
    const formattedDate = moment(date).format('YYYY-MM-DD');
    setAttendanceDate(formattedDate);
    setAttendanceLoading(true);
    setAttendanceRecords([]);
    AsyncStorage.multiGet(['school_id', 'staff_id']).then(async (stores) => {
      const school_id = stores[0][1];
      const staff_id = stores[1][1];
      if (!school_id || !staff_id) {
        setAttendanceRecords([]);
        setAttendanceLoading(false);
        setAttendanceModalVisible(true);
        return;
      }
      try {
        const response = await fetch(`https://api.stpl.cloud/staff_attendance/get_attendance/?school_id=${school_id}&staff_id=${staff_id}`);
        const data = await response.json();
        // Filter records for the selected date
        const records = Array.isArray(data) ? data.filter(r => r.date === formattedDate) : [];
        setAttendanceRecords(records);
      } catch (err) {
        console.error('Error fetching attendance:', err);
        setAttendanceRecords([]);
      }
      setAttendanceLoading(false);
      setAttendanceModalVisible(true);
    });
  };

  const timetableDates = Object.keys(timetableData);

  const customDatesStyles = useMemo(() => {
    return timetableDates.map((dateStr) => ({
      date: moment(dateStr, 'YYYY-MM-DD').toDate(),
      style: { backgroundColor: '#e6f3f3' },
      textStyle: { color: '#005566', fontWeight: 'bold' },
    }));
  }, [timetableDates]);

  const quickActions = [
    { id: '1', title: 'Mark Attendance', icon: 'checkbox-outline', screen: 'Attendance' },
    { id: '2', title: 'View Timetable', icon: 'calendar-outline', screen: 'Timetable' },
    { id: '3', title: 'Send Announcement', icon: 'megaphone-outline', screen: 'Send Announcement' },
    { id: '4', title: 'Exam Assesment', icon: 'bookmarks-outline', screen: 'ExamAssessment' },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Welcome Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Staff Dashboard</Text>
        <Text style={styles.subHeader}>Welcome, {moment().format('dddd, MMMM D, YYYY')}</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Today's Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          {currentTimetable.length > 0 ? (
            <FlatList
              data={currentTimetable}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.scheduleItem}>
                  <Ionicons name="time-outline" size={24} color="#005566" style={styles.scheduleIcon} />
                  <View style={styles.scheduleDetails}>
                    <Text style={styles.scheduleTime}>{item.time}</Text>
                    <Text style={styles.scheduleSubject}>{item.subject}</Text>
                    <Text style={styles.scheduleRoom}>{item.room}</Text>
                  </View>
                </View>
              )}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noSchedule}>No classes scheduled today.</Text>
          )}
          <TouchableOpacity style={styles.viewMoreButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.viewMoreText}>View Full Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionContainer}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionButton}
                onPress={() => {
                  if (action.screen) {
                    navigation.navigate(action.screen);
                  } else {
                    // Placeholder for Send Announcement
                  }
                }}
              >
                <Ionicons name={action.icon} size={30} color="#005566" />
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      {/* Calendar for Attendance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Calendar</Text>
        <CalendarPicker
          onDateChange={onCalendarDatePress}
          customDatesStyles={customDatesStyles}
          selectedStartDate={moment(selectedDate).toDate()}
          width={350}
          height={350}
        />
      </View>
      </ScrollView>

      {/* Timetable Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule for {moment(selectedDate, 'YYYY-MM-DD').format('DD-MM-YYYY')}</Text>
            <View style={styles.calendarContainer}>
              <CalendarPicker
                onDateChange={onDateChange}
                customDatesStyles={customDatesStyles}
                selectedStartDate={moment(selectedDate).toDate()}
                width={300}
                height={300}
              />
            </View>
            {currentTimetable.length > 0 ? (
              <ScrollView style={styles.modalList}>
                <FlatList
                  data={currentTimetable}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.scheduleItem}>
                      <Ionicons name="time-outline" size={24} color="#005566" style={styles.scheduleIcon} />
                      <View style={styles.scheduleDetails}>
                        <Text style={styles.scheduleTime}>{item.time}</Text>
                        <Text style={styles.scheduleSubject}>{item.subject}</Text>
                        <Text style={styles.scheduleRoom}>{item.room}</Text>
                      </View>
                    </View>
                  )}
                  scrollEnabled={false}
                />
              </ScrollView>
            ) : (
              <Text style={styles.noSchedule}>No classes scheduled on this date.</Text>
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

      {/* Attendance Status Modal */}
      <Modal
        visible={attendanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAttendanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Attendance for {moment(attendanceDate, 'YYYY-MM-DD').format('DD-MM-YYYY')}</Text>
            {attendanceLoading ? (
              <Text style={styles.scheduleTime}>Loading...</Text>
            ) : attendanceRecords.length > 0 ? (
              attendanceRecords.map((rec, idx) => {
                // Calculate total hours
                let totalHours = 'N/A';
                let inTimeFormatted = 'N/A';
                let outTimeFormatted = 'N/A';
                
                if (rec.in_time) {
                  const inMoment = moment(rec.in_time);
                  inTimeFormatted = inMoment.format('HH:mm');
                }
                
                if (rec.out_time) {
                  const outMoment = moment(rec.out_time);
                  outTimeFormatted = outMoment.format('HH:mm');
                }
                
                if (rec.in_time && rec.out_time) {
                  const inMoment = moment(rec.in_time);
                  const outMoment = moment(rec.out_time);
                  const duration = moment.duration(outMoment.diff(inMoment));
                  const hours = Math.floor(duration.asHours());
                  const minutes = duration.minutes();
                  totalHours = `${hours}h ${minutes}m`;
                }
                
                return (
                  <View key={rec.id || idx} style={styles.attendanceRecord}>
                    <View style={styles.attendanceRow}>
                      <Text style={styles.attendanceLabel}>In Time:</Text>
                      <Text style={styles.attendanceValue}>{inTimeFormatted}</Text>
                    </View>
                    <View style={styles.attendanceRow}>
                      <Text style={styles.attendanceLabel}>Out Time:</Text>
                      <Text style={styles.attendanceValue}>{outTimeFormatted}</Text>
                    </View>
                    <View style={styles.attendanceRow}>
                      <Text style={styles.attendanceLabel}>Total Hours:</Text>
                      <Text style={styles.attendanceValue}>{totalHours}</Text>
                    </View>
                    <View style={styles.attendanceRow}>
                      <Text style={styles.attendanceLabel}>Status:</Text>
                      <Text style={[styles.attendanceValue, { color: rec.attendance_status === 'Present' ? '#28a745' : '#dc3545' }]}>
                        {rec.attendance_status || 'N/A'}
                      </Text>
                    </View>
                    {rec.machine_id && (
                      <View style={styles.attendanceRow}>
                        <Text style={styles.attendanceLabel}>Machine ID:</Text>
                        <Text style={styles.attendanceValue}>{rec.machine_id}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={styles.scheduleTime}>No attendance records found for this date.</Text>
            )}
            <Pressable
              style={styles.closeButton}
              onPress={() => setAttendanceModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  headerContainer: {
    paddingBottom: 4,
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
  subHeader: {
    fontSize: 12,
    color: '#e6f3f3',
    textAlign: 'center',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#005566',
    marginBottom: 6,
  },
  scheduleItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 5,
    marginBottom: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scheduleIcon: {
    marginRight: 6,
    fontSize: 16,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleTime: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  scheduleSubject: {
    fontSize: 10,
    color: '#333',
    marginTop: 1,
  },
  scheduleRoom: {
    fontSize: 8,
    color: '#666',
    marginTop: 1,
  },
  noSchedule: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    marginVertical: 5,
  },
  viewMoreButton: {
    backgroundColor: '#e6f3f3',
    padding: 6,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 4,
  },
  viewMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#005566',
  },
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#005566',
    marginTop: 4,
  },
  notificationBox: {
    flexDirection: 'row',
    borderWidth: 1,
    padding: 6,
    borderRadius: 5,
    marginBottom: 4,
    alignItems: 'center',
  },
  notificationIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 8,
    color: '#555',
    marginTop: 1,
  },
  notificationUrgency: {
    fontSize: 8,
    fontStyle: 'italic',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    maxHeight: '80%',
    alignSelf: 'center',
    width: '90%',
    elevation: 3,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#005566',
    marginBottom: 8,
    textAlign: 'center',
  },
  calendarContainer: {
    height: 300,
    overflow: 'hidden',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e6f3f3',
    marginBottom: 5,
  },
  modalList: {
    maxHeight: 170,
    marginTop: 5,
  },
  closeButton: {
    marginTop: 8,
    backgroundColor: '#005566',
    padding: 6,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  attendanceRecord: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 5,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#005566',
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  attendanceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  attendanceValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#005566',
    flex: 1,
    textAlign: 'right',
  },
});