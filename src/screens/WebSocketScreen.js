import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, PermissionsAndroid, Alert } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import Header from '../components/Header';
import Geolocation from '@react-native-community/geolocation';
import { BleManager, State } from 'react-native-ble-plx';

// Configure Geolocation
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
  enableBackgroundLocationUpdates: true,
  forceRequestLocation: true,
  forceLocationManager: false,
  showLocationDialog: true,
  openSettingsIfLocationHasBeenDenied: true,
});

const WebSocketScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [location, setLocation] = useState(null);
  const ws = useRef(null);
  const bleManager = useRef(new BleManager());
  const locationWatchId = useRef(null);
  const lastLocationUpdate = useRef(null);

  useEffect(() => {
    // Request permissions
    requestPermissions();
    // Initialize WebSocket connection
    connectWebSocket();
    // Start location tracking
    startLocationTracking();
    // Start Bluetooth scanning in background
    startBackgroundBluetoothScan();

    // Cleanup on component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      stopBluetoothScan();
      if (locationWatchId.current) {
        Geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        console.log('Permissions granted:', granted);
      } catch (err) {
        console.warn('Permission error:', err);
      }
    }
  };

  const connectWebSocket = () => {
    // Replace with your WebSocket server URL
    const wsUrl = 'wss://api.steponebeacon.com/ws';
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      setConnectionStatus('Connected');
      addMessage('System', 'Connected to server');
      // Send initial location if available
      if (location) {
        sendLocationUpdate(location);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      setConnectionStatus('Disconnected');
      addMessage('System', 'Disconnected from server');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setConnectionStatus('Error');
      addMessage('System', 'Error: ' + error.message);
    };

    ws.current.onmessage = (event) => {
      console.log('Received:', event.data);
      try {
        const data = JSON.parse(event.data);
        addMessage(data.sender || 'Server', data.message);
      } catch (e) {
        addMessage('Server', event.data);
      }
    };
  };

  const startLocationTracking = () => {
    try {
      // Get initial position with increased timeout
      Geolocation.getCurrentPosition(
        position => {
          console.log('Initial position received:', JSON.stringify(position, null, 2));
          const { latitude, longitude, accuracy } = position.coords;
          const newLocation = { latitude, longitude, accuracy };
          setLocation(newLocation);
          sendLocationUpdate(newLocation);
        },
        error => {
          console.error('Location error:', error);
          retryGetLocation();
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
          forceRequestLocation: true,
        }
      );

      // Watch position for updates with more lenient settings
      locationWatchId.current = Geolocation.watchPosition(
        position => {
          console.log('Position update received:', JSON.stringify(position, null, 2));
          const { latitude, longitude, accuracy } = position.coords;
          const newLocation = { latitude, longitude, accuracy };
          setLocation(newLocation);
          sendLocationUpdate(newLocation);
        },
        error => {
          console.error('Location watch error:', error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 5000,
          fastestInterval: 2000,
          forceRequestLocation: true,
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const retryGetLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        console.log('Retry position received:', JSON.stringify(position, null, 2));
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = { latitude, longitude, accuracy };
        setLocation(newLocation);
        sendLocationUpdate(newLocation);
      },
      error => {
        console.error('Retry location error:', error);
        if (error.code === 3) {
          getBasicLocation();
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 60000,
        maximumAge: 1000 * 60 * 5,
        forceRequestLocation: true,
      }
    );
  };

  const getBasicLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        console.log('Basic position received:', JSON.stringify(position, null, 2));
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = { latitude, longitude, accuracy };
        setLocation(newLocation);
        sendLocationUpdate(newLocation);
      },
      error => {
        console.error('Basic location error:', error);
        addMessage('System', 'Unable to get location. Please check your location settings.');
      },
      {
        enableHighAccuracy: false,
        timeout: 120000,
        maximumAge: Infinity,
        forceRequestLocation: true,
      }
    );
  };

  const startBackgroundBluetoothScan = async () => {
    try {
      const state = await bleManager.current.state();
      console.log('Bluetooth state:', state);
      if (state === State.PoweredOn) {
        startBluetoothScan();
      }
    } catch (error) {
      console.error('Error checking Bluetooth state:', error);
    }
  };

  const startBluetoothScan = async () => {
    try {
      console.log('Starting Bluetooth scan...');
      bleManager.current.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('Bluetooth scan error:', error);
          return;
        }

        if (device) {
          console.log('Device found:', device.name || device.id);
          sendBluetoothUpdate(device);
        }
      });
    } catch (error) {
      console.error('Error starting Bluetooth scan:', error);
    }
  };

  const stopBluetoothScan = async () => {
    try {
      console.log('Stopping Bluetooth scan...');
      await bleManager.current.stopDeviceScan();
    } catch (error) {
      console.error('Error stopping Bluetooth scan:', error);
    }
  };

  const sendLocationUpdate = (locationData) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Check if enough time has passed since last update (5 seconds)
      const now = Date.now();
      if (lastLocationUpdate.current && now - lastLocationUpdate.current < 5000) {
        return;
      }
      lastLocationUpdate.current = now;

      const messageData = {
        type: 'location',
        data: {
          latitude: parseFloat(locationData.latitude.toFixed(6)),
          longitude: parseFloat(locationData.longitude.toFixed(6)),
          accuracy: locationData.accuracy || 0,
          timestamp: new Date().toISOString()
        }
      };
      console.log('Sending location data:', JSON.stringify(messageData, null, 2));
      ws.current.send(JSON.stringify(messageData));
      addMessage('Location', `Lat: ${messageData.data.latitude}, Long: ${messageData.data.longitude}`);
    }
  };

  const sendBluetoothUpdate = (device) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const messageData = {
        type: 'bluetooth',
        data: {
          id: device.id,
          name: device.name || 'Unknown Device',
          rssi: device.rssi,
          timestamp: new Date().toISOString()
        }
      };
      console.log('Sending Bluetooth data:', JSON.stringify(messageData, null, 2));
      ws.current.send(JSON.stringify(messageData));
    }
  };

  const addMessage = (sender, message) => {
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: Date.now(),
        sender,
        message,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const messageData = {
      sender: 'User',
      message: inputMessage,
      timestamp: new Date().toISOString()
    };

    ws.current.send(JSON.stringify(messageData));
    addMessage('You', inputMessage);
    setInputMessage('');
  };

  const reconnect = () => {
    if (ws.current) {
      ws.current.close();
    }
    connectWebSocket();
  };

  return (
    <View style={styles.container}>
      <Header/>
      <View style={styles.header}>
        <Text style={styles.headerText}>WebSocket Chat</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }]} />
          <Text style={styles.statusText}>{connectionStatus}</Text>
        </View>
      </View>

      {location && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      <ScrollView style={styles.messagesContainer}>
        {messages.map((msg) => (
          <View key={msg.id} style={styles.messageBubble}>
            <Text style={styles.messageSender}>{msg.sender}</Text>
            <Text style={styles.messageText}>{msg.message}</Text>
            <Text style={styles.messageTime}>{msg.timestamp}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type a message..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity 
          style={[styles.sendButton, !isConnected && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={!isConnected}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.reconnectButton} 
        onPress={reconnect}
      >
        <Text style={styles.reconnectButtonText}>Reconnect</Text>
      </TouchableOpacity>
    </View>
  )
}

export default WebSocketScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    // padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    color: '#666',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  infoText: {
    color: '#333',
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 10,
  },
  messageBubble: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '80%',
    elevation: 1,
  },
  messageSender: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  messageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    elevation: 2,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  reconnectButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  reconnectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
})