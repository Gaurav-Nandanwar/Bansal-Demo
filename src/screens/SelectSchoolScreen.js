import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const SelectSchoolScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await axios.get('https://api.stpl.cloud/schools/');
      if (Array.isArray(res.data)) {
        setSchools(res.data);
      } else {
        setSchools([]);
      }
    } catch (err) {
      setSchools([]);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSchools(schools);
    } else {
      const filtered = schools.filter(school =>
        school.schoolname?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSchools(filtered);
    }
  }, [searchQuery, schools]);

  const handleSchoolSelect = async (school) => {
    try {
      await AsyncStorage.setItem('selectedSchoolId', String(school.id));
      await AsyncStorage.setItem('selectedSchool', JSON.stringify(school));
    } catch (e) {}
    navigation.navigate('Login', { selectedSchool: school });
  };

  const renderSchoolItem = ({ item }) => (
    <TouchableOpacity
      style={styles.schoolItem}
      onPress={() => handleSchoolSelect(item)}
    >
      {item.school_logo?.image_url ? (
        <Image source={{ uri: item.school_logo.image_url }} style={styles.schoolLogo} />
      ) : (
        <MaterialIcons name="school" size={20} color="#5F83C7" />
      )}
      <Text style={styles.schoolName}>{item.schoolname}</Text>
      <MaterialIcons name="chevron-right" size={20} color="#5F83C7" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5F83C7" barStyle="light-content" />
      
      <View style={styles.content}>
        <Image
          source={require('../../assets/select.png')}
          style={styles.logo}
          resizeMode="stretch"
        />
        <Text style={styles.title}>Select School</Text>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for your school..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>
        {searchQuery.trim() !== '' && (
          <FlatList
            data={filteredSchools}
            renderItem={renderSchoolItem}
            keyExtractor={item => String(item.id)}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 120,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom:10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '90%',
    paddingHorizontal: 16,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 20,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  list: {
    width: '90%',
  },
  listContent: {
    paddingBottom: 20,
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    height: 40,
  },
  schoolLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
    backgroundColor: '#eaeaea',
  },
  schoolName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
});

export default SelectSchoolScreen; 