import React, { useState, useMemo } from 'react';
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

const dummyMeetings = {
  '2025-05-23': [
    { id: '1', time: '10:00 AM', title: 'Team Standup' },
    { id: '2', time: '02:00 PM', title: 'Client Meeting' },
  ],
  '2025-05-25': [
    { id: '3', time: '11:00 AM', title: 'Product Review' },
  ],
};

const dummyNotifications = [
  { id: 'n1', title: 'New Meeting Scheduled', time: '9:00 AM', detail: 'Meeting with Sales Team at 10:30 AM', urgency: 'High' },
  { id: 'n2', title: 'Project Review', time: '11:00 AM', detail: 'Quarterly review meeting at 12:00 PM', urgency: 'Medium' },
  { id: 'n3', title: 'Client Call', time: '2:00 PM', detail: 'Call with ABC Corp regarding new project', urgency: 'High' },
  { id: 'n4', title: 'Interview Schedule', time: '3:30 PM', detail: 'Tech interview with frontend dev candidate', urgency: 'Low' },
  { id: 'n5', title: 'Internal Training', time: '4:00 PM', detail: 'Training session on new tools', urgency: 'Medium' },
  { id: 'n6', title: 'Feedback Session', time: '5:00 PM', detail: '1-on-1 feedback session with interns', urgency: 'Low' },
  { id: 'n7', title: 'Daily Wrap-Up', time: '6:00 PM', detail: 'Team wrap-up discussion', urgency: 'Low' },
];

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

const HomeContent = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMeetings, setCurrentMeetings] = useState([]);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const onDateChange = (date) => {
    const formattedDate = moment(date).format('YYYY-MM-DD');
    const meetings = dummyMeetings[formattedDate] || [];
    setSelectedDate(formattedDate);
    setCurrentMeetings(meetings);
    setModalVisible(true);
  };

  const onNotificationPress = (notification) => {
    setSelectedNotification(notification);
    setNotificationModalVisible(true);
  };

  const meetingDates = Object.keys(dummyMeetings);

  const customDatesStyles = useMemo(() => {
    return meetingDates.map((dateStr) => ({
      date: moment(dateStr, 'YYYY-MM-DD').toDate(),
      style: { backgroundColor: '#cce5ff' },
      textStyle: { color: '#003366', fontWeight: 'bold' },
    }));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Meeting Calendar</Text>
      <CalendarPicker
        onDateChange={onDateChange}
        customDatesStyles={customDatesStyles}
      />

      {/* Meeting Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Meetings on {selectedDate}
            </Text>

            {currentMeetings.length > 0 ? (
              <FlatList
                data={currentMeetings}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.meetingItem}>
                    <Text style={styles.meetingTime}>{item.time}</Text>
                    <Text style={styles.meetingTitle}>{item.title}</Text>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.noMeetings}>No meetings scheduled.</Text>
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

      {/* Notifications Section */}
      <Text style={styles.notificationTitle}>Notifications</Text>
      <View>
        {dummyNotifications.map((notification) => {
          const urgency = urgencyStyles[notification.urgency];
          return (
            <TouchableOpacity
              key={notification.id}
              style={[styles.notificationBox, { backgroundColor: urgency.backgroundColor, borderColor: urgency.borderColor }]}
              onPress={() => onNotificationPress(notification)}
            >
              <Text style={[styles.notificationTitleText, { color: urgency.iconColor }]}>
                ⚠️ {notification.title}
              </Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
              <Text style={styles.notificationUrgency}>{notification.urgency} Priority</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notification Detail Modal */}
      <Modal
        visible={notificationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedNotification && (
              <>
                <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                <Text style={styles.meetingTime}>Time: {selectedNotification.time}</Text>
                <Text style={styles.meetingTitle}>{selectedNotification.detail}</Text>
                <Text style={styles.notificationUrgency}>Urgency: {selectedNotification.urgency}</Text>
              </>
            )}
            <Pressable
              style={styles.closeButton}
              onPress={() => setNotificationModalVisible(false)}
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
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  meetingItem: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  meetingTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  meetingTitle: {
    fontSize: 16,
    color: '#333',
  },
  noMeetings: {
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    marginVertical: 10,
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notificationTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  notificationBox: {
    borderWidth: 1,
    padding: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationTitleText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 2,
    color: '#555',
  },
  notificationUrgency: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
