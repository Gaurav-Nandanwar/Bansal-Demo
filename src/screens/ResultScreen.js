import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, ScrollView, Button, Modal, TouchableOpacity, Pressable, Animated, ActivityIndicator, Alert } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../components/Header';
import { Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;

const ResultScreen = ({ navigation }) => {
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [animatedData, setAnimatedData] = useState([0, 0, 0, 0]);
    const [examModalVisible, setExamModalVisible] = useState(false);
    const [resultPopupVisible, setResultPopupVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState([]);
    const [error, setError] = useState(null);
    const [selectedExam, setSelectedExam] = useState({
        title: '',
        marks: '0/0',
        rank: '',
        subjects: [],
        average: []
    });
    const [examResult, setExamResult] = useState(null);
    const [resultLoading, setResultLoading] = useState(false);
    const [resultError, setResultError] = useState(null);
    const [studentResult, setStudentResult] = useState(null);
    const [rankChange, setRankChange] = useState('up'); // Default to 'up' to force arrow visibility

    const subjectData = [75, 80, 90, 85];
    const subjectLabels = ['Math', 'Science', 'English', 'History'];

    // Animation for rank
    const arrowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start animation immediately for visibility
        Animated.loop(
            Animated.sequence([
                Animated.timing(arrowAnim, {
                    toValue: -8,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(arrowAnim, {
                    toValue: 8,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (studentResult) {
            // Calculate rank change
            const currentRank = parseInt(studentResult.data.details.currentRank) || 0;
            const previousRank = parseInt(studentResult.data.details.previousRank || currentRank) || 0;
            
            if (currentRank < previousRank) {
                setRankChange('up');
            } else if (currentRank > previousRank) {
                setRankChange('down');
            } else {
                setRankChange('up'); // Force 'up' to ensure arrow shows
            }
        }
    }, [studentResult]);

    useEffect(() => {
        fetchStudentResult();
    }, []);

    useEffect(() => {
        if (studentResult) {
            fetchExams();
        }
    }, [studentResult]);

    const fetchStudentResult = async () => {
        try {
            setLoading(true);
            setError(null);

            const userDetails = await AsyncStorage.getItem('userDetails');
            if (!userDetails) {
                setError('User details not found');
                setLoading(false);
                return;
            }

            const { id } = JSON.parse(userDetails);
            console.log('Fetching student result for ID:', id);

            const response = await axios.post(
                'https://bansal.steponetechnologies.com/bansalProject/appApi/getStudentResult/',
                {
                    student_id: id.toString()
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }
            );

            console.log('Student Result API Response:', JSON.stringify(response.data, null, 2));
            console.log('Current Rank:', response.data.data.details.currentRank);
            console.log('Total Students:', response.data.totalStudent);
            console.log('Remarks:', response.data.data.details.remarks);

            if (response.data.statusCode === "01") {
                setStudentResult(response.data);
            } else {
                setError('Failed to fetch student result');
            }
        } catch (err) {
            console.error('Error fetching student result:', err);
            setError('Failed to fetch student result');
        } finally {
            setLoading(false);
        }
    };

    const fetchExams = async () => {
        try {
            setLoading(true);
            setError(null);

            const userDetails = await AsyncStorage.getItem('userDetails');
            if (!userDetails) {
                setError('User details not found');
                setLoading(false);
                return;
            }

            const { id } = JSON.parse(userDetails);
            console.log('Fetching exams for user ID:', id);

            const response = await axios.get(
                'https://bansal.steponetechnologies.com/bansalProject/appApi/getAllExam/',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }
            );

            console.log('Exams API Response:', JSON.stringify(response.data, null, 2));

            if (response.data.statusCode === "01") {
                const validExamNames = studentResult?.overAllScore?.map(score => score.exam_name) || [];
                console.log('Valid Exam Names:', validExamNames);
                
                const transformedExams = response.data.data
                    .filter(exam => validExamNames.includes(exam.details.ExamName))
                    .map(exam => ({
                        id: exam.details.id,
                        title: exam.details.ExamName,
                        marks: '0/0',
                        rank: '0 out of 0',
                        subjects: [],
                        average: []
                    }));
                
                console.log('Filtered Exams:', transformedExams);
                setExams(transformedExams);
            } else {
                setError('Failed to fetch exams');
            }
        } catch (err) {
            console.error('Error fetching exams:', err);
            setError('Failed to fetch exams');
        } finally {
            setLoading(false);
        }
    };

    const fetchExamResult = async (examId) => {
        try {
            setResultLoading(true);
            setResultError(null);

            const userDetails = await AsyncStorage.getItem('userDetails');
            if (!userDetails) {
                setResultError('User details not found');
                setResultLoading(false);
                return;
            }

            const { id } = JSON.parse(userDetails);
            if (!examId) {
                setResultError('Exam ID is required');
                setResultLoading(false);
                return;
            }

            console.log('Fetching exam result for student ID:', id, 'and exam ID:', examId);

            const response = await axios.post(
                'https://bansal.steponetechnologies.com/bansalProject/appApi/getStudentExamWiseResult/',
                {
                    student_id: id.toString(),
                    exam_id: examId.toString()
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }
            );

            console.log('Exam Result API Response:', JSON.stringify(response.data, null, 2));

            if (response.data.statusCode === "01") {
                const result = response.data;
                setExamResult({
                    examName: result.examName,
                    examCode: result.exam_code,
                    examType: result.examType,
                    totalMarks: result.total_marks,
                    totalExamMarks: result.total_Exam_marks,
                    classAverage: result.avgstudentsMark,
                    highestAverage: result.avg_total_exam,
                    subjects: result.data.map(item => ({
                        subject: item.details.subject,
                        obtainedMarks: item.details.obtainedMarks,
                        totalMarks: item.details.totalMarks
                    })),
                    subjectAverages: result.subjectwise_avg_marks,
                    subjectHighest: result.subjectwise_highest_marks
                });
            } else {
                setResultError('Failed to fetch exam result');
            }
        } catch (err) {
            console.error('Error fetching exam result:', err);
            setResultError('Failed to fetch exam result');
        } finally {
            setResultLoading(false);
        }
    };

    useEffect(() => {
        if (detailsModalVisible) {
            let step = 0;
            const interval = setInterval(() => {
                step++;
                setAnimatedData((prev) =>
                    prev.map((_, i) => {
                        const target = subjectData[i];
                        const progress = Math.min((step / 20) * target, target);
                        return parseFloat(progress.toFixed(1));
                    })
                );
                if (step >= 20) clearInterval(interval);
            }, 50);
        }
    }, [detailsModalVisible]);

    return (
        <View style={styles.screen}>
            <Header />
            <ScrollView contentContainerStyle={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007aff" />
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity 
                            style={styles.retryButton}
                            onPress={fetchStudentResult}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : studentResult ? (
                    <>
                        <View style={styles.topRow}>
                            <View style={styles.rankBox}>
                                <Text style={styles.boxTitle}>Ranking</Text>
                                <View style={styles.rankContent}>
                                    <Text style={[styles.boxContent, styles.highlightedRank]}>
                                        {studentResult.data.details.currentRank || 'N/A'}
                                    </Text>
                                    <Animated.View 
                                        style={[
                                            styles.rankArrowContainer,
                                            { transform: [{ translateY: arrowAnim }] }
                                        ]}
                                    >
                                        <MaterialIcons 
                                            name={rankChange === 'up' ? "keyboard-double-arrow-up" : "keyboard-double-arrow-down"} 
                                            size={24} 
                                            color={rankChange === 'up' ? "#4CAF50" : "#F44336"} 
                                            style={styles.rankArrow}
                                        />
                                    </Animated.View>
                                    <Text style={styles.boxContent}> out of {studentResult.totalStudent || 'N/A'} students</Text>
                                </View>
                            </View>
                            <View style={styles.rightColumn}>
                                <View style={styles.smallBox}>
                                    <Text style={styles.boxTitle}>Assignments</Text>
                                    <Text style={styles.boxContent}>{studentResult.data.details.assignment || 'N/A'}</Text>
                                </View>
                                <View style={styles.smallBox}>
                                    <Text style={styles.boxTitle}>Attendance</Text>
                                    <Text style={styles.boxContent}>{studentResult.data.details.attedance || 'N/A'}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.remarksBox}>
                            <Text style={styles.boxTitle}>Remarks</Text>
                            <Text style={styles.boxContent}>
                                {studentResult?.data?.details?.remarks || 'No remarks available'}
                            </Text>
                        </View>

                        <Text style={styles.graphTitle}>Overall Graphical Analysis</Text>
                        <LineChart
                            data={{
                                labels: studentResult.overAllScore?.map(score => score.exam_name) || [],
                                datasets: [{ 
                                    data: studentResult.overAllScore?.map(score => score.percentage) || []
                                }],
                            }}
                            width={screenWidth - 20}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#e8f4fa',
                                backgroundGradientFrom: '#e8f4fa',
                                backgroundGradientTo: '#e8f4fa',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: "6", strokeWidth: "2", stroke: "#007aff" },
                                propsForBackgroundLines: { strokeDasharray: "", stroke: "#e0e0e0" },
                                propsForLabels: { fontSize: 12 }
                            }}
                            bezier
                            style={styles.chart}
                            fromZero={true}
                            segments={5}
                            yAxisSuffix=""
                            yAxisInterval={20}
                            yAxisMin={0}
                            yAxisMax={100}
                            onDataPointClick={({ value, index }) => {
                                if (studentResult.overAllScore?.[index]?.exam_name) {
                                    Alert.alert(
                                        `${studentResult.overAllScore[index].exam_name}`,
                                        `Marks: ${value}%`
                                    );
                                }
                            }}
                        />

                        <View style={styles.buttonContainer}>
                            <View style={styles.button}>
                                <Button title="Details" onPress={() => navigation.navigate('Details')} />
                            </View>
                            <View style={styles.button}>
                                <Button title="Previous Exams" onPress={() => setExamModalVisible(true)} />
                            </View>
                        </View>
                    </>
                ) : null}
            </ScrollView>

            {/* Previous Exams Modal */}
            <Modal visible={examModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Previous Exams</Text>
                            <TouchableOpacity onPress={() => setExamModalVisible(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#007aff" />
                                </View>
                            ) : error ? (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                    <TouchableOpacity 
                                        style={styles.retryButton}
                                        onPress={fetchExams}
                                    >
                                        <Text style={styles.retryText}>Retry</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : exams.length === 0 ? (
                                <Text style={styles.noExamsText}>No exams available</Text>
                            ) : (
                                exams.map((exam, index) => (
                                    <View key={index} style={styles.examCard}>
                                        <View>
                                            <Text style={styles.boxTitle}>{exam.title}</Text>
                                        </View>
                                        <Pressable
                                            style={styles.viewButton}
                                            onPress={() => {
                                                setSelectedExam(exam);
                                                if (exam.id) {
                                                    fetchExamResult(exam.id);
                                                    setResultPopupVisible(true);
                                                } else {
                                                    setResultError('Exam ID not found');
                                                }
                                            }}
                                        >
                                            <Text style={styles.viewText}>View Result</Text>
                                        </Pressable>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* View Result Modal */}
            <Modal visible={resultPopupVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
                        <View style={styles.resultModalHeader}>
                            <TouchableOpacity
                                style={styles.resultBackButton}
                                onPress={() => setResultPopupVisible(false)}
                            >
                                <Text style={styles.backArrow}>←</Text>
                            </TouchableOpacity>
                            <Text style={styles.resultModalTitle}>{examResult?.examName || selectedExam?.title}</Text>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 5 }}>
                            {resultLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#007aff" />
                                </View>
                            ) : resultError ? (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{resultError}</Text>
                                </View>
                            ) : examResult ? (
                                <>
                                    <View style={styles.examInfoContainer}>
                                        <Text style={styles.examCode}>Test Code: {examResult.examCode}</Text>
                                        <Text style={styles.examMode}>Test Mode: {examResult.examType}</Text>
                                    </View>

                                    <View style={styles.marksContainer}>
                                        <View style={styles.subjectMarksList}>
                                            {examResult.subjects.map((subject, index) => (
                                                <View key={index} style={styles.subjectMarksRow}>
                                                    <Text style={styles.subjectName}>{subject.subject}</Text>
                                                    <Text style={styles.subjectMarks}>{subject.obtainedMarks}/{subject.totalMarks}</Text>
                                                </View>
                                            ))}
                                        </View>
                                        <View style={styles.totalMarksCircle}>
                                            <Text style={styles.totalMarksTitle}>Marks</Text>
                                            <Text style={styles.totalMarksValue}>{examResult.totalMarks}/{examResult.totalExamMarks}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.highestMarksBox}>
                                        <Text style={styles.boxTitle}>Highest Subject-wise Marks</Text>
                                        {examResult.subjects.map((subject, index) => (
                                            <View key={index} style={styles.highestMarksRow}>
                                                <Text style={styles.subjectName}>{subject.subject}</Text>
                                                <Text style={styles.highestMarksValue}>{examResult.subjectHighest[subject.subject]}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.averageMarksBox}>
                                        <Text style={styles.boxTitle}>Average Subject-wise Marks</Text>
                                        {examResult.subjects.map((subject, index) => (
                                            <View key={index} style={styles.averageMarksRow}>
                                                <Text style={styles.subjectName}>{subject.subject}</Text>
                                                <Text style={styles.averageMarksValue}>{examResult.subjectAverages[subject.subject]}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.pcmbContainer}>
                                        <View style={styles.highestPcmbBox}>
                                            <Text style={styles.pcmbTitle}>Highest PCM/B</Text>
                                            <Text style={styles.pcmbValue}>{examResult.highestAverage}</Text>
                                        </View>
                                        <View style={styles.avgPcmbBox}>
                                            <Text style={styles.pcmbTitle}>Average PCM/B</Text>
                                            <Text style={styles.pcmbValue}>{examResult.classAverage}</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.downloadButton}
                                        onPress={() => Share.share({ message: 'Download Result functionality here!' })}
                                    >
                                        <MaterialIcons name="download" size={20} color="#fff" style={styles.downloadIcon} />
                                        <Text style={styles.downloadText}>Download Result</Text>
                                    </TouchableOpacity>
                                </>
                            ) : null}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default ResultScreen;

const chartConfig = {
    backgroundColor: '#e8f4fa',
    backgroundGradientFrom: '#e8f4fa',
    backgroundGradientTo: '#e8f4fa',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    propsForBackgroundLines: { strokeDasharray: '' },
    propsForLabels: { fontSize: 12 },
};

const styles = StyleSheet.create({
    screen: { 
        flex: 1, 
        backgroundColor: '#ffffff' 
    },
    content: { 
        paddingHorizontal: 8, 
        paddingBottom: 20 
    },
    topRow: { 
        flexDirection: 'row', 
        marginVertical: 10,
        paddingHorizontal: 5
    },
    rankBox: {
        height: 140,
        width: 160,
        backgroundColor: '#e8f5e9',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#c8e6c9',
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    rankContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    rightColumn: {
        flex: 1,
        marginLeft: 8,
        justifyContent: 'space-between',
    },
    smallBox: {
        height: 65,
        backgroundColor: '#fff3e0',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        marginBottom: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#ffe0b2',
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
    },
    remarksBox: {
        backgroundColor: '#e3f2fd',
        borderRadius: 15,
        padding: 12,
        marginBottom: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#bbdefb',
        borderLeftWidth: 4,
        borderLeftColor: '#2196F3',
    },
    boxTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
        color: '#2c3e50',
    },
    boxContent: {
        fontSize: 13,
        color: '#34495e',
        marginHorizontal: 4,
    },
    graphTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginVertical: 8,
        color: '#2c3e50',
        paddingHorizontal: 5,
    },
    chart: {
        borderRadius: 16,
        marginBottom: 15,
        alignSelf: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingHorizontal: 5,
        marginTop: 5,
    },
    button: {
        width: '48%',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#4CAF50',
        borderWidth: 1,
        borderColor: '#43A047',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: screenWidth - 16,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 12,
        maxHeight: '90%',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#2c3e50',
    },
    closeButton: {
        fontSize: 20,
        color: '#7f8c8d',
        padding: 4,
    },
    examCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        padding: 12,
        marginVertical: 4,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    viewButton: {
        backgroundColor: '#3498db',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        elevation: 2,
    },
    viewText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 13,
    },
    highlightedRank: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginRight: 4,
    },
    rankArrowContainer: {
        marginHorizontal: 4,
        height: 34,
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    rankArrow: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    loadingContainer: {
        padding: 15,
        alignItems: 'center',
    },
    errorContainer: {
        padding: 15,
        alignItems: 'center',
    },
    errorText: {
        color: '#e74c3c',
        marginBottom: 8,
        textAlign: 'center',
        fontSize: 13,
    },
    retryButton: {
        backgroundColor: '#3498db',
        padding: 8,
        borderRadius: 8,
        elevation: 2,
    },
    retryText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 13,
    },
    noExamsText: {
        textAlign: 'center',
        padding: 15,
        color: '#7f8c8d',
        fontStyle: 'italic',
        fontSize: 13,
    },
    resultModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 8,
        position: 'relative',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    resultBackButton: {
        position: 'absolute',
        left: 0,
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    backArrow: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#3498db',
    },
    resultModalTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#2c3e50',
    },
    examInfoContainer: {
        padding: 8,
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 8,
    },
    examCode: {
        fontSize: 14,
        color: '#34495e',
        marginBottom: 4,
    },
    examMode: {
        fontSize: 14,
        color: '#34495e',
    },
    marksContainer: {
        flexDirection: 'row',
        padding: 12,
        justifyContent: 'space-between',
        backgroundColor: '#f0f7ff',
        margin: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d0e3ff',
        elevation: 2,
    },
    subjectMarksList: {
        flex: 1,
        marginRight: 12,
    },
    subjectMarksRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderColor: '#d0e3ff',
    },
    subjectName: {
        fontSize: 13,
        color: '#2c3e50',
        fontWeight: '500',
    },
    subjectMarks: {
        fontSize: 13,
        color: '#3498db',
        fontWeight: '600',
    },
    totalMarksCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#3498db',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    totalMarksTitle: {
        fontSize: 13,
        color: '#ffffff',
        fontWeight: '500',
    },
    totalMarksValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        marginTop: 4,
    },
    highestMarksBox: {
        backgroundColor: '#fff5f5',
        padding: 12,
        margin: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ffe0e0',
        elevation: 2,
    },
    averageMarksBox: {
        backgroundColor: '#f0fff4',
        padding: 12,
        margin: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d0ffe0',
        elevation: 2,
    },
    highestMarksRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderColor: '#ffe0e0',
    },
    averageMarksRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderColor: '#d0ffe0',
    },
    highestMarksValue: {
        fontSize: 13,
        color: '#e74c3c',
        fontWeight: '600',
    },
    averageMarksValue: {
        fontSize: 13,
        color: '#27ae60',
        fontWeight: '600',
    },
    pcmbContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 4,
    },
    highestPcmbBox: {
        flex: 1,
        backgroundColor: '#fff5f5',
        padding: 12,
        borderRadius: 12,
        marginRight: 6,
        alignItems: 'center',
        elevation: 2,
        borderWidth: 1,
        borderColor: '#ffe0e0',
    },
    avgPcmbBox: {
        flex: 1,
        backgroundColor: '#f0fff4',
        padding: 12,
        borderRadius: 12,
        marginLeft: 6,
        alignItems: 'center',
        elevation: 2,
        borderWidth: 1,
        borderColor: '#d0ffe0',
    },
    pcmbTitle: {
        fontSize: 13,
        color: '#2c3e50',
        marginBottom: 4,
    },
    pcmbValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2c3e50',
    },
    downloadButton: {
        backgroundColor: '#3498db',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        margin: 4,
        borderRadius: 12,
        elevation: 3,
    },
    downloadIcon: {
        marginRight: 6,
    },
    downloadText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});