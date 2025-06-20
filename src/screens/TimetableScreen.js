import React, { useState, useEffect } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,FlatList,LayoutAnimation,Platform,UIManager,Modal,ScrollView,ActivityIndicator,Dimensions,Alert} from 'react-native';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TimetableScreen = () => {
  const [expandedDay, setExpandedDay] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [timetableData, setTimetableData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError(null);

      const identifiersStr = await AsyncStorage.getItem('userIdentifiers');
      if (!identifiersStr) {
        throw new Error('No user identifiers found');
      }

      const identifiers = JSON.parse(identifiersStr);
      console.log('Fetching timetable for:', {
        school_id: identifiers.school_id,
        class_id: identifiers.class_id,
        section_id: identifiers.section_id
      });

      const response = await fetch(`https://api.stpl.cloud/timetable/classwise/?school_id=${identifiers.school_id}`);
      const json = await response.json();

      const studentTimetable = json.timetable.find(
        (t) => 
          t.class_id === identifiers.class_id && 
          t.section_id === identifiers.section_id
      );

      if (!studentTimetable) {
        throw new Error('No timetable found for your class and section');
      }

      console.log('=== Timetable Information ===');
      console.log('Class:', studentTimetable.class);
      console.log('Section:', studentTimetable.section);
      console.log('Class ID:', studentTimetable.class_id);
      console.log('Section ID:', studentTimetable.section_id);
      console.log('==========================');

      const days = {};
      Object.keys(studentTimetable).forEach((key) => {
        if (key.startsWith('day:')) {
          const dayName = key.replace('day: ', '');
          days[dayName] = studentTimetable[key].map((entry) => ({
            time: entry.slot,
            subject: entry.subject_name,
            teacher: entry.staff_name,
          }));
        }
      });

      setTimetableData(days);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setError(error.message);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (day) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDay((prev) => (prev === day ? null : day));
  };

  const renderRow = ({ time, subject, teacher }, isToday = false) => (
    <View style={[styles.tableRow, { backgroundColor: isToday ? '#e6f0ff' : '#fff' }]}>
      <View style={styles.cellLeft}>
        <Text style={styles.cellText}>{time}</Text>
      </View>
      <View style={styles.cellCenter}>
        <Text style={styles.cellText}>{subject}</Text>
      </View>
      <View style={styles.cellRight}>
        <Text style={styles.cellText}>{teacher}</Text>
      </View>
    </View>
  );

  const renderDayBox = (day) => (
    <View key={day} style={styles.dayBox}>
      <TouchableOpacity onPress={() => toggleExpand(day)} style={styles.dayHeader}>
        <Text style={styles.dayText}>{day}</Text>
        <Ionicons
          name={expandedDay === day ? 'chevron-up-circle' : 'chevron-down-circle'}
          size={26}
          color="#5F83C7"
        />
      </TouchableOpacity>
      {expandedDay === day && (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cellText, styles.cellLeft, styles.headerText]}>Time</Text>
            <Text style={[styles.cellText, styles.cellCenter, styles.headerText]}>Subject</Text>
            <Text style={[styles.cellText, styles.cellRight, styles.headerText]}>Teacher</Text>
          </View>
          {timetableData[day]?.map((item, idx) => (
            <View key={idx}>{renderRow(item)}</View>
          ))}
        </View>
      )}
    </View>
  );

  const renderFullWeekModal = () => {
    const maxPeriods = Math.max(...Object.values(timetableData).map(day => day.length || 0));

    return (
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Weekly Timetable</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close-circle" size={28} color="#5F83C7" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.fixedColumn}>
                <View style={[styles.dayColumn, styles.headerColumn]}>
                  <Text style={styles.headerText}>Day/Time</Text>
                </View>
                {WEEKDAY_ORDER.map((day) => (
                  <View 
                    key={day} 
                    style={[
                      styles.dayColumn,
                      { backgroundColor: day === todayName ? '#e6f0ff' : '#f8f9fa' }
                    ]}
                  >
                    <Text style={[styles.dayText, { color: day === todayName ? '#5F83C7' : '#333' }]}>{day}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.scrollableContent}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                >
                  <View>
                    <View style={[styles.gridRow, styles.headerRow]}>
                  {Array.from({ length: maxPeriods }).map((_, colIndex) => {
                    let timeSlot = '';
                        for (const day of WEEKDAY_ORDER) {
                      if (timetableData[day]?.[colIndex]) {
                        timeSlot = timetableData[day][colIndex].time;
                        break;
                      }
                    }
                    return (
                          <View key={colIndex} style={[styles.periodColumn, styles.headerColumn]}>
                        <Text style={styles.headerText}>{timeSlot || '-'}</Text>
                      </View>
                    );
                  })}
                </View>

                    {WEEKDAY_ORDER.map((day) => (
                      <View key={day} style={styles.gridRow}>
                      {Array.from({ length: maxPeriods }).map((_, idx) => (
                          <View 
                            key={idx} 
                            style={[
                              styles.periodColumn,
                              { backgroundColor: day === todayName ? '#e6f0ff' : '#fff' }
                            ]}
                          >
                            <Text style={styles.subjectText}>{timetableData[day]?.[idx]?.subject || '-'}</Text>
                            <Text style={styles.teacherText}>{timetableData[day]?.[idx]?.teacher || '-'}</Text>
                        </View>
                      ))}
                        </View>
                      ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5F83C7" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTimetable}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.todayHeader}>
        <Text style={styles.todayTitle}>Today</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="calendar-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.todayBox}>
        <Text style={styles.todaySubHeader}>{todayDateStr}</Text>
        <ScrollView 
          style={styles.todayScrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.table}>
        <View style={styles.tableHeader}>
              <Text style={[styles.cellText, styles.cellLeft, styles.headerText]}>Time</Text>
              <Text style={[styles.cellText, styles.cellCenter, styles.headerText]}>Subject</Text>
              <Text style={[styles.cellText, styles.cellRight, styles.headerText]}>Teacher</Text>
        </View>
        {timetableData[todayName]?.map((item, index) => (
              <View key={index}>{renderRow(item, true)}</View>
        ))}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={WEEKDAY_ORDER.filter((day) => day !== todayName && timetableData[day])}
        renderItem={({ item }) => renderDayBox(item)}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.weekList}
      />

      {renderFullWeekModal()}
    </View>
  );
};

export default TimetableScreen;

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    alignItems: 'center',
  },
  todayTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  todaySubHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    color: '#5F83C7',
    paddingHorizontal: 6,
  },
  todayBox: {
    backgroundColor: '#dbeafe',
    marginHorizontal: 8,
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 8,
    maxHeight: 300,
  },
  todayScrollView: {
    maxHeight: 280,
  },
  weekList: {
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  dayBox: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#5F83C7',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  table: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#5F83C7',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  cellLeft: { 
    flex: 1, 
    alignItems: 'flex-start', 
    paddingRight: 4,
  },
  cellCenter: { 
    flex: 1.2, 
    alignItems: 'center', 
    paddingHorizontal: 4,
  },
  cellRight: { 
    flex: 1, 
    alignItems: 'flex-end', 
    paddingLeft: 4,
  },
  cellText: { 
    fontSize: 10, 
    color: '#333',
    textAlign: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'center',
    color: '#fff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.85,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5F83C7',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  fixedColumn: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: '#fff',
    borderRightWidth: 2,
    borderRightColor: '#5F83C7',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollableContent: {
    marginLeft: 100,
    flex: 1,
  },
  headerRow: {
    height: 70,
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    height: 70,
  },
  dayColumn: {
    width: 100,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    height: 70,
  },
  periodColumn: {
    width: 120,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    height: 70,
  },
  headerColumn: {
    backgroundColor: '#5F83C7',
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  teacherText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#5F83C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});