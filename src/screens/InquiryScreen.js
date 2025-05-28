import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, Modal, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import moment from 'moment';
import Header from '../components/Header';
import axios from 'axios';

const InquiryScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
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
    remark: '',
  });

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
    remark: '',
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
        'https://finewood-erp.in/finewoodProject/webApi/staff/showEmployeeInquiry/'
      );

      if (response.status === 200 && Array.isArray(response.data)) {
        const formatted = response.data.map((item) => {
          const data = item.name;
          return {
            id: data.id || item.id || Date.now().toString(),
            clientName: data.clientName,
            email: data.email,
            mobileNo: data.mobileNo,
            whatappNo: data.whatappNo,
            address: data.address,
            productDetails: data.productDetails,
            budget: data.budget?.toString() ?? '',
            followup1: data.followup1,
            status: data.status || 'Pending',
            remark: data.remark || '',
          };
        });
        setInquiries(formatted);
      }
    } catch (error) {
      console.error('Fetch Inquiries Error:', error);
      Alert.alert('Error', 'Failed to fetch inquiries. Please check your network and try again.');
    }
  };

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
        'https://finewood-erp.in/finewoodProject/webApi/staff/createEmployeeInquiry/',
        {
          staff: 13,
          clientName,
          email,
          mobileNo,
          whatappNo,
          address,
          productDetails,
          followup1,
          budget,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Inquiry submitted successfully.');
        // Create new inquiry object
        const newInquiry = {
          id: response.data.id || Date.now().toString(),
          clientName,
          email,
          mobileNo,
          whatappNo,
          address,
          productDetails,
          budget,
          followup1,
          status: 'Pending',
          remark: '',
        };
        // Add to recent inquiries
        setRecentInquiries([newInquiry, ...recentInquiries]);
        // Refresh inquiries from server
        await fetchInquiries();
        setModalVisible(false);
        setForm(initialFormState); // Reset form
      } else {
        Alert.alert('Error', 'Failed to submit inquiry. Please try again.');
      }
    } catch (error) {
      console.error('Submit Inquiry Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'An error occurred while submitting the inquiry.');
    }
  };

  const handleEdit = async () => {
    const { clientName, email, mobileNo, whatappNo, address, productDetails, budget, followup1, remark } = form;

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
        `https://finewood-erp.in/finewoodProject/webApi/staff/updateEmployeeInquiry/${selectedInquiry.id}/`,
        {
          clientName,
          email,
          mobileNo,
          whatappNo,
          address,
          productDetails,
          followup1,
          budget,
          remark,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        Alert.alert('Success', response.data.message || 'Inquiry updated successfully.');
        await fetchInquiries(); // Refresh inquiries from server
        setEditModalVisible(false);
        setDetailModalVisible(false);
        setForm(initialFormState); // Reset form
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
      remark: selectedInquiry.remark || '',
    });
    setDetailModalVisible(false);
    setEditModalVisible(true);
  };

  const openAddModal = () => {
    setForm(initialFormState); // Reset form when opening Add modal
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inquiries</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.inquiryList}>
        {/* Recent Inquiries */}
        {recentInquiries.length > 0 && recentInquiries.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.inquiryBox}
            onPress={() => openDetailModal(item)}
          >
            <Text style={styles.inquiryText}><Text style={styles.label}>Name:</Text> {item.clientName}</Text>
            <Text style={styles.inquiryText}><Text style={styles.label}>Contact:</Text> {item.mobileNo}</Text>
            <Text style={styles.inquiryStatus}>Status: {item.status}</Text>
          </TouchableOpacity>
        ))}
        {/* History Section */}
        {inquiries.length > 0 && (
          <>
            <Text style={styles.historyTitle}>History</Text>
            {inquiries.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.inquiryBox}
                onPress={() => openDetailModal(item)}
              >
                <Text style={styles.inquiryText}><Text style={styles.label}>Name:</Text> {item.clientName}</Text>
                <Text style={styles.inquiryText}><Text style={styles.label}>Contact:</Text> {item.mobileNo}</Text>
                <Text style={styles.inquiryStatus}>Status: {item.status}</Text>
              </TouchableOpacity>
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
              {['clientName', 'email', 'mobileNo', 'whatappNo', 'address', 'budget', 'remark'].map((field, idx) => (
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
              {['clientName', 'email', 'mobileNo', 'whatappNo', 'address', 'budget', 'remark'].map((field, idx) => (
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
                  setForm(initialFormState); // Reset form on cancel
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
              {selectedInquiry && Object.entries(selectedInquiry).map(([key, value]) => (
                key !== 'id' && (
                  <View key={key} style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: </Text>
                    <Text style={styles.detailValue}>{value}</Text>
                  </View>
                )
              ))}
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
    flex: 1, justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20, backgroundColor: '#fff',
    borderRadius: 10, padding: 20, elevation: 5,
  },
  formContainer: { paddingBottom: 20 },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold',
    marginBottom: 15, textAlign: 'center', color: '#4a90e2',
  },
  input: {
    height: 40, borderColor: '#ccc', borderWidth: 1,
    borderRadius: 5, marginBottom: 10, paddingHorizontal: 10,
  },
  bigInput: {
    height: 100, textAlignVertical: 'top',
    borderColor: '#ccc', borderWidth: 1,
    borderRadius: 5, marginBottom: 10, paddingHorizontal: 10,
  },
  dateInput: {
    height: 40, borderColor: '#ccc', borderWidth: 1,
    borderRadius: 5, justifyContent: 'center',
    paddingHorizontal: 10, marginBottom: 10,
  },
  dateInputText: { color: '#555' },
  buttonContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#4a90e2', paddingVertical: 10,
    paddingHorizontal: 20, borderRadius: 5, flex: 1, marginRight: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc', paddingVertical: 10,
    paddingHorizontal: 20, borderRadius: 5, flex: 1, marginLeft: 5,
  },
  closeButton: {
    backgroundColor: '#4a90e2', paddingVertical: 10,
    paddingHorizontal: 20, borderRadius: 5, flex: 1, marginLeft: 5,
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
  historyHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom:5,
  },
});