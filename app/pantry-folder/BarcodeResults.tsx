import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function BarcodeResults() {
  const { scannedCode } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rezultatele scanării</Text>
      <Text style={styles.code}>Cod scanat: {scannedCode}</Text>
      {/* Aici poți adăuga logică pentru a căuta produsul în baza de date sau API */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  code: {
    fontSize: 18,
    textAlign: 'center',
  },
});
