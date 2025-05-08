import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable, FlatList } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';
import Header from '../components/Header';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const mockAttendance = {
  '2025-05-01': 'present',
  '2025-05-02': 'absent',
  '2025-05-03': 'present',
  '2025-05-06': 'present',
  '2025-05-07': 'absent',
  '2025-05-08': 'present',
  '2025-04-09': 'present',
  '2025-04-10': 'absent',
  '2025-04-19': 'present',
  '2025-04-02': 'absent',
  '2025-04-01': 'absent',
  '2025-04-17': 'present',
};

const mockHolidays = {
  '2025-05': [
    { date: '2025-05-05', title: 'Labour Day' },
    { date: '2025-05-20', title: 'Founders Day' },
  ],
  '2025-04': [
    { date: '2025-04-14', title: 'Dr. Ambedkar Jayanti' },
    { date: '2025-04-21', title: 'Mahavir Jayanti' },
  ],
};

const CalendarScreen = () => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [attendance, setAttendance] = useState({});
  const [summary, setSummary] = useState({ present: 0, absent: 0 });
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('attendance');
  const [workingDays, setWorkingDays] = useState(0);

  useEffect(() => {
    fetchAttendance();
  }, [currentDate]);

  const fetchAttendance = () => {
    const month = currentDate.format('YYYY-MM');
    const monthlyData = Object.keys(mockAttendance).reduce((acc, date) => {
      if (date.startsWith(month)) {
        acc[date] = mockAttendance[date];
      }
      return acc;
    }, {});
    const present = Object.values(monthlyData).filter(val => val === 'present').length;
    const absent = Object.values(monthlyData).filter(val => val === 'absent').length;
    setAttendance(monthlyData);
    setSummary({ present, absent });

    // Calculate working days (exclude Sundays)
    const daysInMonth = currentDate.daysInMonth();
    let sundays = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = moment(currentDate).date(day);
      if (date.day() === 0) sundays++;
    }
    setWorkingDays(daysInMonth - sundays);
  };

  const generateMatrix = () => {
    const matrix = [];
    const startDay = moment(currentDate).startOf('month').day();
    const totalDays = currentDate.daysInMonth();
    let day = 1;

    for (let i = 0; i < 6; i++) {
      const row = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < startDay) {
          row.push('');
        } else if (day > totalDays) {
          row.push('');
        } else {
          row.push(day++);
        }
      }
      matrix.push(row);
    }
    return matrix;
  };

  const matrix = generateMatrix();
  const prevMonth = () => setCurrentDate(prev => moment(prev).subtract(1, 'month'));
  const nextMonth = () => setCurrentDate(prev => moment(prev).add(1, 'month'));

  const renderHolidayScreen = () => {
    const monthKey = currentDate.format('YYYY-MM');
    const holidays = mockHolidays[monthKey] || [];

    return (
      <View style={{ flex: 1, paddingHorizontal: 16, marginTop: 10 }}>
        <Text style={styles.holidayHeading}>Holiday List</Text>
        {holidays.length === 0 ? (
          <Text style={{ marginTop: 10 }}>No holidays this month.</Text>
        ) : (
          <FlatList
            data={holidays}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.holidayCard}>
                <Text style={styles.holidayDate}>{moment(item.date).format('ddd, MMM D')}</Text>
                <Text style={styles.holidayTitle}>{item.title}</Text>
              </View>
            )}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />

      {/* Toggle Tabs */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, selectedTab === 'attendance' && styles.activeTab]}
          onPress={() => setSelectedTab('attendance')}
        >
          <Text style={[styles.toggleText, selectedTab === 'attendance' && styles.activeText]}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, selectedTab === 'holidays' && styles.activeTab]}
          onPress={() => setSelectedTab('holidays')}
        >
          <Text style={[styles.toggleText, selectedTab === 'holidays' && styles.activeText]}>Holidays</Text>
        </TouchableOpacity>
      </View>

      {/* Month Header */}
      <View style={styles.monthBox}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={prevMonth}>
            <MaterialIcons name="chevron-left" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{currentDate.format('MMMM YYYY')}</Text>
          <TouchableOpacity onPress={nextMonth}>
            <MaterialIcons name="chevron-right" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {selectedTab === 'attendance' ? (
        <>
          {/* Calendar Grid */}
          <View style={styles.calendarBox}>
            <View style={styles.weekRow}>
              {daysOfWeek.map(day => (
                <Text key={day} style={styles.dayLabel}>{day}</Text>
              ))}
            </View>

            {matrix.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.weekRow}>
                {row.map((date, colIndex) => {
                  const fullDate = `${currentDate.format('YYYY-MM')}-${String(date).padStart(2, '0')}`;
                  const status = attendance[fullDate];

                  return (
                    <TouchableOpacity
                      key={colIndex}
                      style={styles.dateCell}
                      onPress={() => {
                        if (date) {
                          setSelectedDate({ date: fullDate, status });
                          setModalVisible(true);
                        }
                      }}
                    >
                      <Text style={styles.dateText}>{date}</Text>
                      {status === 'present' && <View style={styles.greenDot} />}
                      {status === 'absent' && <View style={styles.redDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Summary Section */}
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.summaryHeading}>Attendance Summary</Text>

            <View style={styles.workingDaysBox}>
              <Text style={styles.label}>Working Days</Text>
              <Text style={styles.value}>{workingDays}</Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderColor: 'green' }]}>
                <Text style={styles.label}>Present</Text>
                <Text style={[styles.value, { color: 'green' }]}>{summary.present}</Text>
              </View>
              <View style={[styles.summaryCard1, { borderColor: 'red' }]}>
                <Text style={styles.label}>Absent</Text>
                <Text style={[styles.value, { color: 'red' }]}>{summary.absent}</Text>
              </View>
            </View>
          </ScrollView>
        </>
      ) : (
        renderHolidayScreen()
      )}

      {/* Modal for Date Info */}
      <Modal transparent={true} visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Attendance Details</Text>
            <Text style={styles.modalDate}>{selectedDate?.date}</Text>
            <Text style={styles.modalStatus}>
              Status: {selectedDate?.status ? selectedDate.status.toUpperCase() : 'N/A'}
            </Text>
            <Pressable style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CalendarScreen;



const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#5F83C7',
  },
  toggleText: {
    color: '#333',
    fontWeight: '500',
  },
  activeText: {
    color: 'white',
  },
  holidayHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  holidayCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  holidayDate: {
    fontWeight: '600',
    color: '#444',
  },
  holidayTitle: {
    fontSize: 16,
    color: '#000',
  },
  
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  monthBox: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  calendarBox: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 2,
  },
  dayLabel: {
    width: 32,
    textAlign: 'center',
    fontWeight: '600',
    color: '#333',
  },
  dateCell: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dateText: {
    fontSize: 14,
    color: '#444',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'green',
    position: 'absolute',
    bottom: 6,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'red',
    position: 'absolute',
    bottom: 6,
  },
  summaryHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 18,
    marginTop: 16,
    marginBottom: 10,
    color: '#333',
  },
  workingDaysBox: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    elevation: 2,
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#b0fda2',
    padding: 12,
    borderRadius: 10,
    elevation: 2,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryCard1: {
    flex: 1,
    backgroundColor: '#FFA6A6',
    padding: 12,
    borderRadius: 10,
    elevation: 2,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    color: '#000',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalDate: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  modalStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2196F3',
    borderRadius: 6,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
