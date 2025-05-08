import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const LocationScreen = () => {
  const [location, setLocation] = useState(null);
  const [time, setTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = new Date();
      setTime(currentTime);
      getLocationAndSend(currentTime); // Send updated data every second
    }, 10000); // 10 seconds interval (reduce if needed)
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getLocationAndSend(new Date());
        } else {
          Alert.alert('Permission Denied', 'Location permission is required.');
          setLoading(false);
        }
      } else {
        getLocationAndSend(new Date()); // iOS
      }
    } catch (err) {
      console.warn(err);
      setLoading(false);
    }
  };

  const getLocationAndSend = (currentTime) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const coords = position.coords;
        setLocation(coords);
        sendLocationToServer(coords, currentTime);
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        Alert.alert('Location Error', error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: true,
      }
    );
  };

  const sendLocationToServer = async (coords, currentTime) => {
    try {
      const response = await fetch('https://api.stpl.cloud/track_location/live_track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          school_id: 0,
          bus_id: 0,
          latitude: coords.latitude.toString(),
          longitude: coords.longitude.toString(),
          speed: (coords.speed ?? 0).toString(),
          time: currentTime.toLocaleTimeString(),
        }),
      });

      const data = await response.json();
      console.log('Location sent:', data);
    } catch (error) {
      console.error('Failed to send location:', error);
    }
  };

  const formatTime = (date) => date.toLocaleTimeString();

  const formatSpeed = (speed) => {
    if (speed == null || speed < 0) return 'N/A';
    return `${(speed * 3.6).toFixed(2)} km/h`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Location</Text>
      <Text style={styles.text}>Time: {formatTime(time)}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="tomato" />
      ) : location ? (
        <>
          <Text style={styles.text}>Latitude: {location.latitude}</Text>
          <Text style={styles.text}>Longitude: {location.longitude}</Text>
          <Text style={styles.text}>Speed: {formatSpeed(location.speed)}</Text>
        </>
      ) : (
        <Text style={styles.text}>Waiting for location...</Text>
      )}
    </View>
  );
};

export default LocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 18,
    marginVertical: 6,
  },
});
