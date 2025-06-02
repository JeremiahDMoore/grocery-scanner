import React, { useState, useEffect, useContext } from 'react'; // Added useContext
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext'; // Added ThemeContext

const ASYNC_STORAGE_ZIP_KEY = 'user_zip_code';

export default function ZipCodeEntryScreen({ route, navigation }) {
  const { theme } = useContext(ThemeContext); // Added: Use theme
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const isChanging = route.params?.isChanging || false;

  // Dynamic styles based on theme
  const styles = getStyles(theme);

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
        placeholderTextColor={theme.INPUT_PLACEHOLDER_COLOR}
        keyboardType="number-pad"
        maxLength={5}
      />
      <Button 
        title="Save and Continue" 
        onPress={handleSaveZipCode} 
        color={theme.BUTTON_BACKGROUND_COLOR} // Themed button
      />
    </View>
  );
}

// Styles function that accepts theme
const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.BACKGROUND_COLOR,
  },
  centered: { // For loading screen
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.BACKGROUND_COLOR,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: theme.TEXT_COLOR,
  },
  label: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
    color: theme.TEXT_COLOR, // Adjusted from #555
  },
  input: {
    borderWidth: 1,
    borderColor: theme.INPUT_BORDER_COLOR,
    backgroundColor: theme.INPUT_BACKGROUND_COLOR,
    color: theme.INPUT_TEXT_COLOR,
    padding: 12,
    fontSize: 18,
    borderRadius: 5,
    marginBottom: 25,
    textAlign: 'center',
  },
});
