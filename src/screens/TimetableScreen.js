import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const TimetableScreen = () => {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [weeklyModalVisible, setWeeklyModalVisible] = useState(false);
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const schoolId = await AsyncStorage.getItem('school_id');
      const staffId = await AsyncStorage.getItem('staff_id');
      
      if (!schoolId || !staffId) {
        setError('School ID or Staff ID not found');
        return;
      }

      const response = await axios.get(
        `https://api.stpl.cloud/timetable/staffwise/?school_id=${schoolId}`
      );

      if (response.data && response.data.timetable) {
        const staffTimetable = response.data.timetable.find(
          (staff) => staff.staff_id.toString() === staffId
        );
        
        if (staffTimetable) {
          setTimetableData(staffTimetable);
        } else {
          setError('No timetable found for this staff');
        }
      }
    } catch (err) {
      setError('Failed to fetch timetable');
      console.error('Timetable fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleForDate = (date) => {
    if (!timetableData) return [];
    
    const dayName = moment(date).format('dddd');
    const dayKey = `day: ${dayName}`;
    const schedules = timetableData[dayKey] || [];

    return schedules.sort((a, b) => {
      const timeA = a.slot.split(' - ')[0];
      const timeB = b.slot.split(' - ')[0];
      return moment(timeA, 'hh:mm A').diff(moment(timeB, 'hh:mm A'));
    });
  };

  const onDateChange = (date) => {
    const formattedDate = moment(date).format('YYYY-MM-DD');
    setSelectedDate(formattedDate);
    setCalendarModalVisible(false);
  };

  const onSchedulePress = (schedule) => {
    setSelectedSchedule(schedule);
    setDetailsModalVisible(true);
  };

  const renderScheduleItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.scheduleItem} 
      onPress={() => onSchedulePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.slotContainer}>
        <Ionicons name="time-outline" size={18} color="#fff" />
        <Text style={styles.slotTime}>{item.slot}</Text>
      </View>
      <View style={styles.scheduleDetails}>
        <Text style={styles.scheduleSubject}>{item.subject_name}</Text>
        <View style={styles.classInfoContainer}>
          <View style={styles.classBadge}>
            <Text style={styles.classText}>{item.class_name}</Text>
          </View>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionText}>{item.section_name}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderWeeklyModal = () => {
    if (!timetableData) return null;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const allSlots = new Set();
    days.forEach(day => {
      const daySchedules = timetableData[`day: ${day}`] || [];
      daySchedules.forEach(schedule => allSlots.add(schedule.slot));
    });
    
    const sortedSlots = Array.from(allSlots).sort((a, b) => {
      const timeA = a.split(' - ')[0];
      const timeB = b.split(' - ')[0];
      return moment(timeA, 'hh:mm A').diff(moment(timeB, 'hh:mm A'));
    });

    const rowHeight = 80; // Consistent height for all rows

    return (
      <Modal visible={weeklyModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Weekly Schedule</Text>
              <Pressable 
                onPress={() => setWeeklyModalVisible(false)}
                style={styles.closeButton1}
              >
                <Ionicons name="close-circle" size={24} color="#5F83C7" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.gridContainer}>
                <View style={styles.dayColumnContainer}>
                  <View style={[styles.dayColumn, styles.gridHeader, { height: rowHeight }]}>
                    <Text style={styles.headerText}>Day</Text>
                  </View>
                  {days.map((day) => (
                    <View key={day} style={[styles.dayColumn, { height: rowHeight }]}>
                      <Text style={styles.dayText}>{day}</Text>
                    </View>
                  ))}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={styles.gridHeader}>
                      {sortedSlots.map((slot, index) => (
                        <View key={index} style={[styles.periodColumn, { height: rowHeight }]}>
                          <Text style={styles.headerText}>{slot}</Text>
                        </View>
                      ))}
                    </View>
                    {days.map((day) => (
                      <View key={day} style={styles.gridRow}>
                        {sortedSlots.map((slot, idx) => {
                          const schedule = (timetableData[`day: ${day}`] || []).find(
                            s => s.slot === slot
                          );
                          return (
                            <View key={idx} style={[
                              styles.periodColumn,
                              schedule && styles.periodColumnFilled,
                              { height: rowHeight }
                            ]}>
                              {schedule ? (
                                <View style={styles.cellContent}>
                                  <Text style={styles.cellSubject}>{schedule.subject_name}</Text>
                                  <View style={styles.cellClassInfo}>
                                    <Text style={styles.cellClassText}>
                                      {`${schedule.class_name} - ${schedule.section_name}`}
                                    </Text>
                                  </View>
                                </View>
                              ) : (
                                <Text style={styles.emptyCellText}>-</Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const currentSchedule = getScheduleForDate(selectedDate);

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

  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTimetable}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.headerContainer}>
        <Text style={styles.header}>My Timetable</Text>
        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => setCalendarModalVisible(true)}
        >
          <Ionicons name="calendar-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.subHeaderContainer}>
        <Text style={styles.subHeader}>
          {moment(selectedDate).format('dddd, MMMM D, YYYY')}
        </Text>
        <TouchableOpacity 
          style={styles.weeklyButton}
          onPress={() => setWeeklyModalVisible(true)}
        >
          <Ionicons name="grid-outline" size={16} color="#5F83C7" />
          <Text style={styles.weeklyViewText}>Weekly View</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        {currentSchedule.length > 0 ? (
          <FlatList
            data={currentSchedule}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderScheduleItem}
            contentContainerStyle={styles.scheduleList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.noSchedule}>No classes scheduled for this date</Text>
          </View>
        )}
      </View>
      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity 
                onPress={() => setCalendarModalVisible(false)}
                style={styles.closeButton1}
              >
                <Ionicons name="close-circle" size={28} color="#5F83C7" />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarContainer}>
              <CalendarPicker
                onDateChange={onDateChange}
                selectedStartDate={moment(selectedDate).toDate()}
                width={300}
                height={300}
              />
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSchedule && (
              <>
                <Text style={styles.modalTitle}>{selectedSchedule.subject_name}</Text>
                <Text style={styles.scheduleTime}>Time: {selectedSchedule.slot}</Text>
                <Text style={styles.scheduleRoom}>
                  Class: {selectedSchedule.class_name} - {selectedSchedule.section_name}
                </Text>
              </>
            )}
            <Pressable
              style={styles.closeButton}
              onPress={() => setDetailsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {renderWeeklyModal()}
    </View>
  );
};

export default TimetableScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 4,
    backgroundColor: '#5F83C7',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  calendarButton: {
    padding: 4,
  },
  subHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subHeader: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  weeklyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7f7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  weeklyViewText: {
    marginLeft: 2,
    fontSize: 10,
    color: '#5F83C7',
    fontWeight: '600',
  },
  section: {
    flex: 1,
    padding: 8,
  },
  scheduleList: {
    paddingBottom: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  slotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5F83C7',
    padding: 4,
    borderRadius: 4,
    marginRight: 6,
  },
  slotTime: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 2,
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleSubject: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  classInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classBadge: {
    backgroundColor: '#e6f3f3',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 4,
  },
  classText: {
    fontSize: 8,
    color: '#5F83C7',
    fontWeight: '500',
  },
  sectionBadge: {
    backgroundColor: '#f0f7f7',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  sectionText: {
    fontSize: 8,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  noSchedule: {
    marginTop: 6,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '95%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5F83C7',
  },
  closeButton1: {
    padding: 4,
  },
  gridContainer: {
    flexDirection: 'row',
  },
  dayColumnContainer: {
    backgroundColor: '#f8f9fa',
  },
  gridHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f7f7',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  gridRow: {
    flexDirection: 'row',
  },
  dayColumn: {
    width: 100,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  periodColumn: {
    width: 120,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  periodColumnFilled: {
    backgroundColor: '#f0f7f7',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5F83C7',
    textAlign: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cellContent: {
    alignItems: 'center',
  },
  cellSubject: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  cellClassInfo: {
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cellClassText: {
    fontSize: 10,
    color: '#666',
  },
  emptyCellText: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 6,
    fontSize: 12,
    color: '#5F83C7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#5F83C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxWidth: 340,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5F83C7',
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#5F83C7',
    borderRadius: 20,
    marginTop: 8,
    alignItems:'center',
    justifyContent:'center',
  },
  calendarContainer: {
    height: 300,
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    padding: 4,
  },
});