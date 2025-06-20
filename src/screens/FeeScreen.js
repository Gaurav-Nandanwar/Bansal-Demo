import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, ToastAndroid, Platform, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import Header from '../components/Header'
import AsyncStorage from '@react-native-async-storage/async-storage'

const FeeScreen = () => {
    const [loading, setLoading] = useState(true);
    const [feeData, setFeeData] = useState(null);
    const [error, setError] = useState(null);

    const handlePayNow = () => {
        if (Platform.OS === 'android') {
            ToastAndroid.show('Payment gateway coming soon...', ToastAndroid.SHORT);
        } else {
            Alert.alert('Coming Soon', 'Payment gateway coming soon...');
        }
    };

    useEffect(() => {
        loadFeeData();
    }, []);

    const loadFeeData = async () => {
        try {
            setLoading(true);
            const savedIdentifiers = await AsyncStorage.getItem('userIdentifiers');
            const identifiers = JSON.parse(savedIdentifiers);
            
            console.log('=== Fee Screen ===');
            console.log('Student ID:', identifiers?.student_id);
            console.log('School ID:', identifiers?.school_id);

            if (!identifiers?.student_id || !identifiers?.school_id) {
                throw new Error('Required identifiers not found');
            }

            // Get fee data from AsyncStorage
            const studentDetails = await AsyncStorage.getItem('studentDetails');
            const parsedStudentDetails = JSON.parse(studentDetails);
            
            console.log('Student Details:', parsedStudentDetails);
            
            if (parsedStudentDetails?.student_fees_heads) {
                const feeDetails = {
                    totalAmount: parsedStudentDetails.total_amount || 0,
                    feeHeads: parsedStudentDetails.student_fees_heads,
                    busFee: parsedStudentDetails.bus_fee
                };
                
                console.log('Fee Details:', feeDetails);
                setFeeData(feeDetails);
            } else {
                throw new Error('Fee data not found');
            }
            
            setLoading(false);
        } catch (err) {
            console.error('Error loading fee data:', err);
            setError('Failed to load fee data');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Header title="Fee Details" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0066cc" />
                    <Text style={styles.loadingText}>Loading fee details...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Header title="Fee Details" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadFeeData}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Fee Details" />
            <ScrollView style={styles.scrollView}>
                {/* Fee Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.cardTitle}>Fee Summary</Text>
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Amount</Text>
                            <Text style={styles.summaryValue}>₹{feeData?.totalAmount}</Text>
                        </View>
                    </View>
                </View>

                {/* Fee Heads Card */}
                <View style={styles.feeHeadsCard}>
                    <Text style={styles.cardTitle}>Fee Structure</Text>
                    {feeData?.feeHeads.map((feeHead, index) => (
                        <View key={index} style={styles.feeHeadItem}>
                            <View style={styles.feeHeadInfo}>
                                <Text style={styles.feeHeadName}>{feeHead.feeshead_name}</Text>
                                <Text style={styles.feeHeadGroup}>{feeHead.group_name}</Text>
                            </View>
                            <View style={styles.feeHeadDetails}>
                                <Text style={styles.feeHeadAmount}>₹{feeHead.amount}</Text>
                                <Text style={styles.feeHeadFrequency}>{feeHead.frequency}</Text>
                            </View>
                        </View>
                    ))}
                    {feeData?.busFee && (
                        <View style={styles.feeHeadItem}>
                            <View style={styles.feeHeadInfo}>
                                <Text style={styles.feeHeadName}>Bus Fee</Text>
                                <Text style={styles.feeHeadGroup}>Transportation</Text>
                            </View>
                            <View style={styles.feeHeadDetails}>
                                <Text style={styles.feeHeadAmount}>₹{feeData.busFee}</Text>
                                <Text style={styles.feeHeadFrequency}>Monthly</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Payment Button */}
                <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
                    <Text style={styles.payButtonText}>Pay Now</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    )
}

export default FeeScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 5,
        fontSize: 12,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    errorText: {
        fontSize: 12,
        color: '#e74c3c',
        marginBottom: 10,
    },
    retryButton: {
        backgroundColor: '#0066cc',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 4,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 12,
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 6,
        padding: 8,
        marginBottom: 8,
        elevation: 1,
    },
    feeHeadsCard: {
        backgroundColor: 'white',
        borderRadius: 6,
        padding: 8,
        marginBottom: 8,
        elevation: 1,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    feeHeadItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    feeHeadInfo: {
        flex: 1,
    },
    feeHeadName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    feeHeadGroup: {
        fontSize: 10,
        color: '#666',
    },
    feeHeadDetails: {
        alignItems: 'flex-end',
    },
    feeHeadAmount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
    },
    feeHeadFrequency: {
        fontSize: 10,
        color: '#666',
    },
    payButton: {
        backgroundColor: '#3498db',
        padding: 8,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 8,
    },
    payButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
})