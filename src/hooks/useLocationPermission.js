// src/hooks/useLocationPermission.js
import { useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

const useLocationPermission = () => {
  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app requires access to your location.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Required', 'Location permission is required to use this app.');
          }
        } catch (err) {
          console.warn('Permission error:', err);
        }
      }
    };

    requestPermission();
  }, []);
};

export default useLocationPermission;
