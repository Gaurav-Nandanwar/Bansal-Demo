import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Modal, FlatList, KeyboardAvoidingView, Platform,
  Alert, ScrollView, TouchableWithoutFeedback, Keyboard, Image
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../components/Header';
import { launchImageLibrary } from 'react-native-image-picker';

const VisitScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [imageZoomModalVisible, setImageZoomModalVisible] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    visitDate: '',
    visitTime: '',
    address: '',
    email: '',
    requirements: '',
    remark: '',
    attachments: [],
  });

  const [otp, setOtp] = useState('');
  const [counter, setCounter] = useState(60);
  const [submittedData, setSubmittedData] = useState([]);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    let timer;
    if (otpModalVisible && counter > 0) {
      timer = setTimeout(() => setCounter(counter - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [counter, otpModalVisible]);

  const handleDateConfirm = (date) => {
    setForm({ ...form, visitDate: date.toDateString() });
    setDatePickerVisible(false);
  };

  const handleTimeConfirm = (time) => {
    setForm({
      ...form,
      visitTime: time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    setTimePickerVisible(false);
  };

  const handleSendOtp = () => {
    if (!form.email) {
      Alert.alert('Validation Error', 'Please enter an email address.');
      return;
    }
    setOtpModalVisible(true);
    setCounter(60);
    setOtp('');
    Alert.alert('OTP Sent', `OTP sent to ${form.email}`);
  };

  const handleSubmit = () => {
    if (otp !== '1234') {
      Alert.alert('Incorrect OTP', 'Please enter the correct OTP (try 1234 for demo).');
      return;
    }
    const newData = { ...form, status: 'Verified' };
    setSubmittedData([...submittedData, newData]);
    setModalVisible(false);
    setOtpModalVisible(false);
    setForm({
      name: '',
      phone: '',
      visitDate: '',
      visitTime: '',
      address: '',
      email: '',
      requirements: '',
      remark: '',
      attachments: [],
    });
  };

  const openDetails = (item) => {
    setSelectedVisit(item);
    setDetailModalVisible(true);
  };

  const handleAttachmentPick = () => {
    launchImageLibrary({ mediaType: 'mixed', selectionLimit: 0 }, (response) => {
      if (response.didCancel || response.errorCode) return;
      const selectedAssets = response.assets || [];
      const newAttachments = selectedAssets.map(asset => ({
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName || `attachment_${Date.now()}`,
      }));
      setForm({ ...form, attachments: [...form.attachments, ...newAttachments] });
    });
  };

  const handleDeleteAttachment = (index) => {
    Alert.alert(
      'Delete Attachment',
      'Are you sure you want to delete this attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedAttachments = form.attachments.filter((_, i) => i !== index);
            setForm({ ...form, attachments: updatedAttachments });
          },
        },
      ]
    );
  };

  const handleImageZoom = (uri) => {
    setZoomedImage(uri);
    setImageZoomModalVisible(true);
  };

  const renderAttachment = ({ item, index }) => (
    <View style={styles.attachmentContainer}>
      <TouchableOpacity onPress={() => handleImageZoom(item.uri)}>
        <Image source={{ uri: item.uri }} style={styles.previewImage} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => handleDeleteAttachment(index)}
      >
        <Icon name="delete" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderRequirement = ({ item }) => (
    <View style={styles.requirementItem}>
      <Text style={styles.requirementText}>• {item}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Visits</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={submittedData}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openDetails(item)} style={styles.dataBox}>
            <Text style={styles.dataText}><Text style={styles.bold}>Name:</Text> {item.name}</Text>
            <Text style={styles.dataText}><Text style={styles.bold}>Phone:</Text> {item.phone}</Text>
            <Text style={styles.dataText}><Text style={styles.bold}>Status:</Text> {item.status}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Add Visit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalPopup}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Text style={styles.modalTitle}>Add New Visit</Text>
                <TextInput 
                  placeholder="Full Name" 
                  style={styles.input} 
                  value={form.name} 
                  onChangeText={(val) => setForm({ ...form, name: val })} 
                />
                <TextInput 
                  placeholder="Phone Number" 
                  style={styles.input} 
                  keyboardType="phone-pad" 
                  maxLength={10}
                  value={form.phone} 
                  onChangeText={(val) => setForm({ ...form, phone: val.replace(/[^0-9]/g, '') })} 
                />
                <TouchableOpacity style={styles.inputRow} onPress={() => setDatePickerVisible(true)}>
                  <Text style={styles.inputText}>{form.visitDate || 'Select Visit Date'}</Text>
                  <Icon name="calendar" size={22} color="#555" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputRow} onPress={() => setTimePickerVisible(true)}>
                  <Text style={styles.inputText}>{form.visitTime || 'Select Visit Time'}</Text>
                  <Icon name="clock-outline" size={22} color="#555" />
                </TouchableOpacity>
                <TextInput 
                  placeholder="Address" 
                  style={styles.input} 
                  value={form.address} 
                  onChangeText={(val) => setForm({ ...form, address: val })} 
                />
                <TextInput 
                  placeholder="Email" 
                  style={styles.input} 
                  keyboardType="email-address" 
                  value={form.email} 
                  onChangeText={(val) => setForm({ ...form, email: val })} 
                />
                <TextInput 
                  placeholder="Requirements" 
                  style={[styles.input, { minHeight: 100 }]} 
                  multiline 
                  value={form.requirements} 
                  onChangeText={(val) => setForm({ ...form, requirements: val })} 
                />
                <TextInput 
                  placeholder="Remark" 
                  style={[styles.input, { minHeight: 50 }]} 
                  multiline 
                  value={form.remark} 
                  onChangeText={(val) => setForm({ ...form, remark: val })} 
                />
                
                <TouchableOpacity style={styles.photoButton} onPress={handleAttachmentPick}>
                  <Text style={styles.sendOtpText}>Add Attachments</Text>
                </TouchableOpacity>
                <FlatList
                  data={form.attachments}
                  renderItem={renderAttachment}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  style={styles.attachmentsList}
                />
                
                <TouchableOpacity style={styles.sendOtpButton} onPress={handleSendOtp}>
                  <Text style={styles.sendOtpText}>Send OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>

        <DateTimePickerModal 
          isVisible={datePickerVisible} 
          mode="date" 
          onConfirm={handleDateConfirm} 
          onCancel={() => setDatePickerVisible(false)} 
        />
        <DateTimePickerModal 
          isVisible={timePickerVisible} 
          mode="time" 
          onConfirm={handleTimeConfirm} 
          onCancel={() => setTimePickerVisible(false)} 
        />
      </Modal>

      {/* OTP Modal */}
      <Modal visible={otpModalVisible} transparent animationType="fade">
        <View style={styles.otpModalContainer}>
          <View style={styles.otpBox}>
            <Icon name="shield-key-outline" size={50} color="#444" />
            <TextInput 
              placeholder="Enter OTP" 
              keyboardType="number-pad" 
              style={styles.otpInput} 
              value={otp} 
              onChangeText={setOtp} 
            />
            <Text style={styles.otpHint}>OTP sent to {form.email}</Text>
            <TouchableOpacity disabled={counter > 0} onPress={handleSendOtp}>
              <Text style={[styles.resendText, { color: counter > 0 ? 'gray' : 'blue' }]}>
                {counter > 0 ? `Resend OTP in ${counter}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detail View Modal */}
      <Modal visible={detailModalVisible} transparent animationType="fade">
        <View style={styles.detailModalContainer}>
          <ScrollView contentContainerStyle={styles.detailBox}>
            <Text style={styles.detailTitle}>Visit Details</Text>
            {selectedVisit && (
              <View style={styles.detailContent}>
                {Object.entries(selectedVisit).map(([key, value]) => {
                  if (key === 'requirements') {
                    const requirementsList = value.split('\n').filter(item => item.trim());
                    return (
                      <View key={key} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                        <FlatList
                          data={requirementsList}
                          renderItem={renderRequirement}
                          keyExtractor={(item, index) => index.toString()}
                          style={styles.requirementsList}
                        />
                      </View>
                    );
                  } else if (key === 'attachments') {
                    return value.length > 0 && (
                      <View key={key} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                        <FlatList
                          data={value}
                          renderItem={renderAttachment}
                          keyExtractor={(item, index) => index.toString()}
                          horizontal
                          style={styles.attachmentsList}
                        />
                      </View>
                    );
                  } else if (key !== 'status') {
                    return (
                      <View key={key} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                        <Text style={styles.detailValue}>{value}</Text>
                      </View>
                    );
                  }
                  return null;
                })}
              </View>
            )}
            <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeDetailBtn}>
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Image Zoom Modal */}
      <Modal
        visible={imageZoomModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageZoomModalVisible(false)}
      >
        <View style={styles.imageZoomModal}>
          <TouchableOpacity
            style={styles.closeZoomButton}
            onPress={() => setImageZoomModalVisible(false)}
          >
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {zoomedImage && (
            <Image
              source={{ uri: zoomedImage }}
              style={styles.zoomedImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

export default VisitScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 3,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#ff4081',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: { color: '#fff', fontSize: 16 },
  dataBox: {
    backgroundColor: '#e1f5fe',
    padding: 16,
    borderRadius: 10,
    marginVertical: 6,
    borderLeftWidth: 6,
    borderLeftColor: '#039be5',
  },
  dataText: { fontSize: 15, marginBottom: 4 },
  bold: { fontWeight: 'bold' },
  modalPopup: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000000aa',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#00796b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  inputText: { color: '#444', fontSize: 15 },
  sendOtpButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  sendOtpText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  cancelBtn: { marginTop: 14, alignItems: 'center' },
  cancelText: { color: 'red', fontWeight: 'bold' },
  otpModalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000000aa',
  },
  otpBox: {
    backgroundColor: '#fff',
    margin: 30,
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
  },
  otpInput: {
    borderBottomWidth: 1,
    width: '80%',
    textAlign: 'center',
    fontSize: 20,
    marginTop: 20,
  },
  otpHint: { marginTop: 10, fontSize: 14, color: '#555' },
  resendText: { marginTop: 12, fontSize: 14 },
  submitBtn: {
    backgroundColor: '#007bff',
    marginTop: 20,
    padding: 10,
    borderRadius: 6,
    width: '80%',
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: 'bold' },
  detailModalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000000aa',
  },
  detailBox: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#3f51b5',
  },
  detailContent: {
    marginBottom: 16,
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
  requirementsList: {
    flex: 1,
    marginTop: 4,
  },
  requirementItem: {
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 16,
    color: '#333',
  },
  closeDetailBtn: {
    backgroundColor: '#3f51b5',
    padding: 10,
    marginTop: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  photoButton: {
    backgroundColor: '#6a1b9a',
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
    resizeMode: 'cover',
  },
  attachmentsList: {
    marginVertical: 10,
    maxHeight: 120,
  },
  attachmentContainer: {
    position: 'relative',
    marginRight: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageZoomModal: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  zoomedImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  closeZoomButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});