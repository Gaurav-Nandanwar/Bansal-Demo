import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const EventScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    try {
      const userDetails = await AsyncStorage.getItem('userDetails');
      if (userDetails) {
        const parsedDetails = JSON.parse(userDetails);
        setUserId(parsedDetails.user_id);
        fetchEvents();
      } else {
        setError('User details not found');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading user details:', err);
      setError('Failed to load user details');
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('https://bansal.steponetechnologies.com/bansalProject/appApi/getAllEvent/');
      const result = await response.json();
      
      console.log('Events API Response:', JSON.stringify(result, null, 2));

      if (result.statusCode === "01" && result.message === "success") {
        // Transform the data to match our component's expected format
        const transformedEvents = result.data.map(item => ({
          id: item.details.id,
          event_name: item.details.eventName,
          event_remarks: item.details.remark,
          event_date: item.details.eventDate,
          fileImageUrl: item.details.fileImageUrl
        }));
        
        setEvents(transformedEvents);
      } else {
        setError('Failed to fetch events');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const [year, month, day] = dateString.split('-');
      const date = new Date(year, month - 1, day);
      return {
        day: date.getDate(),
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        fullDate: date.toLocaleDateString('default', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    } catch (err) {
      console.error('Error formatting date:', err);
      return {
        day: '--',
        month: '---',
        year: '----',
        fullDate: 'Invalid Date'
      };
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Events</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Events</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        {events.length > 0 ? (
          events.map((event) => {
            const dateInfo = formatDate(event.event_date);
            return (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.imageContainer}>
                  {event.fileImageUrl ? (
                    <Image 
                      source={{ uri: `https://bansal-stepone.s3.ap-south-1.amazonaws.com/media/${event.fileImageUrl}` }}
                      style={styles.eventImage}
                    />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <MaterialIcons name="event" size={24} color="#5F83C7" />
                    </View>
                  )}
                </View>
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <MaterialIcons name="event" size={14} color="#007AFF" />
                    <Text style={styles.eventName}>{event.event_name}</Text>
                  </View>
                  <Text style={styles.eventDate}>{dateInfo.fullDate}</Text>
                  <Text style={styles.eventRemarks}>{event.event_remarks}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsText}>No events found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default EventScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 60,
    backgroundColor: '#5F83C7',
    justifyContent: 'center',
    alignItems: 'flex-start',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
  },
  scrollView: {
    flex: 1,
    padding: 9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 9,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 7,
    marginBottom: 9,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
    padding: 9,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 4,
  },
  eventDate: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  eventRemarks: {
    fontSize: 12,
    color: '#666',
    lineHeight: 11,
    marginBottom: 8,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noEventsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});