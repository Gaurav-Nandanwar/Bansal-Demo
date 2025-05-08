import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';

const FeesScreen = () => {
  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <Text>Welcome to the FeesScreen Dashboard</Text>
      </View>
    </View>
  );
};

export default FeesScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
