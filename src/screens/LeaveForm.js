import { StyleSheet, Text, View, TextInput, TouchableOpacity, Platform, ScrollView, Modal, FlatList, Alert, RefreshControl } from 'react-native';
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const leaveTypes = [
  // { label: 'Select Leave Type', value: '' },
  { label: 'Casual Leave', value: 'casual' },
  { label: 'Sick Leave', value: 'sick' },
  { label: 'Earned Leave', value: 'earned' },
];
const dayTypes = [
  { label: 'Full Day', value: 'full' },
  { label: 'Half Day', value: 'half' },
];

const CustomDropdown = ({ label, value, options, onSelect }) => {
  const [visible, setVisible] = useState(false);
  const selectedLabel = options.find(opt => opt.value === value)?.label || label;
  const optionHeight = 40; // px, adjust as needed
  const maxVisibleOptions = 5;
  const modalHeight = Math.min(options.length, maxVisibleOptions) * optionHeight;
  return (
    <View style={{ marginBottom: 8 }}>
      <TouchableOpacity
        style={styles.dropdownBox}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownText}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={16} color="#888" style={styles.dropdownIcon} />
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setVisible(false)}>
          <View style={[styles.dropdownModalContent, { height: modalHeight }]}>
            <FlatList
              data={options}
              keyExtractor={item => String(item.value)}
              getItemLayout={(_, index) => ({ length: optionHeight, offset: optionHeight * index, index })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dropdownOption, { height: optionHeight }]}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const LeaveDashboard = () => {
  const [leaveType, setLeaveType] = useState('');
  const [dayType, setDayType] = useState('full');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [reason, setreason] = useState('');
  const [location, setLocation] = useState('');
  const [toThe, setToThe] = useState('');
  const [toTheReadOnly, setToTheReadOnly] = useState(false);
  const [leaveHeadId, setLeaveHeadId] = useState('');
  const [status, setStatus] = useState('Pending');
  const [leaveTypesOptions, setLeaveTypesOptions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Move fetch functions outside useEffect for reuse
  const fetchAuthority = async () => {
    try {
      const school_id = await AsyncStorage.getItem('school_id');
      const staff_id = await AsyncStorage.getItem('staff_id');
      if (!school_id || !staff_id) return;
      const url = `https://api.stpl.cloud/leave/assign_employees_to_authority/get/?school_id=${school_id}`;
      const response = await fetch(url);
      const result = await response.json();
      if (Array.isArray(result)) {
        // Find assignment for this staff_id
        const assignment = result.find(a => String(a.staff_head_id) === String(staff_id));
        if (assignment && assignment.staff_head_name) {
          setToThe(assignment.staff_head_name);
          setToTheReadOnly(true);
          return;
        }
      }
      setToThe('');
      setToTheReadOnly(false);
    } catch (err) {
      setToThe('');
      setToTheReadOnly(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const school_id = await AsyncStorage.getItem('school_id');
      const staff_id = await AsyncStorage.getItem('staff_id');
      if (!school_id || !staff_id) return;
      const url = `https://api.stpl.cloud/leave/get_leave_status/?school_id=${school_id}`;
      const response = await fetch(url);
      const result = await response.json();
      if (Array.isArray(result)) {
        setLeaveTypesOptions(result.map(lh => ({ label: lh.leave_head, value: lh.id })));
      } else {
        setLeaveTypesOptions([]);
      }
    } catch (err) {
      setLeaveTypesOptions([]);
    }
  };

  useEffect(() => {
    fetchAuthority();
    fetchLeaveTypes();
  }, []);

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    // Reset all form fields
    setLeaveType('');
    setDayType('full');
    setFromDate(null);
    setToDate(null);
    setShowFromPicker(false);
    setShowToPicker(false);
    setreason('');
    setLocation('');
    setToThe('');
    setToTheReadOnly(false);
    setLeaveHeadId('');
    setStatus('Pending');
    // Re-fetch data
    await Promise.all([
      fetchAuthority(),
      fetchLeaveTypes(),
    ]);
    setRefreshing(false);
  };

  // Calculate days
  let days = 0;
  if (fromDate && toDate) {
    days = Math.max(1, Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1);
  }

  // Reset form fields
  const resetForm = () => {
    setLeaveType('');
    setDayType('full');
    setFromDate(null);
    setToDate(null);
    setShowFromPicker(false);
    setShowToPicker(false);
    setreason('');
    setLocation('');
    setToThe('');
    setToTheReadOnly(false);
    setLeaveHeadId('');
    setStatus('Pending');
  };

  const handleSubmit = async () => {
    // Validate all fields
    if (!leaveType || !dayType || !fromDate || !toDate || !reason || !location || !toThe || !leaveHeadId) {
      Alert.alert('Validation Error', 'Please fill all fields before submitting.');
      return;
    }
    try {
      const school_id = await AsyncStorage.getItem('school_id');
      const staff_id = await AsyncStorage.getItem('staff_id');
      // staff_head_id from 'to the' (should be staff_id of head)
      let staff_head_id = null;
      if (toTheReadOnly && toThe) {
        // Try to get staff_head_id from authority assignment API
        const url = `https://api.stpl.cloud/leave/assign_employees_to_authority/get/?school_id=${school_id}`;
        const response = await fetch(url);
        const result = await response.json();
        if (Array.isArray(result)) {
          const assignment = result.find(a => a.staff_head_name === toThe);
          if (assignment && assignment.staff_head_id) {
            staff_head_id = assignment.staff_head_id;
          }
        }
      }
      if (!school_id || !staff_id || !staff_head_id) {
        Alert.alert('Error', 'Missing required IDs. Please log in again.');
        return;
      }
      const payload = {
        school_id: Number(school_id),
        staff_id: Number(staff_id),
        staff_head_id: Number(staff_head_id),
        from_date: fromDate.toISOString().split('T')[0],
        to_date: toDate.toISOString().split('T')[0],
        reason,
        status,
        leave_head_id: Number(leaveHeadId),
        day_type: dayType === 'full' ? 'Full Day' : 'Half Day',
        location,
      };
      console.log('Payload:', payload); // Log the payload for debugging
      const response = await fetch('https://api.stpl.cloud/leave/apply/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result && result.message === 'Leave Application Submitted Successfully') {
        Alert.alert('Success', 'Leave application submitted successfully!');
        resetForm();
      } else {
        Alert.alert('Error', result.message || JSON.stringify(result) || 'Failed to submit leave application.');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while submitting the leave application.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f7fa' }}>
      <Header />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Please Fill Below Fields to apply for Leave Application</Text>
        <View style={styles.formSection}>
          {/* To the */}
          <Text style={styles.label}>To the</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter recipient"
            value={toThe}
            onChangeText={setToThe}
            placeholderTextColor="#bbb"
            editable={!toTheReadOnly}
          />
          {/* Leave Type (Custom Dropdown) */}
          <Text style={styles.label}>Leave Type</Text>
          <CustomDropdown
            label="Select Leave Type"
            value={leaveHeadId}
            options={leaveTypesOptions}
            onSelect={(val) => {
              setLeaveHeadId(val);
              const found = leaveTypesOptions.find(opt => opt.value === val);
              setLeaveType(found ? found.label : '');
            }}
          />

          {/* Full Day/Half Day (Custom Dropdown) */}
          <Text style={styles.label}>Full Day/Half Day</Text>
          <CustomDropdown
            label="Select Day Type"
            value={dayType}
            options={dayTypes}
            onSelect={setDayType}
          />

          {/* From Date */}
          <Text style={styles.label}>From Date</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowFromPicker(true)}>
            <Ionicons name="calendar" size={14} color="#888" style={{ marginRight: 8 }} />
            <Text style={{ color: fromDate ? '#222' : '#aaa' }}>
              {fromDate ? fromDate.toLocaleDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>
          {showFromPicker && (
            <DateTimePicker
              value={fromDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, date) => {
                setShowFromPicker(false);
                if (date) setFromDate(date);
              }}
            />
          )}

          {/* To Date */}
          <Text style={styles.label}>To Date</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowToPicker(true)}>
            <Ionicons name="calendar" size={14} color="#888" style={{ marginRight: 8 }} />
            <Text style={{ color: toDate ? '#222' : '#aaa' }}>
              {toDate ? toDate.toLocaleDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>
          {showToPicker && (
            <DateTimePicker
              value={toDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, date) => {
                setShowToPicker(false);
                if (date) setToDate(date);
              }}
            />
          )}

          {/* Days */}
          <Text style={styles.label}>Days</Text>
          <View style={styles.readonlyBox}>
            <Text style={{ color: '#888', fontSize: 16 }}>{days}</Text>
          </View>

          {/* Purpose */}
          <Text style={styles.label}>reason</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter reason"
            value={reason}
            onChangeText={setreason}
            placeholderTextColor="#bbb"
          />

          {/* Location */}
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Location"
            value={location}
            onChangeText={setLocation}
            placeholderTextColor="#bbb"
          />

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <MaterialIcons name="save" size={15} color="#222" style={{ marginRight: 6 }} />
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default LeaveDashboard;

const styles = StyleSheet.create({
  container: {
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 8,
    elevation: 1,
    borderColor: '#eaeaea',
    borderWidth: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
    padding: 5,
    backgroundColor: '#f6f7fa',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  formSection: {
    padding: 5,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 10,
    marginTop: 7,
    marginBottom: 3,
    color: '#222',
  },
  dropdownBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#faf9f6',
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  dropdownText: {
    flex: 1,
    fontSize: 12,
    color: '#222',
  },
  dropdownIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: -8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 1,
    minWidth: '70%',
    elevation: 4,
    maxHeight: 250,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownOptionText: {
    fontSize: 12,
    color: '#222',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 7,
    marginBottom: 4,
    backgroundColor: '#faf9f6',
  },
  readonlyBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 7,
    marginBottom: 4,
    backgroundColor: '#f5f5f5',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 4,
    backgroundColor: '#faf9f6',
    color: '#222',
    fontSize: 11,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd600',
    borderRadius: 4,
    paddingVertical: 8,
    justifyContent: 'center',
    marginTop: 11,
    marginBottom: 5,
    shadowColor: '#ffd600',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  submitText: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 11,
  },
});