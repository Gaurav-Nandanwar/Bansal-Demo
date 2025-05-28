import React, { useState, useEffect } from 'react';
import {View,Text,TextInput,StyleSheet,TouchableOpacity,Modal,FlatList,KeyboardAvoidingView,Platform,Alert,ScrollView,TouchableWithoutFeedback,Keyboard,Image,} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageResizer from 'react-native-image-resizer';
import Header from '../components/Header';
import { launchImageLibrary } from 'react-native-image-picker';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['VirtualizedLists should never be nested']); // Ignore warning about nested FlatLists

const VisitScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [imageZoomModalVisible, setImageZoomModalVisible] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedVisitIndex, setSelectedVisitIndex] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [visitId, setVisitId] = useState(null); // Store visit_id for OTP verification
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
  const [newVisit, setNewVisit] = useState(null); // Store the most recent submitted visit
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  // Fetch API data when component mounts
  const fetchVisitorData = async () => {
    try {
      const response = await fetch('https://finewood-erp.in/finewoodProject/webApi/staff/showEmployeeVisitor/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const transformedData = data.map((item) => ({
          name: item.name.clientName,
          phone: item.name.clientMobile,
          visitDate: item.name.visitDate,
          visitTime: item.name.visitTime,
          address: item.name.clientAddress,
          email: item.name.clientEmail,
          requirements: item.name.purpose,
          remark: item.name.remark,
          status: item.name.status,
          attachments: item.images.map((img, index) => ({
            uri: img.image_url,
            type: 'image/jpeg',
            name: `image_${index}.jpg`,
          })),
        }));
        setSubmittedData(transformedData);
        setNewVisit(null); // Reset newVisit on fetch to avoid stale new visits
    } catch (error) {
      console.error('Error fetching visitor data:', error.message);
      Alert.alert('Error', 'Failed to fetch visitor data. Please check your network and try again.');
    }
  };

  useEffect(() => {
    fetchVisitorData();
  }, []);

  useEffect(() => {
    let timer;
    if (otpModalVisible && counter > 0) {
      timer = setTimeout(() => setCounter(counter - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [counter, otpModalVisible]);

  const handleDateConfirm = (date) => {
    setForm({ ...form, visitDate: date.toISOString().split('T')[0] });
    setDatePickerVisible(false);
  };

  const handleTimeConfirm = (time) => {
    setForm({
      ...form,
      visitTime: time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    });
    setTimePickerVisible(false);
  };

  const handleAttachmentPick = async () => {
    try {
      const response = await launchImageLibrary({ 
        mediaType: 'photo', 
        selectionLimit: 0,
        quality: 1,
        includeBase64: false
      });

      if (response.didCancel || response.errorCode) {
        console.log('Image picker cancelled or error:', response.errorCode);
        return;
      }

      const selectedAssets = response.assets || [];
      const compressedAttachments = [];

      for (const asset of selectedAssets) {
        console.log('Processing image:', asset); // Debug log

        // Validate image type and size
        if (!['image/jpeg', 'image/png'].includes(asset.type)) {
          Alert.alert('Invalid File', 'Only JPEG and PNG images are supported.');
          continue;
        }

        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Image size must be less than 5MB.');
          continue;
        }

        try {
          const compressedImage = await ImageResizer.createResizedImage(
            asset.uri,
            1024, // Max width
            1024, // Max height
            'JPEG',
            80, // Quality (0-100)
            0, // Rotation
            undefined, // Output path
            true // Keep metadata
          );

          console.log('Compressed image:', compressedImage); // Debug log

          compressedAttachments.push({
            uri: compressedImage.uri,
            type: 'image/jpeg',
            name: `image_${Date.now()}_${compressedAttachments.length}.jpg`
          });
        } catch (error) {
          console.error('Image compression error:', error);
          Alert.alert('Error', 'Failed to process image. Please try another image.');
        }
      }

      console.log('Final compressed attachments:', compressedAttachments); // Debug log
      setForm({ ...form, attachments: [...form.attachments, ...compressedAttachments] });
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const handleSendOtp = async () => {
    // Validate required fields
    const { name, phone, visitDate, visitTime, address, email, requirements } = form;
    if (!name || !phone || !visitDate || !visitTime || !address || !email || !requirements) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    // Validate phone number
    if (phone.length !== 10 || !/^[0-9]+$/.test(phone)) {
      Alert.alert('Validation Error', 'Phone number must be 10 digits.');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('clientName', form.name);
      formData.append('clientMobile', form.phone);
      formData.append('clientEmail', form.email);
      formData.append('clientAddress', form.address);
      formData.append('visitDate', form.visitDate);
      formData.append('visitTime', form.visitTime);
      formData.append('purpose', form.requirements);
      formData.append('remark', form.remark);
      formData.append('staff', '13');

      // Handle image uploads
      if (form.attachments && form.attachments.length > 0) {
        form.attachments.forEach((attachment, index) => {
          formData.append('images', {
            uri: Platform.OS === 'ios' ? attachment.uri.replace('file://', '') : attachment.uri,
            type: 'image/jpeg',
            name: `image_${index}.jpg`
          });
        });
      }

      console.log('FormData being sent:', formData); // Debug log

      const createResponse = await fetch('https://finewood-erp.in/finewoodProject/webApi/staff/createEmployeeVisitor/', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 30000,
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('API Error Response:', errorText); // Debug log
        throw new Error(`HTTP error! status: ${createResponse.status}, message: ${errorText}`);
      }

      const createData = await createResponse.json();
      console.log('API Success Response:', createData); // Debug log
      const visitIdFromResponse = createData.visit_id;
      if (!visitIdFromResponse) {
        throw new Error('Visit ID not returned from API');
      }
      setVisitId(visitIdFromResponse);

      // Open OTP modal
      setOtpModalVisible(true);
      setCounter(60);
      setOtp('');
      Alert.alert('OTP Sent', `OTP sent to ${form.email}`);
    } catch (error) {
      console.error('Error sending OTP or submitting visit:', error.message);
      Alert.alert('Error', `Failed to submit visit: ${error.message}. Please try again later.`);
    }
  };

  const handleSubmit = async () => {
    if (!otp) {
      Alert.alert('Validation Error', 'Please enter the OTP.');
      return;
    }

    try {
      const otpResponse = await fetch('https://finewood-erp.in/finewoodProject/webApi/staff/verifyVisitorOTP/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visit_id: visitId,
          otp: otp,
        }),
        timeout: 15000, // 15-second timeout
      });

      if (!otpResponse.ok) {
        const errorText = await otpResponse.text();
        throw new Error(`HTTP error! status: ${otpResponse.status}, message: ${errorText}`);
      }

      const otpData = await otpResponse.json();
      if (!otpData.success) {
        throw new Error(otpData.message || 'Failed to verify OTP');
      }

      // Create new visit object from form
      const visit = {
        name: form.name,
        phone: form.phone,
        visitDate: form.visitDate,
        visitTime: form.visitTime,
        address: form.address,
        email: form.email,
        requirements: form.requirements,
        remark: form.remark,
        status: otpData.status || 'Pending', // Use status from API if available
        attachments: form.attachments,
      };

      // Set the new visit to display above History
      setNewVisit(visit);

      // Refresh submittedData to include the new visit from the server
      await fetchVisitorData();

      // Reset form and close modals
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
      setModalVisible(false);
      setOtpModalVisible(false);
      setVisitId(null);
      Alert.alert('Success', otpData.message || 'Visit submitted and OTP verified successfully');
    } catch (error) {
      console.error('Error verifying OTP:', error.message);
      Alert.alert('Error', error.message || 'Failed to verify OTP. Please try again later.');
    }
  };

  const openDetails = (item, index, isNewVisit = false) => {
    setSelectedVisit(item);
    setSelectedVisitIndex(isNewVisit ? -1 : index); // Use -1 for newVisit to distinguish it
    setDetailModalVisible(true);
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

  const handleDeleteDetailAttachment = (index) => {
    Alert.alert(
      'Delete Attachment',
      'Are you sure you want to delete this attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (selectedVisitIndex === -1) {
              // Update newVisit if the selected visit is the new one
              const updatedAttachments = newVisit.attachments.filter((_, i) => i !== index);
              setNewVisit({ ...newVisit, attachments: updatedAttachments });
              setSelectedVisit({ ...newVisit, attachments: updatedAttachments });
            } else {
              // Update submittedData for historical visits
              const updatedSubmittedData = [...submittedData];
              const updatedAttachments = selectedVisit.attachments.filter((_, i) => i !== index);
              updatedSubmittedData[selectedVisitIndex] = {
                ...selectedVisit,
                attachments: updatedAttachments,
              };
              setSubmittedData(updatedSubmittedData);
              setSelectedVisit({ ...selectedVisit, attachments: updatedAttachments });
            }
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
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteAttachment(index)}>
        <Icon name="delete" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderDetailAttachment = ({ item, index }) => (
    <View style={styles.attachmentContainer}>
      <TouchableOpacity onPress={() => handleImageZoom(item.uri)}>
        <Image source={{ uri: item.uri }} style={styles.previewImage} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDetailAttachment(index)}>
        <Icon name="delete" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <TouchableOpacity onPress={() => openDetails(item, index)} style={styles.dataBox}>
      <Text style={styles.dataText}>
        <Text style={styles.bold}>Name:</Text> {item.name}
      </Text>
      <Text style={styles.dataText}>
        <Text style={styles.bold}>Phone:</Text> {item.phone}
      </Text>
      <Text style={styles.dataText}>
        <Text style={styles.bold}>Status:</Text> {item.status}
      </Text>
    </TouchableOpacity>
  );

  // Render the new visit if it exists
  const renderNewVisit = () => {
    if (!newVisit) return null;
    return (
      <TouchableOpacity onPress={() => openDetails(newVisit, 0, true)} style={styles.dataBox}>
        <Text style={styles.dataText}>
          <Text style={styles.bold}>Name:</Text> {newVisit.name}
        </Text>
        <Text style={styles.dataText}>
          <Text style={styles.bold}>Phone:</Text> {newVisit.phone}
        </Text>
        <Text style={styles.dataText}>
          <Text style={styles.bold}>Status:</Text> {newVisit.status}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render the History header if there are historical visits
  const renderHistoryHeader = () => {
    if (submittedData.length > 0) {
      return (
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>History</Text>
        </View>
      );
    }
    return null;
  };

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
        renderItem={renderItem}
        ListHeaderComponent={() => (
          <>
            {renderNewVisit()}
            {renderHistoryHeader()}
          </>
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
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Visit Details</Text>
            {selectedVisit && (
              <View style={styles.detailContent}>
                {Object.entries(selectedVisit).map(([key, value]) => {
                  if (key === 'requirements') {
                    const requirementsList = value.split('\n').filter((item) => item.trim());
                    return (
                      <View key={key} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                        <View style={styles.requirementsList}>
                          {requirementsList.map((item, index) => (
                            <View key={index} style={styles.requirementItem}>
                              <Text style={styles.requirementText}>• {item}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  } else if (key === 'attachments') {
                    return (
                      value.length > 0 && (
                        <View key={key} style={styles.detailRow}>
                          <Text style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                          <View style={styles.attachmentsList}>
                            {value.map((item, index) => (
                              <View key={index} style={styles.attachmentContainer}>
                                <TouchableOpacity onPress={() => handleImageZoom(item.uri)}>
                                  <Image source={{ uri: item.uri }} style={styles.previewImage} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDetailAttachment(index)}>
                                  <Icon name="delete" size={20} color="#fff" />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        </View>
                      )
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
          </View>
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
            <Image source={{ uri: zoomedImage }} style={styles.zoomedImage} resizeMode="contain" />
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
    paddingVertical: 10, // Reduced vertical padding
    paddingHorizontal: 16,
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
    padding: 8,
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
    marginBottom: 5,
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
    marginTop: 1,
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
    marginTop: 5,
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
  historyHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});