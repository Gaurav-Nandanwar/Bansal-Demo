import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;

// Overall Analytical Graph constants
const OVERALL_BAR_WIDTH = 35;
const OVERALL_SPACING = 5;
const OVERALL_GROUP_SPACING = 30;
const OVERALL_MAX_HEIGHT = 280;
const OVERALL_Y_AXIS_WIDTH = 30;
const OVERALL_X_AXIS_HEIGHT = 20;

// Subject-Wise PERCENTILE Graph constants
const SUBJECT_BAR_WIDTH = 60;
const SUBJECT_SPACING = 30;
const SUBJECT_MAX_HEIGHT = 280;
const SUBJECT_Y_AXIS_WIDTH = 40;
const SUBJECT_X_AXIS_HEIGHT = 20;

const DetailsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examData, setExamData] = useState({
    exam_averages: [],
    subject_averages: []
  });
  const [transformedExamData, setTransformedExamData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);

  // Animation refs
  const overallAnimatedValues = useRef([]).current;
  const subjectAnimatedValues = useRef([]).current;

  useEffect(() => {
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
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
      const sessionId = "1";

      const response = await axios.post(
        'https://bansal.steponetechnologies.com/bansalProject/appApi/getAllStudentExamResult/',
        {
          student_id: id.toString(),
          session_id: sessionId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      if (response.data.statusCode === "01") {
        setExamData(response.data.data);
        
        // Transform exam averages data for the overall graph
        const transformedData = response.data.data.exam_averages.map(exam => ({
          name: exam.exam_name,
          metrics: [
            { score: exam.percentage },
            { score: exam.topper_marks },
            { score: exam.average_marks }
          ]
        }));

        // Transform subject averages data
        const transformedSubjectData = response.data.data.subject_averages.map(subject => ({
          name: subject.subject_name,
          score: parseFloat(subject.percentage),
          color: getSubjectColor(subject.subject_name)
        }));

        setTransformedExamData(transformedData);
        setSubjectData(transformedSubjectData);
        
        // Initialize animation values
        overallAnimatedValues.length = 0;
        subjectAnimatedValues.length = 0;
        
        transformedData.forEach(group => {
          group.metrics.forEach(() => {
            overallAnimatedValues.push(new Animated.Value(0));
          });
        });

        transformedSubjectData.forEach(() => {
          subjectAnimatedValues.push(new Animated.Value(0));
        });

        // Start animations
        startAnimations(transformedData, transformedSubjectData);
      } else {
        setError('Failed to fetch exam data');
      }
    } catch (err) {
      console.error('Error fetching exam data:', err);
      setError('Failed to fetch exam data');
    } finally {
      setLoading(false);
    }
  };

  const getSubjectColor = (subjectName) => {
    switch (subjectName.toLowerCase()) {
      case 'physics':
        return '#4ECDC4';
      case 'chemistry':
        return '#FFD166';
      case 'maths':
        return '#FF6B6B';
      default:
        return '#45B7D1';
    }
  };

  const startAnimations = (examData, subjectData) => {
    // Overall graph animations
    const overallAnimations = overallAnimatedValues.map((value, index) => {
      const groupIndex = Math.floor(index / 3);
      const metricIndex = index % 3;
      const targetValue = examData[groupIndex]?.metrics[metricIndex]?.score || 0;

      return Animated.timing(value, {
        toValue: targetValue,
        duration: 1500,
        useNativeDriver: false,
      });
    });

    // Subject graph animations
    const subjectAnimations = subjectAnimatedValues.map((value, index) => {
      const targetValue = subjectData[index]?.score || 0;

      return Animated.timing(value, {
        toValue: targetValue,
        duration: 1500,
        useNativeDriver: false,
      });
    });

    Animated.stagger(100, [...overallAnimations, ...subjectAnimations]).start();
  };

  const renderOverallYAxis = () => {
    const yAxisValues = [100, 80, 60, 40, 20, 0];
    return (
      <View style={styles.yAxisOverall}>
        {yAxisValues.map((value) => (
          <View key={value} style={styles.yAxisItemOverall}>
            <Text style={styles.yAxisLabelOverall}>{value}</Text>
            <View style={styles.yAxisLineOverall} />
          </View>
        ))}
      </View>
    );
  };

  const renderOverallBarGroup = (group, groupIndex) => {
    if (!group || !group.metrics) return null;

    return (
      <View key={group.name} style={styles.overallBarGroup}>
        {group.metrics.map((metric, metricIndex) => {
          const index = groupIndex * 3 + metricIndex;
          const height = overallAnimatedValues[index]?.interpolate({
            inputRange: [0, 100],
            outputRange: [0, OVERALL_MAX_HEIGHT],
          }) || 0;

          return (
            <View key={metricIndex} style={styles.overallBarContainer}>
              <Text style={styles.overallValueLabel}>{metric.score}</Text>
              <Animated.View
                style={[
                  styles.overallBar,
                  {
                    height,
                    backgroundColor: ['#FF6B6B', '#45B7D1', '#4ECDC4'][metricIndex],
                  },
                ]}
              />
            </View>
          );
        })}
        <Text style={styles.overallSubjectLabel}>{group.name}</Text>
      </View>
    );
  };

  const renderSubjectYAxis = () => {
    const yAxisValues = [100, 80, 60, 40, 20, 0];
    return (
      <View style={styles.yAxisSubject}>
        {yAxisValues.map((value) => (
          <View key={value} style={styles.yAxisItemSubject}>
            <Text style={styles.yAxisLabelSubject}>{value}</Text>
            <View style={styles.yAxisLineSubject} />
          </View>
        ))}
      </View>
    );
  };

  const renderSubjectBars = () => {
    if (!subjectData || subjectData.length === 0) return null;

    return subjectData.map((item, index) => {
      const height = subjectAnimatedValues[index]?.interpolate({
        inputRange: [0, 100],
        outputRange: [0, SUBJECT_MAX_HEIGHT],
      }) || 0;

      return (
        <View key={index} style={styles.subjectBarContainer}>
          <Text style={styles.subjectValueLabel}>{item.score}</Text>
          <Animated.View
            style={[
              styles.subjectBar,
              {
                height,
                backgroundColor: item.color,
              },
            ]}
          />
          <Text style={styles.subjectLabel}>{item.name}</Text>
        </View>
      );
    });
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Result')}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performance Details</Text>
        <View style={styles.headerRight} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007aff" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.scrollView}>
        {/* Overall Analytical Graph */}
        <Text style={styles.overallTitle}>OVERALL ANALYTICAL GRAPH</Text>
        <View style={styles.overallGraphCard}>
          <View style={styles.overallGraphWrapper}>
            {renderOverallYAxis()}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.overallScrollContent}
            >
              <View style={styles.overallGraphContainer}>
                {transformedExamData.map((group, index) => renderOverallBarGroup(group, index))}
              </View>
            </ScrollView>
          </View>
          <View style={styles.overallXAxis}>
            <View style={styles.overallLegendContainer}>
              {['% Score', '% Topper', '% Avg'].map((metric, index) => (
                <View key={metric} style={styles.overallLegendItem}>
                  <View style={[styles.overallLegendColor, { backgroundColor: ['#FF6B6B', '#45B7D1', '#4ECDC4'][index] }]} />
                  <Text style={styles.overallLegendText}>{metric}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Subject-Wise PERCENTILE Graph */}
        <Text style={styles.subjectTitle}>SUBJECT-WISE PERCENTILE</Text>
        <View style={styles.subjectGraphCard}>
          <View style={styles.subjectGraphWrapper}>
            {renderSubjectYAxis()}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subjectScrollContent}
            >
              <View style={styles.subjectGraphContainer}>
                {renderSubjectBars()}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#5F83C7',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 110, // To balance the back button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
  yAxisOverall: {
    width: OVERALL_Y_AXIS_WIDTH,
    height: OVERALL_MAX_HEIGHT + 20,
    justifyContent: 'space-between',
    paddingRight: 5,
  },
  yAxisItemOverall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisLabelOverall: {
    fontSize: 12,
    color: '#666',
    width: 25,
    textAlign: 'right',
  },
  yAxisLineOverall: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 5,
  },
  yAxisSubject: {
    width: SUBJECT_Y_AXIS_WIDTH,
    height: SUBJECT_MAX_HEIGHT + 20,
    justifyContent: 'space-between',
    paddingRight: 5,
  },
  yAxisItemSubject: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisLabelSubject: {
    fontSize: 12,
    color: '#666',
    width: 25,
    textAlign: 'right',
  },
  yAxisLineSubject: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 5,
  },
  overallTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  overallGraphCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    marginBottom: 10,
  },
  overallGraphWrapper: {
    flexDirection: 'row',
    height: OVERALL_MAX_HEIGHT + OVERALL_X_AXIS_HEIGHT + 35,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#e0e0e0',
    paddingBottom: OVERALL_X_AXIS_HEIGHT,
  },
  overallScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
  },
  overallGraphContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    height: OVERALL_MAX_HEIGHT + 20,
  },
  overallBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: OVERALL_GROUP_SPACING / 2,
    position: 'relative',
  },
  overallBarContainer: {
    alignItems: 'center',
    marginHorizontal: OVERALL_SPACING / 2,
  },
  overallBar: {
    width: OVERALL_BAR_WIDTH,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  overallValueLabel: {
    fontSize: 8,
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  overallSubjectLabel: {
    fontSize: 10,
    color: '#666',
    position: 'absolute',
    bottom: -OVERALL_X_AXIS_HEIGHT + 5,
    textAlign: 'center',
    width: OVERALL_BAR_WIDTH * 3 + OVERALL_SPACING * 2,
  },
  overallXAxis: {
    height: OVERALL_X_AXIS_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: OVERALL_Y_AXIS_WIDTH,
    marginTop: 5,
  },
  overallLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 1,
  },
  overallLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  overallLegendColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 4,
  },
  overallLegendText: {
    fontSize: 10,
    color: '#333',
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 10,
    color: '#333',
  },
  subjectGraphCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    marginBottom: 20,
  },
  subjectGraphWrapper: {
    flexDirection: 'row',
    height: SUBJECT_MAX_HEIGHT + SUBJECT_X_AXIS_HEIGHT + 20,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#e0e0e0',
    paddingBottom: SUBJECT_X_AXIS_HEIGHT,
  },
  subjectScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
  },
  subjectGraphContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    height: SUBJECT_MAX_HEIGHT + 20,
  },
  subjectBarContainer: {
    alignItems: 'center',
    marginHorizontal: SUBJECT_SPACING / 2,
    top:5,
  },
  subjectBar: {
    width: SUBJECT_BAR_WIDTH,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  subjectValueLabel: {
    fontSize: 8,
    color: '#333',
    // marginBottom: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subjectLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
    bottom:5,
    textAlign: 'center',
    width: SUBJECT_BAR_WIDTH,
  },
});

export default DetailsScreen;