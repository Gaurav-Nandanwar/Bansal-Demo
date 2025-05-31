import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Header from '../components/Header';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const TodaysVisitScreen = () => {
  const [todaysVisits, setTodaysVisits] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [imageZoomModalVisible, setImageZoomModalVisible] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [selectedVisitForOtp, setSelectedVisitForOtp] = useState(null);
  const [email, setEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    visitDate: '',
    visitTime: '',
    address: '',
    requirements: '',
    remark: '',
    attachments: [],
  });
  const [editDatePickerVisible, setEditDatePickerVisible] = useState(false);
  const [editTimePickerVisible, setEditTimePickerVisible] = useState(false);

  // Fetch today's visits
  const fetchTodaysVisits = async () => {
    try {
      const response = await fetch('https://aglobiaerp.com/aglobiaerpProject/webApi/staff/showTodayEmployeeVisitor/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map the response data to the required format
      const formattedData = data.map(item => ({
        id: item.name.id,
        name: item.name.clientName,
        phone: item.name.clientMobile,
        visitDate: item.name.visitDate,
        visitTime: item.name.visitTime,
        address: item.name.clientAddress,
        requirements: item.name.purpose,
        remark: item.name.remark,
        status: item.name.status,
        email: item.name.clientEmail,
        attachments: item.images.map((img, index) => ({
          uri: img.image_url,
          type: 'image/jpeg',
          name: `image_${index}.jpg`,
        })),
      }));

      setTodaysVisits(formattedData);
    } catch (error) {
      console.error('Error fetching today\'s visits:', error.message);
      Alert.alert('Error', 'Failed to fetch today\'s visits. Please check your network and try again.');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTodaysVisits();
    } catch (error) {
      console.error('Error refreshing visits:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaysVisits();
  }, []);

  const openDetails = (item) => {
    setSelectedVisit(item);
    setDetailModalVisible(true);
  };

  const handleImageZoom = (uri) => {
    setZoomedImage(uri);
    setImageZoomModalVisible(true);
  };

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch(
        `https://aglobiaerp.com/aglobiaerpProject/webApi/staff/sendEmailVisitEmployee/${selectedVisitForOtp.id}/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientEmail: email,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'OTP sent successfully to ' + email);
        setOtpSent(true);
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    try {
      const response = await fetch(
        'https://aglobiaerp.com/aglobiaerpProject/webApi/staff/verifyVisitorOTP/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            visit_id: selectedVisitForOtp.id.toString(),
            otp: otp,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to verify OTP');
      }

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', data.message || 'OTP verified, visit confirmed');
        setOtpModalVisible(false);
        setEmail('');
        setOtp('');
        setOtpSent(false);
        setSelectedVisitForOtp(null);
        // Refresh the visits list
        fetchTodaysVisits();
      } else {
        throw new Error(data.message || 'Failed to verify OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', error.message || 'Failed to verify OTP. Please try again.');
    }
  };

  const openOtpModal = (item) => {
    setSelectedVisitForOtp(item);
    setOtpModalVisible(true);
    setOtpSent(false);
    setEmail('');
    setOtp('');
  };

  const handleAttachmentPick = async () => {
    try {
      const options = {
        mediaType: 'photo',
        selectionLimit: 0,
        quality: 1,
        includeBase64: false,
      };

      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        console.log('ImagePicker Error: ', result.errorMessage);
        Alert.alert('Error', 'Failed to pick image. Please try again.');
        return;
      }

      const selectedAssets = result.assets || [];
      const newAttachments = selectedAssets.map(asset => ({
        uri: asset.uri,
        type: 'image/jpeg',
        name: `image_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`,
      }));

      setEditForm(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments],
      }));
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const openEditModal = (visit) => {
    setEditForm({
      name: visit.name,
      phone: visit.phone,
      visitDate: visit.visitDate,
      visitTime: visit.visitTime,
      address: visit.address,
      requirements: visit.requirements,
      remark: visit.remark,
      attachments: visit.attachments || [],
    });
    setEditModalVisible(true);
    setDetailModalVisible(false);
  };

  const handleEditSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('clientName', editForm.name);
      formData.append('clientMobile', editForm.phone);
      formData.append('clientAddress', editForm.address);
      formData.append('visitDate', editForm.visitDate);
      formData.append('visitTime', editForm.visitTime);
      formData.append('purpose', editForm.requirements);
      formData.append('remark', editForm.remark);
      formData.append('staff', '7');

      // Handle image uploads
      if (editForm.attachments && editForm.attachments.length > 0) {
        editForm.attachments.forEach((attachment) => {
          formData.append('images', {
            uri: Platform.OS === 'ios' ? attachment.uri.replace('file://', '') : attachment.uri,
            type: 'image/jpeg',
            name: attachment.name
          });
        });
      }

      const response = await fetch(
        `https://aglobiaerp.com/aglobiaerpProject/webApi/staff/updateEmployeeVisitor/${selectedVisit.id}/`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update visit');
      }

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', data.message || 'Visit updated successfully');
        setEditModalVisible(false);
        fetchTodaysVisits(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to update visit');
      }
    } catch (error) {
      console.error('Error updating visit:', error);
      Alert.alert('Error', error.message || 'Failed to update visit. Please try again.');
    }
  };

  const handleEditDateConfirm = (date) => {
    setEditForm({ ...editForm, visitDate: date.toISOString().split('T')[0] });
    setEditDatePickerVisible(false);
  };

  const handleEditTimeConfirm = (time) => {
    setEditForm({
      ...editForm,
      visitTime: time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    });
    setEditTimePickerVisible(false);
  };

  const renderAttachment = ({ item, index }) => (
    <View style={styles.attachmentContainer}>
      <TouchableOpacity onPress={() => handleImageZoom(item.uri)}>
        <Image source={{ uri: item.uri }} style={styles.previewImage} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => {
          const newAttachments = editForm.attachments.filter((_, i) => i !== index);
          setEditForm(prev => ({ ...prev, attachments: newAttachments }));
        }}
      >
        <Icon name="delete" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.dataBox}>
      <TouchableOpacity onPress={() => openDetails(item)} style={styles.visitInfo}>
        <View>
          <Text style={styles.dataText}>
            <Text style={styles.bold}>Name:</Text> {item.name}
          </Text>
          <Text style={styles.dataText}>
            <Text style={styles.bold}>Phone:</Text> {item.phone}
          </Text>
          <Text style={styles.dataText}>
            <Text style={styles.bold}>Time:</Text> {item.visitTime}
          </Text>
          <Text style={styles.dataText}>
            <Text style={styles.bold}>Status:</Text> {item.status}
          </Text>
          {item.attachments && item.attachments.length > 0 && (
            <Text style={styles.dataText}>
              <Text style={styles.bold}>Images:</Text> {item.attachments.length}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.otpButton}
          onPress={() => openOtpModal(item)}
        >
          <Text style={styles.otpButtonText}>Send OTP</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Visits</Text>
      </View>

      <FlatList
        data={todaysVisits}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 10 }}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196f3']} // Android
            tintColor="#2196f3" // iOS
            title="Pull to refresh" // iOS
            titleColor="#666" // iOS
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No visits scheduled for today</Text>
          </View>
        )}
      />

      {/* Detail View Modal */}
      <Modal visible={detailModalVisible} transparent animationType="fade">
        <View style={styles.detailModalContainer}>
          <ScrollView contentContainerStyle={styles.detailBox}>
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
                          <FlatList
                            data={value}
                            renderItem={({ item, index }) => (
                              <View style={styles.attachmentContainer}>
                                <TouchableOpacity onPress={() => handleImageZoom(item.uri)}>
                                  <Image source={{ uri: item.uri }} style={styles.previewImage} />
                                </TouchableOpacity>
                              </View>
                            )}
                            keyExtractor={(item, index) => index.toString()}
                            horizontal
                            style={styles.attachmentsList}
                            contentContainerStyle={styles.attachmentsContent}
                          />
                        </View>
                      )
                    );
                  } else if (key !== 'status' && key !== 'id') {
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
            <View style={styles.detailButtons}>
              <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(selectedVisit)}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setDetailModalVisible(false)}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* OTP Modal */}
      <Modal visible={otpModalVisible} transparent animationType="fade">
        <View style={styles.otpModalContainer}>
          <View style={styles.otpBox}>
            <Text style={styles.otpTitle}>{otpSent ? 'Enter OTP' : 'Send OTP'}</Text>
            {!otpSent ? (
              <>
                <TextInput
                  placeholder="Enter Email Address"
                  style={styles.otpInput}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.otpButtons}>
                  <TouchableOpacity 
                    style={styles.otpCancelButton} 
                    onPress={() => {
                      setOtpModalVisible(false);
                      setEmail('');
                      setOtp('');
                      setOtpSent(false);
                      setSelectedVisitForOtp(null);
                    }}
                  >
                    <Text style={styles.otpCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.otpSendButton} onPress={handleSendOtp}>
                    <Text style={styles.otpSendButtonText}>Send OTP</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <TextInput
                  placeholder="Enter OTP"
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                  maxLength={6}
                />
                <View style={styles.otpButtons}>
                  <TouchableOpacity 
                    style={styles.otpCancelButton} 
                    onPress={() => {
                      setOtpModalVisible(false);
                      setEmail('');
                      setOtp('');
                      setOtpSent(false);
                      setSelectedVisitForOtp(null);
                    }}
                  >
                    <Text style={styles.otpCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.otpSendButton} onPress={handleVerifyOtp}>
                    <Text style={styles.otpSendButtonText}>Verify OTP</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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

      {/* Edit Visit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalPopup}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView contentContainerStyle={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Visit</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="Full Name"
                    style={styles.input}
                    value={editForm.name}
                    onChangeText={(val) => setEditForm({ ...editForm, name: val })}
                  />
                  <TextInput
                    placeholder="Phone Number"
                    style={styles.input}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={editForm.phone}
                    onChangeText={(val) => setEditForm({ ...editForm, phone: val.replace(/[^0-9]/g, '') })}
                  />
                  <TouchableOpacity style={styles.inputRow} onPress={() => setEditDatePickerVisible(true)}>
                    <Text style={styles.inputText}>{editForm.visitDate || 'Select Visit Date'}</Text>
                    <Icon name="calendar" size={22} color="#555" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inputRow} onPress={() => setEditTimePickerVisible(true)}>
                    <Text style={styles.inputText}>{editForm.visitTime || 'Select Visit Time'}</Text>
                    <Icon name="clock-outline" size={22} color="#555" />
                  </TouchableOpacity>
                  <TextInput
                    placeholder="Address"
                    style={styles.input}
                    value={editForm.address}
                    onChangeText={(val) => setEditForm({ ...editForm, address: val })}
                  />
                  <TextInput
                    placeholder="Requirements"
                    style={[styles.input, { minHeight: 100 }]}
                    multiline
                    value={editForm.requirements}
                    onChangeText={(val) => setEditForm({ ...editForm, requirements: val })}
                  />
                  <TextInput
                    placeholder="Remark"
                    style={[styles.input, { minHeight: 50 }]}
                    multiline
                    value={editForm.remark}
                    onChangeText={(val) => setEditForm({ ...editForm, remark: val })}
                  />
                  <TouchableOpacity style={styles.photoButton} onPress={handleAttachmentPick}>
                    <Text style={styles.sendOtpText}>Add Attachments</Text>
                  </TouchableOpacity>
                  <FlatList
                    data={editForm.attachments}
                    renderItem={renderAttachment}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal
                    style={styles.attachmentsList}
                  />
                </View>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.submitButton} onPress={handleEditSubmit}>
                    <Text style={styles.submitButtonText}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>

        <DateTimePickerModal
          isVisible={editDatePickerVisible}
          mode="date"
          onConfirm={handleEditDateConfirm}
          onCancel={() => setEditDatePickerVisible(false)}
        />
        <DateTimePickerModal
          isVisible={editTimePickerVisible}
          mode="time"
          onConfirm={handleEditTimeConfirm}
          onCancel={() => setEditTimePickerVisible(false)}
        />
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  dataBox: {
    backgroundColor: '#e1f5fe',
    padding: 8,
    borderRadius: 10,
    marginVertical: 6,
    borderLeftWidth: 6,
    borderLeftColor: '#039be5',
  },
  visitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataText: {
    fontSize: 15,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  otpButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  otpButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    width: '90%',
    maxWidth: 500,
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
    flexWrap: 'wrap',
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
  detailButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
  },
  editButton: {
    backgroundColor: '#4a90e2',
    padding: 10,
    borderRadius: 6,
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#3f51b5',
    padding: 10,
    borderRadius: 6,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 8,
    flex: 1,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 14,
    borderRadius: 8,
    flex: 1,
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  attachmentsList: {
    marginTop: 8,
    marginBottom: 16,
    maxHeight: 120,
    minWidth: 270, // Ensures space for 3 attachments (80px image + 10px margin) * 3
  },
  attachmentsContent: {
    flexGrow: 1,
    paddingRight: 10,
    minWidth: 270, // Ensures content container has space for 3 attachments
  },
  attachmentContainer: {
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
    width: 80, // Fixed width for consistency
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
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
  otpModalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000000aa',
  },
  otpBox: {
    backgroundColor: '#fff',
    margin: 30,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#3f51b5',
    textAlign: 'center',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  otpButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  otpCancelButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  otpCancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  otpSendButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  otpSendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalPopup: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#3f51b5',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  remarkInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  photoButton: {
    backgroundColor: '#2196f3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  sendOtpText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
});

export default TodaysVisitScreen;