import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios'; // Make sure axios is installed

const LocationScreen = () => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    speed: null,
  });
  const [error, setError] = useState(null);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show real-time updates.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const checkLocationServices = async () => {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          if (error.code === 2) {
            Alert.alert(
              'Location Services Disabled',
              'Please enable location services to use this feature.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings() },
              ]
            );
            resolve(false);
          } else {
            resolve(true);
          }
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    });
  };

  const sendLocationToAPI = async (lat, lon, speed) => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const payload = {
      school_id: 1,
      bus_id: 1,
      latitude: lat.toString(),
      longitude: lon.toString(),
      speed: `${speed.toFixed(2)} km/hour`,
      time: currentTime,
    };

    try {
      const response = await axios.post('https://api.stpl.cloud/track_location/live_track', payload);
      console.log('API Response:', response.data);
    } catch (error) {
      console.error('API Error:', error.message);
    }
  };

  useEffect(() => {
    let watchId;

    const startLocationUpdates = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError('Location permission denied');
        Alert.alert('Permission Denied', 'Please enable location permissions in settings.');
        return;
      }

      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        setError('Location services are disabled');
        return;
      }

      watchId = Geolocation.watchPosition(
        (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const speed = position.coords.speed ? position.coords.speed * 3.6 : 0;

          setLocation({ latitude, longitude, speed });
          setError(null);

          // Send data to API
          sendLocationToAPI(latitude, longitude, speed);
        },
        (err) => {
          console.log('Geolocation error:', err);
          setError(err.message);
          Alert.alert('Location Error', err.message);
        },
        {
          enableHighAccuracy: false,
          distanceFilter: 0,
          interval: 2000,
          fastestInterval: 2000,
        }
      );
    };

    startLocationUpdates();

    const clockInterval = setInterval(() => {
      setClock(new Date().toLocaleTimeString());
    }, 1000);

    return () => {
      if (watchId) {
        Geolocation.clearWatch(watchId);
      }
      clearInterval(clockInterval);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Screen</Text>
      <Text style={styles.clock}>Time: {clock}</Text>
      {error ? (
        <Text style={styles.error}>Error: {error}</Text>
      ) : (
        <>
          <Text style={styles.text}>
            Latitude: {location.latitude ? location.latitude.toFixed(6) : 'Waiting...'}
          </Text>
          <Text style={styles.text}>
            Longitude: {location.longitude ? location.longitude.toFixed(6) : 'Waiting...'}
          </Text>
          <Text style={styles.text}>
            Speed: {location.speed ? location.speed.toFixed(2) : 0} km/h
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  clock: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  text: {
    fontSize: 18,
    marginVertical: 10,
  },
  error: {
    fontSize: 18,
    color: 'red',
    marginVertical: 10,
  },
});

export default LocationScreen;
