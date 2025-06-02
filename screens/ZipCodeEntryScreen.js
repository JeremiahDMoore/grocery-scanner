import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ASYNC_STORAGE_ZIP_KEY = 'user_zip_code';

export default function ZipCodeEntryScreen({ route, navigation }) { // Added route
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const isChanging = route.params?.isChanging || false; // Check if we are changing ZIP

  useEffect(() => {
    const loadCurrentZip = async () => {
      try {
        const storedZip = await AsyncStorage.getItem(ASYNC_STORAGE_ZIP_KEY);
        if (storedZip) {
          if (isChanging) {
            setZipCode(storedZip); // Pre-fill if changing
            setIsLoading(false);
          } else {
            // If not 'isChanging' and ZIP is stored, navigate to the main app
            navigation.replace('Main');
          }
        } else {
          setIsLoading(false); // No ZIP stored, show the input form
        }
      } catch (e) {
        console.error("Failed to load ZIP code from AsyncStorage", e);
        setIsLoading(false); // Proceed to show form even if loading fails
      }
    };
    loadCurrentZip();
  }, [navigation, isChanging]);

  const handleSaveZipCode = async () => {
    if (!zipCode.trim() || !/^\d{5}$/.test(zipCode.trim())) {
      Alert.alert('Invalid ZIP Code', 'Please enter a valid 5-digit ZIP code.');
      return;
    }
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_ZIP_KEY, zipCode.trim());
      Alert.alert('ZIP Code Saved', `ZIP code ${zipCode.trim()} has been saved.`);
      // Navigate to the main part of the app after saving
      navigation.replace('Main');
    } catch (e) {
      console.error("Failed to save ZIP code to AsyncStorage", e);
      Alert.alert('Save Error', 'Failed to save ZIP code.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Enter Your ZIP Code</Text>
      <Text style={styles.label}>
        This ZIP code will be used to find local prices. You can change it later in settings (if settings screen is implemented).
      </Text>
      <TextInput
        style={styles.input}
        value={zipCode}
        onChangeText={setZipCode}
        placeholder="e.g., 90210"
        keyboardType="number-pad"
        maxLength={5}
      />
      <Button title="Save and Continue" onPress={handleSaveZipCode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    fontSize: 18,
    borderRadius: 5,
    marginBottom: 25,
    textAlign: 'center',
  },
});
