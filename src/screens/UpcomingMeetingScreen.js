import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const dummyMeetings = [
  {
    id: 1,
    title: 'Parent-Teacher Meeting',
    date: '2025-05-25',
    time: '10:00 AM',
    location: 'Room 101',
  },
  {
    id: 2,
    title: 'Annual Sports Meeting',
    date: '2025-05-26',
    time: '2:00 PM',
    location: 'Auditorium',
  },
  {
    id: 3,
    title: 'Staff Coordination Meeting',
    date: '2025-05-27',
    time: '9:00 AM',
    location: 'Conference Hall',
  },
  {
    id: 4,
    title: 'Science Project Discussion',
    date: '2025-05-28',
    time: '11:30 AM',
    location: 'Lab Room 3',
  },
  {
    id: 5,
    title: 'Board of Trustees Meeting',
    date: '2025-05-29',
    time: '3:00 PM',
    location: 'Board Room',
  },
  {
    id: 6,
    title: 'Field Trip Briefing',
    date: '2025-05-30',
    time: '8:00 AM',
    location: 'Activity Room',
  },
  {
    id: 7,
    title: 'Mid-Term Planning',
    date: '2025-06-01',
    time: '1:00 PM',
    location: 'Room 202',
  },
  {
    id: 8,
    title: 'Math Olympiad Prep',
    date: '2025-06-03',
    time: '10:00 AM',
    location: 'Room 305',
  },
  {
    id: 9,
    title: 'Art Exhibition Committee',
    date: '2025-06-05',
    time: '4:00 PM',
    location: 'Art Room',
  },
  {
    id: 10,
    title: 'Safety Training',
    date: '2025-06-07',
    time: '12:00 PM',
    location: 'Multipurpose Hall',
  },
  {
    id: 11,
    title: 'Student Council Review',
    date: '2025-06-10',
    time: '9:30 AM',
    location: 'Library',
  },
  {
    id: 12,
    title: 'Exam Strategy Meeting',
    date: '2025-06-12',
    time: '11:00 AM',
    location: 'Room 110',
  },
];

const UpcomingMeetingScreen = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Upcoming Meetings</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {dummyMeetings.map((meeting) => (
            <TouchableOpacity
              key={meeting.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => alert(`Details for "${meeting.title}"`)}
            >
              <Text style={styles.cardTitle}>{meeting.title}</Text>
              <Text style={styles.cardInfo}>📅 {meeting.date}</Text>
              <Text style={styles.cardInfo}>⏰ {meeting.time}</Text>
              <Text style={styles.cardInfo}>📍 {meeting.location}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor: '#E8F1FA',
  },
  headerContainer: {
    backgroundColor: '#5F83C7',
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexGrow: 1, // Ensures ScrollView content takes full height when needed
  },
  card: {
    backgroundColor: '#F1F8FF',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#A8D0E6',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  cardInfo: {
    fontSize: 12,
    color: '#457B9D',
    marginBottom: 1,
  },
});

export default UpcomingMeetingScreen;