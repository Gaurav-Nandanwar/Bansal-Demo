import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, RefreshControl
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import Header from '../components/Header';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const InquiryScreen = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    email: '',
    mobileNo: '',
    whatappNo: '',
    address: '',
    productDetails: '',
    budget: '',
    followup1: '',
    status: 'Pending',
    reason: '',
  });
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [inquiryHistory, setInquiryHistory] = useState([]);

  const initialFormState = {
    clientName: '',
    email: '',
    mobileNo: '',
    whatappNo: '',
    address: '',
    productDetails: '',
    budget: '',
    followup1: '',
    status: 'Pending',
    reason: '',
  };

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleConfirm = (date) => {
    setForm({ ...form, followup1: moment(date).format('YYYY-MM-DD') });
    setDatePickerVisibility(false);
  };

  const fetchInquiries = async () => {
    try {
      const response = await axios.get(
        'https://aglobiaerp.com/aglobiaerpProject/webApi/staff/showEmployeeInquiry/'
      );

      if (response.status === 200 && Array.isArray(response.data)) {
        const formatted = response.data.map((item) => {
          const data = item.name;
          return {
            id: data.id,
            clientName: data.clientName,
            email: data.email,
            mobileNo: data.mobileNo,
            whatappNo: data.whatappNo,
            address: data.address,
            productDetails: data.productDetails,
            budget: data.budget?.toString() ?? '',
            followup1: data.followup1,
            status: data.inquirystatus || 'Pending',
            reason: data.reason || '',
          };
        });
        setInquiries(formatted);
      }
    } catch (error) {
      console.error('Fetch Inquiries Error:', error);
      Alert.alert('Error', 'Failed to fetch inquiries. Please check your network and try again.');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchInquiries();
    } catch (error) {
      console.error('Error refreshing inquiries:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setRecentInquiries([]); // Clear recent inquiries on mount (new session)
    fetchInquiries();
  }, []);

  const handleSubmit = async () => {
    const { clientName, email, mobileNo, whatappNo, address, productDetails, budget, followup1 } = form;

    // Validation for required fields
    if (!clientName || !email || !mobileNo || !whatappNo || !address || !productDetails || !budget || !followup1) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    // Validation for contact and WhatsApp numbers
    if (mobileNo.length !== 10 || whatappNo.length !== 10) {
      Alert.alert('Validation Error', 'Mobile and WhatsApp numbers must be 10 digits.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    // Budget validation
    if (isNaN(budget) || Number(budget) <= 0) {
      Alert.alert('Validation Error', 'Budget must be a valid positive number.');
      return;
    }

    try {
      const response = await axios.post(
        'https://aglobiaerp.com/aglobiaerpProject/webApi/staff/createEmployeeInquiry/',
        {
          staff: 7,
          clientName,
          email,
          mobileNo,
          whatappNo,
          address,
          productDetails,
          followup1,
          budget: budget.toString(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        Alert.alert(
          'Success',
          'Inquiry submitted successfully.',
          [
            {
              text: 'View Today\'s Inquiries',
              onPress: () => {
                setModalVisible(false);
                setForm(initialFormState);
                navigation.navigate('TodaysInquiry');
              },
            },
            {
              text: 'Stay Here',
              onPress: () => {
                setModalVisible(false);
                setForm(initialFormState);
              },
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit inquiry. Please try again.');
      }
    } catch (error) {
      console.error('Submit Inquiry Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'An error occurred while submitting the inquiry.');
    }
  };

  const handleEdit = async () => {
    const { clientName, email, mobileNo, whatappNo, address, productDetails, budget, followup1, reason } = form;

    // Validation for required fields
    if (!clientName || !email || !mobileNo || !whatappNo || !address || !productDetails || !budget || !followup1) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    // Validation for contact and WhatsApp numbers
    if (mobileNo.length !== 10 || whatappNo.length !== 10) {
      Alert.alert('Validation Error', 'Mobile and WhatsApp numbers must be 10 digits.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    // Budget validation
    if (isNaN(budget) || Number(budget) <= 0) {
      Alert.alert('Validation Error', 'Budget must be a valid positive number.');
      return;
    }

    try {
      const response = await axios.post(
        `https://aglobiaerp.com/aglobiaerpProject/webApi/staff/updateEmployeeInquiry/${selectedInquiry.id}/`,
        {
          staff: 7,
          clientName,
          email,
          mobileNo,
          whatappNo,
          address,
          productDetails,
          followup1,
          budget: budget.toString(),
          reason: reason || 'Updated inquiry details',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        Alert.alert('Success', response.data.message || 'Inquiry updated successfully.');
        await fetchInquiries();
        setEditModalVisible(false);
        setDetailModalVisible(false);
        setForm(initialFormState);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update inquiry.');
      }
    } catch (error) {
      console.error('Update Inquiry Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'An error occurred while updating the inquiry.');
    }
  };

  const openDetailModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setDetailModalVisible(true);
  };

  const openEditModal = () => {
    setForm({
      clientName: selectedInquiry.clientName,
      email: selectedInquiry.email,
      mobileNo: selectedInquiry.mobileNo,
      whatappNo: selectedInquiry.whatappNo,
      address: selectedInquiry.address,
      productDetails: selectedInquiry.productDetails,
      budget: selectedInquiry.budget,
      followup1: selectedInquiry.followup1,
      status: selectedInquiry.status,
      reason: '',
    });
    setDetailModalVisible(false);
    setEditModalVisible(true);
  };

  const openAddModal = () => {
    setForm(initialFormState); // Reset form when opening Add modal
    setModalVisible(true);
  };

  const fetchInquiryHistory = async (inquiryId) => {
    try {
      const response = await axios.get(
        `https://aglobiaerp.com/aglobiaerpProject/webApi/staff/InquiryHistroy/${inquiryId}/`
      );

      if (response.status === 200 && Array.isArray(response.data)) {
        const formatted = response.data.map(item => {
          const data = item.name;
          return {
            id: data.id,
            clientName: data.clientName,
            mobileNo: data.mobileNo,
            email: data.email,
            address: data.address,
            productView: data.productView,
            reason: data.reason,
            // followupReason: data.followupReason,
            followup: data.followup,
          };
        });
        setInquiryHistory(formatted);
        setHistoryModalVisible(true);
      }
    } catch (error) {
      console.error('Fetch Inquiry History Error:', error);
      Alert.alert('Error', 'Failed to fetch inquiry history. Please try again.');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.inquiryBox}
      onPress={() => openDetailModal(item)}
    >
      <View style={styles.inquiryContent}>
        <View style={styles.inquiryInfo}>
          <Text style={styles.inquiryText}>
            <Text style={styles.label}>Name:</Text> {item.clientName}
          </Text>
          <Text style={styles.inquiryText}>
            <Text style={styles.label}>Contact:</Text> {item.mobileNo}
          </Text>
          <Text style={styles.inquiryText}>
            <Text style={styles.label}>Budget:</Text> ₹{item.budget}
          </Text>
          <Text style={styles.inquiryStatus}>Status: {item.status}</Text>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => fetchInquiryHistory(item.id)}
        >
          <Text style={styles.historyButtonText}>History</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inquiries</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.inquiryList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ff4081']}
            tintColor="#ff4081"
            title="Pull to refresh"
            titleColor="#666"
          />
        }
      >
        {/* Recent Inquiries */}
        {recentInquiries.length > 0 && recentInquiries.map((item) => (
          <View key={item.id} style={styles.inquiryBox}>
            <View style={styles.inquiryContent}>
              <View style={styles.inquiryInfo}>
                <Text style={styles.inquiryText}>
                  <Text style={styles.label}>Name:</Text> {item.clientName}
                </Text>
                <Text style={styles.inquiryText}>
                  <Text style={styles.label}>Contact:</Text> {item.mobileNo}
                </Text>
                <Text style={styles.inquiryText}>
                  <Text style={styles.label}>Budget:</Text> ₹{item.budget}
                </Text>
                <Text style={styles.inquiryStatus}>Status: {item.status}</Text>
              </View>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => fetchInquiryHistory(item.id)}
              >
                <Text style={styles.historyButtonText}>History</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {/* History Section */}
        {inquiries.length > 0 && (
          <>
            <Text style={styles.historyTitle}>History</Text>
            {inquiries.map((item) => (
              <View key={item.id} style={styles.inquiryBox}>
                <View style={styles.inquiryContent}>
                  <View style={styles.inquiryInfo}>
                    <Text style={styles.inquiryText}>
                      <Text style={styles.label}>Name:</Text> {item.clientName}
                    </Text>
                    <Text style={styles.inquiryText}>
                      <Text style={styles.label}>Contact:</Text> {item.mobileNo}
                    </Text>
                    <Text style={styles.inquiryText}>
                      <Text style={styles.label}>Budget:</Text> ₹{item.budget}
                    </Text>
                    <Text style={styles.inquiryStatus}>Status: {item.status}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.historyButton}
                    onPress={() => fetchInquiryHistory(item.id)}
                  >
                    <Text style={styles.historyButtonText}>History</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Inquiry Form Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalView}>
            <ScrollView contentContainerStyle={styles.formContainer}>
              <Text style={styles.modalTitle}>New Inquiry</Text>
              {['clientName', 'email', 'mobileNo', 'whatappNo', 'address', 'budget'].map((field, idx) => (
                <TextInput
                  key={idx}
                  style={styles.input}
                  placeholder={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  keyboardType={
                    field === 'email' ? 'email-address' :
                    field === 'mobileNo' || field === 'whatappNo' ? 'numeric' :
                    field === 'budget' ? 'numeric' : 'default'
                  }
                  maxLength={field === 'mobileNo' || field === 'whatappNo' ? 10 : undefined}
                  value={form[field]}
                  onChangeText={(text) => handleInputChange(field, text)}
                />
              ))}
              <TextInput
                style={styles.bigInput}
                placeholder="Product Details"
                multiline
                value={form.productDetails}
                onChangeText={(text) => handleInputChange('productDetails', text)}
              />
              <TouchableOpacity style={styles.dateInput} onPress={() => setDatePickerVisibility(true)}>
                <Text style={styles.dateInputText}>
                  {form.followup1 ? form.followup1 : 'Select Follow-Up Date'}
                </Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={() => setDatePickerVisibility(false)}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Inquiry Modal */}
      <Modal animationType="slide" transparent={true} visible={editModalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalView}>
            <ScrollView contentContainerStyle={styles.formContainer}>
              <Text style={styles.modalTitle}>Edit Inquiry</Text>
              {['clientName', 'email', 'mobileNo', 'whatappNo', 'address', 'budget', 'reason'].map((field, idx) => (
                <TextInput
                  key={idx}
                  style={styles.input}
                  placeholder={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  keyboardType={
                    field === 'email' ? 'email-address' :
                    field === 'mobileNo' || field === 'whatappNo' ? 'numeric' :
                    field === 'budget' ? 'numeric' : 'default'
                  }
                  maxLength={field === 'mobileNo' || field === 'whatappNo' ? 10 : undefined}
                  value={form[field]}
                  onChangeText={(text) => handleInputChange(field, text)}
                />
              ))}
              <TextInput
                style={styles.bigInput}
                placeholder="Product Details"
                multiline
                value={form.productDetails}
                onChangeText={(text) => handleInputChange('productDetails', text)}
              />
              <TouchableOpacity style={styles.dateInput} onPress={() => setDatePickerVisibility(true)}>
                <Text style={styles.dateInputText}>
                  {form.followup1 ? form.followup1 : 'Select Follow-Up Date'}
                </Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={() => setDatePickerVisibility(false)}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.submitButton} onPress={handleEdit}>
                  <Text style={styles.buttonText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                  setEditModalVisible(false);
                  setForm(initialFormState);
                }}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Inquiry Detail Modal */}
      <Modal transparent={true} visible={detailModalVisible}>
        <View style={styles.detailOverlay}>
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Inquiry Detail</Text>
            <ScrollView contentContainerStyle={styles.detailScroll}>
              {selectedInquiry && (
                <>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Name: </Text>
                    <Text style={styles.detailValue}>{selectedInquiry.clientName}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Email: </Text>
                    <Text style={styles.detailValue}>{selectedInquiry.email}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Mobile: </Text>
                    <Text style={styles.detailValue}>{selectedInquiry.mobileNo}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>WhatsApp: </Text>
                    <Text style={styles.detailValue}>{selectedInquiry.whatappNo}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Address: </Text>
                    <Text style={styles.detailValue}>{selectedInquiry.address}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Product Details: </Text>
                    <Text style={styles.detailValue}>{selectedInquiry.productDetails}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Budget: </Text>
                    <Text style={styles.detailValue}>₹{selectedInquiry.budget}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Follow-up Date: </Text>
                    <Text style={styles.detailValue}>{selectedInquiry.followup1}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Status: </Text>
                    <Text style={styles.detailValue}>{selectedInquiry.status}</Text>
                  </View>
                  {selectedInquiry.reason && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Reason: </Text>
                      <Text style={styles.detailValue}>{selectedInquiry.reason}</Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.submitButton} onPress={openEditModal}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setDetailModalVisible(false)}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.historyBox}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Inquiry History</Text>
            </View>
            <ScrollView 
              contentContainerStyle={styles.historyContent}
              showsVerticalScrollIndicator={false}
            >
              {inquiryHistory.map((item, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Name:</Text>
                    <Text style={styles.historyValue}>{item.clientName}</Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Mobile:</Text>
                    <Text style={styles.historyValue}>{item.mobileNo}</Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Email:</Text>
                    <Text style={styles.historyValue}>{item.email}</Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Address:</Text>
                    <Text style={styles.historyValue}>{item.address}</Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Product:</Text>
                    <Text style={styles.historyValue}>{item.productView}</Text>
                  </View>
                  <View style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Reason:</Text>
                    <Text style={styles.historyValue}>{item.reason}</Text>
                  </View>
                  {/* <View style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Follow-up Reason:</Text>
                    <Text style={styles.historyValue}>{item.followupReason}</Text>
                  </View> */}
                  <View style={styles.historyRow}>
                    <Text style={styles.historyLabel}>Follow-up Date:</Text>
                    <Text style={styles.historyValue}>{item.followup}</Text>
                  </View>
                  {index < inquiryHistory.length - 1 && (
                    <View style={styles.historyDivider} />
                  )}
                </View>
              ))}
            </ScrollView>
            <View style={styles.historyFooter}>
              <TouchableOpacity
                style={styles.closeHistoryButton}
                onPress={() => setHistoryModalVisible(false)}
              >
                <Text style={styles.closeHistoryButtonText}>Close History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default InquiryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    height: 60, backgroundColor: '#ffffff',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
    elevation: 3,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#ff4081', paddingVertical: 5,
    paddingHorizontal: 10, borderRadius: 5,
  },
  addButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  formContainer: { paddingBottom: 20 },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#4a90e2',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  bigInput: {
    height: 100,
    textAlignVertical: 'top',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  dateInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  dateInputText: { color: '#555' },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  closeButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  inquiryList: { padding: 10 },
  inquiryBox: {
    backgroundColor: '#e6f2ff', padding: 15,
    borderRadius: 10, marginBottom: 10,
    borderColor: '#4a90e2', borderWidth: 1,
  },
  inquiryText: { fontSize: 14 },
  inquiryStatus: { fontSize: 14, fontWeight: 'bold', color: '#4a90e2' },
  label: { fontWeight: 'bold' },
  detailOverlay: {
    flex: 1, justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 20,
  },
  detailBox: {
    backgroundColor: '#fff', padding: 20,
    borderRadius: 10, elevation: 5, maxHeight: '80%',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 15,
    textAlign: 'center',
  },
  detailScroll: { paddingBottom: 20 },
  detailItem: {
    flexDirection: 'row', marginBottom: 10,
  },
  detailLabel: {
    fontWeight: 'bold', width: 130,
  },
  detailValue: {
    flex: 1, flexWrap: 'wrap',
  },
  historyBox: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignSelf: 'center',
    marginHorizontal: 20,
  },
  historyHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  inquiryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inquiryInfo: {
    flex: 1,
  },
  historyButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
  },
  historyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  historyContent: {
    padding: 20,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  historyRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  historyLabel: {
    width: 130,
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  historyValue: {
    flex: 1,
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 15,
  },
  historyFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  closeHistoryButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeHistoryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});