import { StyleSheet, Text, View, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';

const statusColors = {
  approved: '#2ecc40',
  pending: '#ff9800',
  rejected: '#e53935',
};

const LeaveDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [yearlyLeaves, setYearlyLeaves] = useState([]);
  const [loadingYearly, setLoadingYearly] = useState(true);
  const [errorYearly, setErrorYearly] = useState('');
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState(null);

  const fetchLeaves = useCallback(async () => {
    try {
      setError('');
      const school_id = await AsyncStorage.getItem('school_id');
      const staff_id = await AsyncStorage.getItem('staff_id');
      if (!school_id || !staff_id) {
        setError('Missing required IDs. Please log in again.');
        setLeaves([]);
        return;
      }
      const url = `https://api.stpl.cloud/leave/apply/get?school_id=${school_id}&staff_id=${staff_id}`;
      const response = await fetch(url);
      const result = await response.json();
      if (Array.isArray(result)) {
        // Sort by id descending (newest first)
        const sortedLeaves = result.slice().sort((a, b) => b.id - a.id);
        setLeaves(sortedLeaves);
      } else {
        setError('No leave data found.');
        setLeaves([]);
      }
    } catch (err) {
      setError('Failed to load leave data.');
      setLeaves([]);
    }
  }, []);

  const fetchYearlyLeaves = useCallback(async () => {
    try {
      setErrorYearly('');
      setLoadingYearly(true);
      const school_id = await AsyncStorage.getItem('school_id');
      const staff_id = await AsyncStorage.getItem('staff_id');
      if (!school_id || !staff_id) {
        setErrorYearly('Missing required IDs. Please log in again.');
        setYearlyLeaves([]);
        return;
      }
      setCurrentStaffId(staff_id);
      const url = `https://api.stpl.cloud/leave/assign_yearly_leave?school_id=${school_id}`;
      const response = await fetch(url);
      const result = await response.json();
      if (Array.isArray(result)) {
        setYearlyLeaves(result);
      } else {
        setErrorYearly('No yearly leave data found.');
        setYearlyLeaves([]);
      }
    } catch (err) {
      setErrorYearly('Failed to load yearly leave data.');
      setYearlyLeaves([]);
    } finally {
      setLoadingYearly(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchLeaves().finally(() => setLoading(false));
    fetchYearlyLeaves();
  }, [fetchLeaves, fetchYearlyLeaves]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchLeaves(), fetchYearlyLeaves()]);
    setRefreshing(false);
  };

  // Get unique leave types from yearly leaves data
  const getLeaveTypes = () => {
    if (!yearlyLeaves.length) return [];
    const allLeaveTypes = yearlyLeaves.flatMap(staff => staff.leave_heads);
    const uniqueTypes = [];
    const seen = new Set();
    
    allLeaveTypes.forEach(leave => {
      if (!seen.has(leave.leave_head_id)) {
        seen.add(leave.leave_head_id);
        uniqueTypes.push({
          leave_head_id: leave.leave_head_id,
          leave_head_name: leave.leave_head_name
        });
      }
    });
    
    return uniqueTypes;
  };

  // Get current staff's leave data
  const getCurrentStaffLeaveData = () => {
    if (!currentStaffId || !yearlyLeaves.length) return null;
    return yearlyLeaves.find(staff => staff.staff_id.toString() === currentStaffId.toString());
  };

  // Get specific leave type data for current staff
  const getLeaveTypeData = (leaveHeadId) => {
    const staffData = getCurrentStaffLeaveData();
    if (!staffData) return null;
    return staffData.leave_heads.find(leave => leave.leave_head_id === leaveHeadId);
  };

  const handleLeaveTypePress = (leaveType) => {
    setSelectedLeaveType(leaveType);
    setShowLeaveModal(true);
  };

  const renderLeaveTypeBox = (leaveType) => {
    const leaveData = getLeaveTypeData(leaveType.leave_head_id);
    const usedLeaves = leaveData ? (leaveData.total_leave_count - leaveData.remaining_leave_count) : 0;
    
    return (
      <TouchableOpacity
        key={leaveType.leave_head_id}
        style={styles.leaveTypeBox}
        onPress={() => handleLeaveTypePress(leaveType)}
      >
        <Text style={styles.leaveTypeName}>{leaveType.leave_head_name}</Text>
        <View style={styles.leaveStats}>
          <View style={styles.leaveStatItem}>
            <Text style={styles.leaveStatNumber}>{leaveData?.total_leave_count || 0}</Text>
            <Text style={styles.leaveStatLabel}>Total</Text>
          </View>
          <View style={styles.leaveStatItem}>
            <Text style={[styles.leaveStatNumber, { color: '#2ecc40' }]}>{leaveData?.remaining_leave_count || 0}</Text>
            <Text style={styles.leaveStatLabel}>Remaining</Text>
          </View>
          <View style={styles.leaveStatItem}>
            <Text style={[styles.leaveStatNumber, { color: '#e53935' }]}>{usedLeaves}</Text>
            <Text style={styles.leaveStatLabel}>Used</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLeaveModal = () => {
    if (!selectedLeaveType) return null;
    
    const leaveData = getLeaveTypeData(selectedLeaveType.leave_head_id);
    const usedLeaves = leaveData ? (leaveData.total_leave_count - leaveData.remaining_leave_count) : 0;
    const staffData = getCurrentStaffLeaveData();

    return (
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedLeaveType.leave_head_name}</Text>
              <TouchableOpacity onPress={() => setShowLeaveModal(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            
            {staffData && (
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{staffData.staff_name}</Text>
                <Text style={styles.staffId}>Staff ID: {staffData.staff_id}</Text>
              </View>
            )}

            <View style={styles.leaveDetails}>
              <View style={styles.leaveDetailRow}>
                <Text style={styles.leaveDetailLabel}>Total Leave Count:</Text>
                <Text style={styles.leaveDetailValue}>{leaveData?.total_leave_count || 0}</Text>
              </View>
              <View style={styles.leaveDetailRow}>
                <Text style={styles.leaveDetailLabel}>Remaining Leave:</Text>
                <Text style={[styles.leaveDetailValue, { color: '#2ecc40' }]}>{leaveData?.remaining_leave_count || 0}</Text>
              </View>
              <View style={styles.leaveDetailRow}>
                <Text style={styles.leaveDetailLabel}>Used Leave:</Text>
                <Text style={[styles.leaveDetailValue, { color: '#e53935' }]}>{usedLeaves}</Text>
              </View>
              <View style={styles.leaveDetailRow}>
                <Text style={styles.leaveDetailLabel}>Date Assigned:</Text>
                <Text style={styles.leaveDetailValue}>{staffData?.date_created || '-'}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderLeave = ({ item }) => {
    // Calculate days (inclusive)
    let days = 0;
    if (item.from_date && item.to_date && item.from_date !== 'string' && item.to_date !== 'string') {
      const from = new Date(item.from_date);
      const to = new Date(item.to_date);
      days = Math.max(1, Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1);
    }
    let statusColor = '#222';
    if (item.status?.toLowerCase() === 'approved') statusColor = '#2ecc40';
    if (item.status?.toLowerCase() === 'rejected') statusColor = '#e53935';
    if (item.status?.toLowerCase() === 'pending') statusColor = '#ff9800';

    return (
      <View style={styles.leaveCard}>
        <Text style={styles.subject}>{item.reason || 'No reason provided'}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Date: </Text>
          <Text style={styles.value}>{item.from_date} to {item.to_date}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Days: </Text>
          <Text style={styles.value}>{days}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status: </Text>
          <Text style={[styles.status, { color: statusColor }]}>{item.status}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Leave Type: </Text>
          <Text style={styles.value}>{item.leave_head_name || '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Location: </Text>
          <Text style={styles.value}>{item.location || '-'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Leave Dashboard" />
      
      {/* Leave Type Boxes */}
      <View style={styles.leaveTypeContainer}>
        <Text style={styles.leaveTypeTitle}>Leave Balance</Text>
        {loadingYearly ? (
          <ActivityIndicator size="small" color="#007bff" style={{ marginVertical: 20 }} />
        ) : errorYearly ? (
          <Text style={styles.errorText}>{errorYearly}</Text>
        ) : (
          <View style={styles.leaveTypeBoxes}>
            {getLeaveTypes().map(renderLeaveTypeBox)}
          </View>
        )}
      </View>

      {/* Leave History */}
      <View style={styles.leaveHistoryContainer}>
        <Text style={styles.leaveHistoryTitle}>Leave History</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <FlatList
            data={leaves}
            keyExtractor={(item, index) =>
              item.leave_id ? String(item.leave_id) : (item.id ? String(item.id) : String(index))
            }
            renderItem={renderLeave}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>No leaves found.</Text>}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>

      {renderLeaveModal()}
    </View>
  );
};

export default LeaveDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  listContent: {
    padding: 10,
    paddingTop: 16,
  },
  leaveCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    color: '#555',
    fontWeight: '600',
    minWidth: 60,
  },
  value: {
    fontSize: 10,
    color: '#222',
    fontWeight: '400',
  },
  status: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  subject: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 4,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginTop: 40,
    textAlign: 'center',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  leaveTypeContainer: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  leaveTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 12,
  },
  leaveTypeBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leaveTypeBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    width: '30%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  leaveTypeName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 6,
    textAlign: 'center',
  },
  leaveStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leaveStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  leaveStatNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007bff',
  },
  leaveStatLabel: {
    fontSize: 7,
    color: '#666',
    marginTop: 1,
  },
  leaveHistoryContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  leaveHistoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
    flex: 1,
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
    padding: 4,
  },
  staffInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 4,
  },
  staffId: {
    fontSize: 12,
    color: '#666',
  },
  leaveDetails: {
    gap: 12,
  },
  leaveDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leaveDetailLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  leaveDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003366',
  },
});