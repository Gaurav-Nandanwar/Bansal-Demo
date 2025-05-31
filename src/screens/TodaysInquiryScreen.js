import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Header from '../components/Header';
import axios from 'axios';
import moment from 'moment';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const TodaysInquiryScreen = () => {
  const [todaysInquiries, setTodaysInquiries] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
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
    reason: '',
  });

  const fetchTodaysInquiries = async () => {
    try {
      const response = await axios.get(
        'https://aglobiaerp.com/aglobiaerpProject/webApi/staff/showEmployeeInquiry/'
      );

      if (response.status === 200 && Array.isArray(response.data)) {
        const today = moment().format('YYYY-MM-DD');
        const filtered = response.data
          .filter(item => item.name.followup1 === today)
          .map(item => {
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
        setTodaysInquiries(filtered);
      }
    } catch (error) {
      console.error('Fetch Today\'s Inquiries Error:', error);
      Alert.alert('Error', 'Failed to fetch today\'s inquiries. Please check your network and try again.');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTodaysInquiries();
    } catch (error) {
      console.error('Error refreshing inquiries:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaysInquiries();
  }, []);

  const openDetails = (inquiry) => {
    setSelectedInquiry(inquiry);
    setDetailModalVisible(true);
  };

  const handleInputChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleConfirm = (date) => {
    setForm({ ...form, followup1: moment(date).format('YYYY-MM-DD') });
    setDatePickerVisibility(false);
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
        await fetchTodaysInquiries(); // Refresh the list
        setEditModalVisible(false);
        setDetailModalVisible(false);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update inquiry.');
      }
    } catch (error) {
      console.error('Update Inquiry Error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'An error occurred while updating the inquiry.');
    }
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
      reason: '',
    });
    setDetailModalVisible(false);
    setEditModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.inquiryBox}
      onPress={() => openDetails(item)}
    >
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
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Inquiries</Text>
      </View>

      <FlatList
        data={todaysInquiries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
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
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No inquiries scheduled for today</Text>
          </View>
        )}
      />

      {/* Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Inquiry Details</Text>
            {selectedInquiry && (
              <ScrollView contentContainerStyle={styles.detailContent}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedInquiry.clientName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedInquiry.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mobile:</Text>
                  <Text style={styles.detailValue}>{selectedInquiry.mobileNo}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>WhatsApp:</Text>
                  <Text style={styles.detailValue}>{selectedInquiry.whatappNo}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <Text style={styles.detailValue}>{selectedInquiry.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Product Details:</Text>
                  <Text style={styles.detailValue}>{selectedInquiry.productDetails}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Budget:</Text>
                  <Text style={styles.detailValue}>₹{selectedInquiry.budget}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Follow-up Date:</Text>
                  <Text style={styles.detailValue}>{selectedInquiry.followup1}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>{selectedInquiry.status}</Text>
                </View>
                {selectedInquiry.reason && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reason:</Text>
                    <Text style={styles.detailValue}>{selectedInquiry.reason}</Text>
                  </View>
                )}
              </ScrollView>
            )}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={openEditModal}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
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
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditModalVisible(false);
                    setDetailModalVisible(true);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 10,
  },
  inquiryBox: {
    backgroundColor: '#e6f2ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#4a90e2',
    borderWidth: 1,
  },
  inquiryText: {
    fontSize: 14,
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
  },
  inquiryStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  detailBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 15,
    textAlign: 'center',
  },
  detailContent: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  detailLabel: {
    width: 120,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  editButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 6,
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 6,
    flex: 1,
  },
  modalView: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    maxHeight: '90%',
  },
  formContainer: {
    paddingBottom: 20,
  },
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
  dateInputText: {
    color: '#555',
  },
  submitButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TodaysInquiryScreen; 