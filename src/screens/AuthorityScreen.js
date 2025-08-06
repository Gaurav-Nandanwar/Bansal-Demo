import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, TextInput, RefreshControl, Alert, ActivityIndicator, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Remove dummyData, use API data

const boxConfig = [
  { key: 'pending', label: 'Pending', color: '#ffe0b2' }, // faded orange
  { key: 'approved', label: 'Approved', color: '#c8f7c5' }, // faded green
  { key: 'rejected', label: 'Rejected', color: '#ffcdd2' }, // faded red
  { key: 'total', label: 'Total', color: '#bbdefb' }, // faded blue
];

const AuthorityScreen = () => {
  const [selected, setSelected] = useState('pending');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAction, setModalAction] = useState(''); // 'Approve' or 'Reject'
  const [modalEmployee, setModalEmployee] = useState(null);
  const [remark, setRemark] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [errorLeaves, setErrorLeaves] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalEmployees, setTotalEmployees] = useState([]);
  const [loadingTotal, setLoadingTotal] = useState(true);
  const [errorTotal, setErrorTotal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(true);
  const [errorAssigned, setErrorAssigned] = useState('');

  // Fetch leaves from API
  const fetchLeaves = async () => {
    try {
      setErrorLeaves('');
      setLoadingLeaves(true);
      const school_id = await AsyncStorage.getItem('school_id');
      const staff_id = await AsyncStorage.getItem('staff_id');
      if (!school_id || !staff_id) {
        setLeaves([]);
        setErrorLeaves('Missing required IDs. Please log in again.');
        setLoadingLeaves(false);
        return;
      }
      const url = `https://api.stpl.cloud/leave/apply/get?school_id=${school_id}&staff_id=${staff_id}`;
      const response = await fetch(url);
      const result = await response.json();
      if (Array.isArray(result)) {
        setLeaves(result);
      } else {
        setLeaves([]);
        setErrorLeaves('No leave data found.');
      }
    } catch (err) {
      setLeaves([]);
      setErrorLeaves('Failed to load leave data.');
    } finally {
      setLoadingLeaves(false);
    }
  };

  // Fetch total employees from authority API
  const fetchTotalEmployees = async () => {
    try {
      setErrorTotal('');
      setLoadingTotal(true);
      const school_id = await AsyncStorage.getItem('school_id');
      if (!school_id) {
        setTotalEmployees([]);
        setErrorTotal('Missing school_id. Please log in again.');
        setLoadingTotal(false);
        return;
      }
      const url = `https://api.stpl.cloud/leave/assign_employees_to_authority/get/?school_id=${school_id}`;
      const response = await fetch(url);
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        // Combine all employees from all assignments for this school
        const allEmployees = result.flatMap(a => a.employees || []);
        setTotalEmployees(allEmployees);
      } else {
        setTotalEmployees([]);
        setErrorTotal('No employees found.');
      }
    } catch (err) {
      setTotalEmployees([]);
      setErrorTotal('Failed to load employees.');
    } finally {
      setLoadingTotal(false);
    }
  };

  // Fetch employees assigned to the authority of the logged-in employee
  const fetchAssignedEmployees = async (empId) => {
    try {
      setErrorAssigned('');
      setLoadingAssigned(true);
      // For now, we'll use the total employees as assigned employees
      // This can be updated later if a specific API for assigned employees is available
      const school_id = await AsyncStorage.getItem('school_id');
      if (!school_id) {
        setAssignedEmployees([]);
        setAssignedEmployeeIds([]);
        setErrorAssigned('Missing school_id. Please log in again.');
        setLoadingAssigned(false);
        return;
      }
      const url = `https://api.stpl.cloud/leave/assign_employees_to_authority/get/?school_id=${school_id}`;
      const response = await fetch(url);
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        // Combine all employees from all assignments for this school
        const allEmployees = result.flatMap(a => a.employees || []);
        setAssignedEmployees(allEmployees);
        setAssignedEmployeeIds(allEmployees.map(e => String(e.employee_id || e.staff_id)));
      } else {
        setAssignedEmployees([]);
        setAssignedEmployeeIds([]);
        setErrorAssigned('No employees found.');
      }
    } catch (err) {
      setAssignedEmployees([]);
      setAssignedEmployeeIds([]);
      setErrorAssigned('Failed to load employees.');
    } finally {
      setLoadingAssigned(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    const getEmployeeId = async () => {
      const id = await AsyncStorage.getItem('employee_id');
      setEmployeeId(id);
    };
    getEmployeeId();
    fetchLeaves();
    fetchTotalEmployees();
  }, []);

  // Fetch assigned employees when employeeId is available
  useEffect(() => {
    if (employeeId) {
      fetchAssignedEmployees(employeeId);
    }
  }, [employeeId]);

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLeaves(),
      fetchTotalEmployees(),
      employeeId ? fetchAssignedEmployees(employeeId) : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  const handleAction = (employee, action) => {
    setModalEmployee(employee);
    setModalAction(action);
    setRemark('');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!modalEmployee) return;
    setSubmitting(true);
    try {
      const url = `https://api.stpl.cloud/leave/update-leave-status/${modalEmployee.id}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: modalAction === 'Approve' ? 'approved' : 'rejected',
          remark: remark || '',
        }),
      });
      const result = await response.json();
      if (response.ok && result) {
        Alert.alert('Success', result.message || `Leave ${modalAction === 'Approve' ? 'approved' : 'rejected'} successfully!`);
        setModalVisible(false);
        setRemark('');
        await fetchLeaves();
      } else {
        const apiMsg = result && result.message ? result.message : 'Failed to update leave status.';
        Alert.alert('Error', apiMsg);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update leave status.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderEmployee = ({ item }) => {
    if (selected === 'pending') {
      return (
        <View style={styles.employeeItemRow}>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{item.staff_name} <Text style={{color:'#888', fontSize:12}}>({item.staff_id})</Text></Text>
            <Text style={{ fontSize: 11, color: '#555' }}>From: {item.from_date} To: {item.to_date}</Text>
            <Text style={{ fontSize: 11, color: '#555' }}>Type: {item.leave_head_name} - {item.day_type}</Text>
            <Text style={{ fontSize: 11, color: '#555' }}>Location: {item.location}</Text>
            <Text style={{ fontSize: 11, color: '#555' }}>Reason: {item.reason}</Text>
          </View>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleAction(item, 'Approve')}
            >
              <Text style={styles.actionBtnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleAction(item, 'Reject')}
            >
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    if (selected === 'approved' || selected === 'rejected') {
      return (
        <View style={styles.employeeItem}>
          <Text style={styles.employeeName}>{item.staff_name} <Text style={{color:'#888', fontSize:12}}>({item.staff_id})</Text></Text>
          <Text style={{ fontSize: 11, color: '#555' }}>From: {item.from_date} To: {item.to_date}</Text>
          <Text style={{ fontSize: 11, color: '#555' }}>Type: {item.leave_head_name} - {item.day_type}</Text>
          <Text style={{ fontSize: 11, color: '#555' }}>Location: {item.location}</Text>
          <Text style={{ fontSize: 11, color: '#555' }}>Reason: {item.reason}</Text>
          <Text style={{ fontSize: 11, color: '#555' }}>Remark: {item.remark || '-'}</Text>
        </View>
      );
    }
    return (
      <View style={styles.employeeItem}>
        <Text style={styles.employeeName}>{item.employee_name}</Text>
      </View>
    );
  };

  // Filter leaves by status for each tab (case-insensitive) and only for assigned employees
  // For new API, just filter by status
  const pendingLeaves = leaves.filter(l => l.status && l.status.toLowerCase() === 'pending');
  const approvedLeaves = leaves.filter(l => l.status && l.status.toLowerCase() === 'approved');
  const rejectedLeaves = leaves.filter(l => l.status && l.status.toLowerCase() === 'rejected');

  // Debug logs
  console.log('assignedEmployeeIds', assignedEmployeeIds, 'leaves', leaves);

  // Fixed header, scrollable content
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      <Header title="Authority" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.row}>
          {boxConfig.map((box) => (
            <TouchableOpacity
              key={box.key}
              style={[
                styles.box,
                { backgroundColor: box.color, borderWidth: selected === box.key ? 2 : 0, borderColor: '#333' },
              ]}
              onPress={() => setSelected(box.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.boxLabel, { color: '#333' }]}>{box.label}</Text>
              <Text style={[styles.boxCount, { color: '#333' }]}> {
                box.key === 'pending' ? pendingLeaves.length :
                box.key === 'approved' ? approvedLeaves.length :
                box.key === 'rejected' ? rejectedLeaves.length :
                box.key === 'total' ? totalEmployees.length : 0
              }</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Employees:</Text>
          {selected === 'total' ? (
            loadingTotal ? (
              <Text style={styles.emptyText}>Loading...</Text>
            ) : errorTotal ? (
              <Text style={styles.emptyText}>{errorTotal}</Text>
            ) : (
              <FlatList
                data={totalEmployees}
        keyExtractor={(_, idx) => `employee_${idx}`}
                renderItem={({ item }) => (
                  <View style={styles.employeeItem}>
                    <Text style={styles.employeeName}>{item.staff_name}</Text>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No employees found.</Text>}
                scrollEnabled={false}
              />
            )
          ) : (
            loadingLeaves ? (
              <Text style={styles.emptyText}>Loading...</Text>
            ) : errorLeaves ? (
              <Text style={styles.emptyText}>{errorLeaves}</Text>
            ) : (
              <FlatList
                data={
                  selected === 'pending' ? pendingLeaves :
                  selected === 'approved' ? approvedLeaves :
                  selected === 'rejected' ? rejectedLeaves :
                  []
                }
                keyExtractor={(item, idx) =>
                  item.id ? `leave_${item.id}_${idx}` : `leave_idx_${idx}`
                }
                renderItem={renderEmployee}
                ListEmptyComponent={<Text style={styles.emptyText}>No employees found.</Text>}
                scrollEnabled={false}
              />
            )
          )}
        </View>
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalAction} Leave Request</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.employeeInfoCard}>
                <Text style={styles.modalEmployeeName}>{modalEmployee?.staff_name}</Text>
                <Text style={styles.employeeId}>ID: {modalEmployee?.staff_id}</Text>
                <View style={styles.dateInfo}>
                  <Text style={styles.dateLabel}>From: {modalEmployee?.from_date}</Text>
                  <Text style={styles.dateLabel}>To: {modalEmployee?.to_date}</Text>
                </View>
                <Text style={styles.leaveTypeLabel}>Leave Type: {modalEmployee?.leave_head_name}</Text>
                <Text style={styles.dayTypeLabel}>Day Type: {modalEmployee?.day_type}</Text>
                <Text style={styles.locationLabel}>Location: {modalEmployee?.location}</Text>
                <Text style={styles.reasonLabel}>Reason:</Text>
                <Text style={styles.reasonText}>{modalEmployee?.reason}</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Add Remark (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your remark here..."
                  value={remark}
                  onChangeText={setRemark}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.submitBtn, modalAction === 'Approve' ? styles.approveBtn : styles.rejectBtn]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>{modalAction}</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)} 
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};


export default AuthorityScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    marginBottom: 8,
  },
  box: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  boxLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  boxCount: {
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    elevation: 1,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#003366',
  },
  employeeItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  employeeItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  employeeInfo: {
    flex: 1,
    marginRight: 10,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    minWidth: 70,
  },
  approveBtn: {
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  employeeInfoCard: {
    paddingHorizontal: 25,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 25,
    marginTop: 20,
    borderRadius: 12,
  },
  modalEmployeeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  employeeId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  dateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  reasonText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  leaveTypeLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
    marginBottom: 5,
  },
  dayTypeLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
    marginBottom: 5,
  },
  locationLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
    marginBottom: 10,
  },
  inputContainer: {
    paddingHorizontal: 25,
    paddingVertical: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    minHeight: 80,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  modalButtons: {
    paddingHorizontal: 25,
    paddingBottom: 25,
    gap: 12,
  },
  submitBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});