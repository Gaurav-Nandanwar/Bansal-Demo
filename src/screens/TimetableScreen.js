import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  ScrollView,
} from 'react-native';
import { Dimensions } from 'react-native';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const dummyData = {
  Monday: [
    { time: '10:00 AM', subject: 'Math', teacher: 'Mr. John' },
    { time: '11:00 AM', subject: 'Chemistry', teacher: 'Mrs. Lee' },
    { time: '12:00 AM', subject: 'Biology', teacher: 'Mrs. Harley' },
    { time: '01:00 PM', subject: 'Economics', teacher: 'Mrs. John' },
    { time: '02:00 PM', subject: 'History', teacher: 'Mrs. Leon' },
  ],
  Tuesday: [{ time: '11:00 AM', subject: 'Science', teacher: 'Mrs. Smith' }],
  Wednesday: [{ time: '09:00 AM', subject: 'History', teacher: 'Ms. Clark' }],
  Thursday: [{ time: '01:00 PM', subject: 'English', teacher: 'Mr. Doe' }],
  Friday: [{ time: '12:00 PM', subject: 'Physics', teacher: 'Dr. Brown' }],
  Saturday: [{ time: '10:30 AM', subject: 'Art', teacher: 'Ms. Lily' }],
};

const TimetableScreen = () => {
  const [expandedDay, setExpandedDay] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);

  const toggleExpand = (day) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDay((prev) => (prev === day ? null : day));
  };

  const renderRow = ({ time, subject, teacher }) => (
    <View style={styles.tableRow}>
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
            <Text style={[styles.cellText, styles.cellLeft, { fontWeight: 'bold' }]}>Time</Text>
            <Text style={[styles.cellText, styles.cellCenter, { fontWeight: 'bold' }]}>Subject</Text>
            <Text style={[styles.cellText, styles.cellRight, { fontWeight: 'bold' }]}>Teacher</Text>
          </View>
          {dummyData[day].map((item, idx) => (
            <View key={idx}>{renderRow(item)}</View>
          ))}
        </View>
      )}
    </View>
  );

  const renderFullWeekModal = () => {
    const maxPeriods = Math.max(...Object.values(dummyData).map(day => day.length));

    return (
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Weekly Timetable</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#5F83C7" />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal>
              <View>
                <View style={styles.gridRow}>
                  <View style={styles.dayColumn}>
                    <Text style={styles.headerText}>Day</Text>
                  </View>
                  {Array.from({ length: maxPeriods }).map((_, colIndex) => {
                    let timeSlot = '';
                    for (const day of Object.keys(dummyData)) {
                      if (dummyData[day][colIndex]) {
                        timeSlot = dummyData[day][colIndex].time;
                        break;
                      }
                    }
                    return (
                      <View key={colIndex} style={styles.periodColumn}>
                        <Text style={styles.headerText}>{timeSlot || '-'}</Text>
                      </View>
                    );
                  })}
                </View>

                {Object.entries(dummyData).map(([day, periods]) => (
                  <View key={day}>
                    <View style={styles.gridRow}>
                      <View style={styles.dayColumn}>
                        <Text style={styles.dayText}>{day}</Text>
                      </View>
                      {Array.from({ length: maxPeriods }).map((_, idx) => (
                        <View key={idx} style={styles.periodColumn}>
                          <Text style={styles.cellText}>{periods[idx]?.subject || '-'}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.gridRow}>
                      <View style={styles.dayColumn}>
                        <Text style={[styles.headerText, { fontStyle: 'bold', color: '#555' }]}>Teacher</Text>
                      </View>
                      {Array.from({ length: maxPeriods }).map((_, idx) => (
                        <View key={idx} style={styles.periodColumn}>
                          <Text style={[styles.cellText, { fontSize: 12, color: '#666' }]}>
                            {periods[idx]?.teacher || '-'}
                          </Text>
                        </View>
                      ))}
                    </View>

                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Header />

      {/* Today Header */}
      <View style={styles.todayHeader}>
        <Text style={styles.todayTitle}>Today</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="calendar-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Today Box */}
      <View style={styles.todayBox}>
        <Text style={styles.todaySubHeader}>Monday</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.cellText, styles.cellLeft, { fontWeight: 'bold' }]}>Time</Text>
          <Text style={[styles.cellText, styles.cellCenter, { fontWeight: 'bold' }]}>Subject</Text>
          <Text style={[styles.cellText, styles.cellRight, { fontWeight: 'bold' }]}>Teacher</Text>
        </View>
        {dummyData.Monday.map((item, index) => (
          <View key={index}>{renderRow(item)}</View>
        ))}
      </View>

      {/* Weekly List */}
      <FlatList
        data={Object.keys(dummyData).filter((day) => day !== 'Monday')}
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayColumn: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#edf2ff',
    borderRightWidth: 1,
    borderColor: '#ccc',
  },
  periodColumn: {
    width: 100,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    color: '#333',
  },
  dayText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#5F83C7',
  },

  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    alignItems: 'center',
  },
  todayTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  todaySubHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#5F83C7',
  },
  todayBox: {
    backgroundColor: '#dbeafe',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  weekList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  dayBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#5F83C7',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  table: {
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 6,
    columnGap: 60,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cellLeft: { flex: 1, alignItems: 'flex-start' },
  cellCenter: { flex: 1, alignItems: 'center' },
  cellRight: { flex: 1, alignItems: 'flex-end' },
  cellText: { fontSize: 14, color: '#333' },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5F83C7',
  },
  modalDayBox: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
  },
  modalDayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
});
