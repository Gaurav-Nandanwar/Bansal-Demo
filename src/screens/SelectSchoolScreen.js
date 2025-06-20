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

// Dummy data for schools - Replace with your actual API call
const dummySchools = [
  { id: '1', name: 'Bansal Public School' },
  { id: '2', name: 'Bansal International School' },
  { id: '3', name: 'Bansal Academy' },
  { id: '4', name: 'Bansal College' },
  { id: '5', name: 'Bansal University' },
];

const SelectSchoolScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSchools, setFilteredSchools] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSchools([]);
    } else {
      const filtered = dummySchools.filter(school =>
        school.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSchools(filtered);
    }
  }, [searchQuery]);

  const handleSchoolSelect = (school) => {
    navigation.navigate('Login', { selectedSchool: school });
  };

  const renderSchoolItem = ({ item }) => (
    <TouchableOpacity
      style={styles.schoolItem}
      onPress={() => handleSchoolSelect(item)}
    >
      <MaterialIcons name="school" size={20} color="#5F83C7" />
      <Text style={styles.schoolName}>{item.name}</Text>
      <MaterialIcons name="chevron-right" size={20} color="#5F83C7" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5F83C7" barStyle="light-content" />
      
      <View style={styles.content}>
        <Image
          source={require('../../assets/school.png')}
          style={styles.logo}
          resizeMode="contain"
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

        <FlatList
          data={filteredSchools}
          renderItem={renderSchoolItem}
          keyExtractor={item => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 30,
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
  schoolName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
});

export default SelectSchoolScreen; 