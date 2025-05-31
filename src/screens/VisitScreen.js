import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, FlatList, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageResizer from 'react-native-image-resizer';
import Header from '../components/Header';
import { launchImageLibrary } from 'react-native-image-picker';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['VirtualizedLists should never be nested']); // Ignore warning about nested FlatLists

const VisitScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [imageZoomModalVisible, setImageZoomModalVisible] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedVisitIndex, setSelectedVisitIndex] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    visitDate: '',
    visitTime: '',
    address: '',
    requirements: '',
    remark: '',
    attachments: [],
  });
  const [submittedData, setSubmittedData] = useState([]);
  const [newVisit, setNewVisit] = useState(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
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

  // Fetch API data when component mounts
  const fetchVisitorData = async () => {
    try {
      const response = await fetch('https://aglobiaerp.com/aglobiaerpProject/webApi/staff/showEmployeeVisitor/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const transformedData = data.map((item) => ({
        id: item.name.id,
        name: item.name.clientName,
        phone: item.name.clientMobile,
        visitDate: item.name.visitDate,
        visitTime: item.name.visitTime,
        address: item.name.clientAddress,
        email: item.name.clientEmail,
        requirements: item.name.purpose,
        remark: item.name.remark,
        status: item.name.status,
        attachments: item.images.map((img) => ({
          uri: img.image_url,
          type: 'image/jpeg',
          name: `image_${img.id}.jpg`,
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

  const handleAttachmentPick = async (isEdit = false) => {
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
      if (isEdit) {
        setEditForm({ ...editForm, attachments: [...editForm.attachments, ...compressedAttachments] });
      } else {
        setForm({ ...form, attachments: [...form.attachments, ...compressedAttachments] });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    const { name, phone, visitDate, visitTime, address, requirements } = form;
    if (!name || !phone || !visitDate || !visitTime || !address || !requirements) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    // Validate phone number
    if (phone.length !== 10 || !/^[0-9]+$/.test(phone)) {
      Alert.alert('Validation Error', 'Phone number must be 10 digits.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('clientName', form.name);
      formData.append('clientMobile', form.phone);
      formData.append('clientAddress', form.address);
      formData.append('visitDate', form.visitDate);
      formData.append('visitTime', form.visitTime);
      formData.append('purpose', form.requirements);
      formData.append('remark', form.remark);
      formData.append('staff', '7');

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

      const response = await fetch('https://aglobiaerp.com/aglobiaerpProject/webApi/staff/createEmployeeVisitor/', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        timeout: 30000,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      
      // Create new visit object from form
      const visit = {
        name: form.name,
        phone: form.phone,
        visitDate: form.visitDate,
        visitTime: form.visitTime,
        address: form.address,
        requirements: form.requirements,
        remark: form.remark,
        status: 'Pending',
        attachments: form.attachments,
      };

      // Set the new visit to display above History
      setNewVisit(visit);

      // Refresh submittedData to include the new visit from the server
      await fetchVisitorData();

      // Reset form and close modal
      setForm({
        name: '',
        phone: '',
        visitDate: '',
        visitTime: '',
        address: '',
        requirements: '',
        remark: '',
        attachments: [],
      });
      setModalVisible(false);
      Alert.alert('Success', 'Visit submitted successfully', [
        {
          text: 'View Today\'s Visits',
          onPress: () => navigation.navigate('TodaysVisit'),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]);
    } catch (error) {
      console.error('Error submitting visit:', error.message);
      Alert.alert('Error', `Failed to submit visit: ${error.message}. Please try again later.`);
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
      {item.attachments && item.attachments.length > 0 && (
        <Text style={styles.dataText}>
          <Text style={styles.bold}>Images:</Text> {item.attachments.length}
        </Text>
      )}
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
            uri: Platform.OS === 'ios' ? attachment.uri.replace('file://228', '') : attachment.uri,
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
        fetchVisitorData(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to update visit');
      }
    } catch (error) {
      console.error('Error updating visit:', error);
      Alert.alert('Error', error.message || 'Failed to update visit. Please try again.');
    }
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
                <TouchableOpacity style={styles.photoButton} onPress={() => handleAttachmentPick(false)}>
                  <Text style={styles.sendOtpText}>Add Attachments</Text>
                </TouchableOpacity>
                <FlatList
                  data={form.attachments}
                  renderItem={renderAttachment}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  style={styles.attachmentsList}
                />
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>Submit</Text>
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
                            renderItem={renderDetailAttachment}
                            keyExtractor={(item, index) => index.toString()}
                            horizontal
                            style={styles.attachmentsList}
                            contentContainerStyle={styles.attachmentsContent}
                          />
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

      {/* Edit Visit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalPopup}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoidingView}>
            <ScrollView contentContainerStyle={styles.editModalContent}>
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
                <TouchableOpacity style={styles.photoButton} onPress={() => handleAttachmentPick(true)}>
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
                <TouchableOpacity style={styles.submitButton} onPress={() => handleEditSubmit()}>
                  <Text style={styles.submitButtonText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    paddingVertical: 10,
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
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '95%',
    maxWidth: 600,
    marginVertical: 20,
  },
  editModalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: 350, // Fixed width to accommodate ~3 attachments
    minWidth: 350, // Ensure minimum width
    minHeight: 600,
    maxHeight: '100%',
    justifyContent: 'center',
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
  sendOtpText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  cancelBtn: { marginTop: 14, alignItems: 'center' },
  cancelText: { color: 'red', fontWeight: 'bold' },
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
  photoButton: {
    backgroundColor: '#6a1b9a',
    padding: 12,
    borderRadius: 6,
    marginTop: 5,
    alignItems: 'center',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    resizeMode: 'cover',
  },
  attachmentsList: {
    marginVertical: 10,
    maxHeight: 100,
  },
  attachmentsContent: {
    flexGrow: 1,
    paddingRight: 10,
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
  submitButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 6,
    marginTop: 1,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
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
    marginTop: 16,
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 6,
    flex: 1,
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '100%',
  },
});