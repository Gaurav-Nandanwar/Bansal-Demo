import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';

const QrScreen = () => {
  const navigation = useNavigation();
  const device = useCameraDevice('back'); // Use back camera
  const camera = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  // Request camera permission
  useEffect(() => {
    const checkPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'granted');
    };
    checkPermission();
  }, []);

  // Parse QR data for student_id and school_id
  const parseQrData = (data) => {
    try {
      const obj = JSON.parse(data);
      if (obj.student_id && obj.school_id) return obj;
    } catch (e) {
      const params = {};
      data.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[key] = value;
      });
      if (params.student_id && params.school_id) return params;
    }
    return null;
  };

  // Fetch student data from API
  const fetchStudentData = async (student_id, school_id) => {
    try {
      const response = await fetch(
        `https://api.stpl.cloud/student/get-student/?student_id=${student_id}&school_id=${school_id}`
      );
      const data = await response.json();
      return data.students?.[0] || null;
    } catch (error) {
      throw new Error('Failed to fetch student data');
    }
  };

  // Handle QR code scanning
  const codeScanner = {
    codeTypes: ['qr', 'ean-13', 'code-128'],
    onCodeScanned: async (codes) => {
      if (codes.length > 0) {
        const code = codes[0];
        const qrData = parseQrData(code.value);
        if (qrData && qrData.student_id && qrData.school_id) {
          try {
            const student = await fetchStudentData(qrData.student_id, qrData.school_id);
            if (student) {
              setStudentInfo(student);
              setShowStudentModal(true);
            } else {
              Alert.alert('Not Found', 'No student data found for this QR code.');
            }
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        } else {
          Alert.alert('Invalid QR', 'QR code does not contain valid student_id and school_id');
        }
      }
    },
  };

  // Handle capture photo
  // const capturePhoto = async () => {
  //   if (camera.current) {
  //     try {
  //       const photo = await camera.current.takePhoto();
  //       Alert.alert('Success', `Photo captured at: ${photo.path}`);
  //       // Optionally, you can navigate or process the photo here
  //     } catch (error) {
  //       Alert.alert('Error', 'Failed to capture photo');
  //     }
  //   }
  // };

  // Navigate back to home screen
  const goToHome = () => {
    navigation.navigate('HomeTab'); // Replace 'Home' with your home screen route name
  };

  // Student Info Modal
  const StudentInfoModal = () => {
    if (!studentInfo) return null;
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowStudentModal(false)}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <ScrollView style={styles.modalScrollContent} contentContainerStyle={{paddingBottom: 16}} showsVerticalScrollIndicator={false}>
            {/* Student Image */}
            <View style={styles.centeredRow}>
              {studentInfo.studentimage?.image_url ? (
                <Image
                  source={{ uri: studentInfo.studentimage.image_url }}
                  style={styles.studentImageLarge}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.studentImagePlaceholder} />
              )}
            </View>
            {/* Name and Class */}
            <Text style={styles.studentNameLarge}>{studentInfo.studentname}</Text>
            <Text style={styles.studentClassSection}>{`Class: ${studentInfo.references?.class_name?.class_name || '-'}  |  Section: ${studentInfo.section_name || '-'}`}</Text>
            <View style={styles.divider} />
            {/* Details Section */}
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Roll No:</Text><Text style={styles.detailValue}>{studentInfo.rollno}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Gender:</Text><Text style={styles.detailValue}>{studentInfo.gender}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>DOB:</Text><Text style={styles.detailValue}>{studentInfo.dateofbirth}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Blood Group:</Text><Text style={styles.detailValue}>{studentInfo.bloodgroup_name}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Mobile:</Text><Text style={styles.detailValue}>{studentInfo.contact_info?.mobilenumber || '-'}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Aadhar No:</Text><Text style={styles.detailValue}>{studentInfo.identifiers?.aadharnumber || '-'}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>House Color:</Text><Text style={styles.detailValue}>{studentInfo.house_color || '-'}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Address:</Text><Text style={styles.detailValue}>{studentInfo.addresses?.address1} {studentInfo.addresses?.address2}, {studentInfo.addresses?.city}, {studentInfo.addresses?.state}</Text></View>
            <View style={styles.divider} />
            {/* Fees Section */}
            <Text style={styles.sectionHeader}>Fee Details</Text>
            {Array.isArray(studentInfo.student_fees_heads) && studentInfo.student_fees_heads.length > 0 ? (
              studentInfo.student_fees_heads.map((fee, idx) => (
                <View style={styles.feeRow} key={fee.feeshead_id || idx}>
                  <Text style={styles.feeName}>{fee.feeshead_name}</Text>
                  <Text style={styles.feeAmount}>{`₹${fee.amount} / Paid: ₹${fee.paid_amount}`}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.detailValue}>No fee details available.</Text>
            )}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid:</Text>
              <Text style={styles.totalValue}>{`₹${studentInfo.total_paid_amount || 0}`}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Balance:</Text>
              <Text style={styles.totalValue}>{`₹${studentInfo.balance_amount || 0}`}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission not granted</Text>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showStudentModal && <StudentInfoModal />}
      {!showStudentModal && (
        <>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
            codeScanner={codeScanner} // Enable QR code scanning
          />
          <View style={styles.overlay}>
            <View style={styles.scannerFrame}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            {scannedData && (
              <View style={styles.scannedDataContainer}>
                <Text style={styles.scannedDataText}>Scanned: {scannedData}</Text>
              </View>
            )}
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>Align QR code within frame</Text>
            </View>
            <View style={styles.buttonContainer}>
              {/* Capture Button */}
              {/* <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
                <View style={styles.captureInnerCircle} />
              </TouchableOpacity> */}
              {/* Cross Button */}
              <TouchableOpacity style={styles.crossButton} onPress={goToHome}>
                <Text style={styles.crossText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    marginTop: 100,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: 'white',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: 'white',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: 'white',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: 'white',
  },
  instructionContainer: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    bottom:20
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  scannedDataContainer: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    marginBottom: 20,
  },
  scannedDataText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 90,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
  },
  crossButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    width: '90%',
    maxHeight: '90%',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: '#eee',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  closeButtonText: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScrollContent: {
    marginTop: 24,
    marginBottom: 8,
  },
  centeredRow: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
  },
  studentImageLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#007bff',
    backgroundColor: '#f0f0f0',
  },
  studentImagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  studentNameLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 2,
  },
  studentClassSection: {
    fontSize: 16,
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
    width: '100%',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 10,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#444',
    fontSize: 15,
    width: '40%',
  },
  detailValue: {
    color: '#222',
    fontSize: 15,
    width: '58%',
    textAlign: 'right',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingVertical: 2,
  },
  feeName: {
    color: '#444',
    fontSize: 14,
    width: '60%',
  },
  feeAmount: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 14,
    width: '38%',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalLabel: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 16,
  },
  totalValue: {
    color: '#28a745',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default QrScreen;