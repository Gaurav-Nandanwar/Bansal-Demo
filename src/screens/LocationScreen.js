import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const LocationScreen = () => {
  const [location, setLocation] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    speed: 0,
    hasLocation: false,
  });
  const [error, setError] = useState(null);
  const [clock, setClock] = useState(new Date().toLocaleTimeString());
  const watchIdRef = useRef(null);

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
        { enableHighAccuracy: false, timeout: 10000 }
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
      setError('Failed to send location to server');
    }
  };

  useEffect(() => {
    const startTracking = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError('Location permission denied');
        return;
      }

      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        setError('Location services are disabled');
        return;
      }

      watchIdRef.current = Geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed } = position.coords;
          const convertedSpeed = speed ? speed * 3.6 : 0;

          setLocation({
            latitude,
            longitude,
            speed: convertedSpeed,
            hasLocation: true,
          });

          setError(null);
          sendLocationToAPI(latitude, longitude, convertedSpeed);
        },
        (err) => {
          console.log('WatchPosition Error:', err);
          setError(`Location error: ${err.message}`);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 0,
          interval: 1000,
          fastestInterval: 1000,
          timeout: 10000,
          maximumAge: 1000,
        }
      );
    };

    startTracking();

    const clockInterval = setInterval(() => {
      setClock(new Date().toLocaleTimeString());
    }, 1000);

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
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
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
            followsUserLocation={true}
          >
            {location.hasLocation && (
              <Marker
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title="Current Location"
                description={`Speed: ${location.speed.toFixed(2)} km/h`}
              />
            )}
          </MapView>
          <View style={styles.infoContainer}>
            <Text style={styles.text}>
              Latitude: {location.hasLocation ? location.latitude.toFixed(6) : 'N/A'}
            </Text>
            <Text style={styles.text}>
              Longitude: {location.hasLocation ? location.longitude.toFixed(6) : 'N/A'}
            </Text>
            <Text style={styles.text}>
              Speed: {location.speed.toFixed(2)} km/h
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  clock: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: 400,
    marginBottom: 20,
    borderRadius: 8,
  },
  infoContainer: {
    width: '100%',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  text: {
    fontSize: 18,
    marginVertical: 5,
    color: '#333',
  },
  error: {
    fontSize: 18,
    color: 'red',
    marginVertical: 10,
    textAlign: 'center',
  },
});

export default LocationScreen;
