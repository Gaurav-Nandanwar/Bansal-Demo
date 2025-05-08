import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons
from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

const Header = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isHome = route.name === 'Home';

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => {
        isHome ? navigation.openDrawer() : navigation.goBack();
      }}>
        <MaterialIcons
 name={isHome ? 'menu' : 'arrow-back'} size={28} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.title}>{route.name}</Text>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#5F83C7',
    elevation: 4,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
  },
});
