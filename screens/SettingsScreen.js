import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Switch, Alert, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons'; // Added Ionicons

const ASYNC_STORAGE_ZIP_KEY = 'user_zip_code';
const ASYNC_STORAGE_BUDGET_KEY = 'user_max_budget';
const ASYNC_STORAGE_BEEP_KEY = 'barcode_beep_enabled'; // New key for beep toggle

export default function SettingsScreen({ navigation }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [zipCode, setZipCode] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(theme.mode === 'dark');
  const [isBeepEnabled, setIsBeepEnabled] = useState(true); // New state for beep toggle

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedZip = await AsyncStorage.getItem(ASYNC_STORAGE_ZIP_KEY);
        const storedBudget = await AsyncStorage.getItem(ASYNC_STORAGE_BUDGET_KEY);
        const storedBeep = await AsyncStorage.getItem(ASYNC_STORAGE_BEEP_KEY);

        if (storedZip) setZipCode(storedZip);
        if (storedBudget) setMaxBudget(storedBudget);
        // Default to true if no preference is stored
        setIsBeepEnabled(storedBeep !== null ? JSON.parse(storedBeep) : true); 
      } catch (e) {
        console.error("Failed to load settings from AsyncStorage", e);
        Alert.alert('Error', 'Failed to load settings.');
      }
    };
    loadSettings();
  }, []);

  const handleSaveMaxBudget = async () => {
    if (!maxBudget.trim() || isNaN(parseFloat(maxBudget.trim())) || parseFloat(maxBudget.trim()) < 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid positive number for the budget.');
      return;
    }
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_BUDGET_KEY, parseFloat(maxBudget.trim()).toString());
      Alert.alert('Budget Saved', `Max budget has been set to $${parseFloat(maxBudget.trim()).toFixed(2)}.`);
    } catch (e) {
      console.error("Failed to save max budget", e);
      Alert.alert('Save Error', 'Failed to save max budget.');
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    setIsDarkTheme(prev => !prev);
  };

  const handleBeepToggle = async () => {
    const newValue = !isBeepEnabled;
    setIsBeepEnabled(newValue);
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_BEEP_KEY, JSON.stringify(newValue));
      Alert.alert('Setting Saved', `Barcode beep is now ${newValue ? 'ON' : 'OFF'}.`);
    } catch (e) {
      console.error("Failed to save beep preference", e);
      Alert.alert('Save Error', 'Failed to save beep preference.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.settingItem}>
        <Text style={styles.label}>Current ZIP Code: {zipCode || 'Not Set'}</Text>
        <Button 
          title="Change ZIP Code" 
          onPress={() => navigation.navigate('ZipEntry', { isChanging: true })} 
          color={theme.SECONDARY_COLOR}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.label}>Max Shopping Budget ($)</Text>
        <TextInput
          style={styles.input}
          value={maxBudget}
          onChangeText={setMaxBudget}
          placeholder="e.g., 100.00"
          keyboardType="numeric"
          placeholderTextColor={theme.INPUT_PLACEHOLDER_COLOR}
        />
        <Button title="Save Budget" onPress={handleSaveMaxBudget} color={theme.SECONDARY_COLOR} />
      </View>
      
      <View style={[styles.settingItem, styles.toggleContainer]}>
        <Text style={styles.label}>Dark Mode</Text>
        <Switch
          trackColor={{ false: theme.INPUT_BACKGROUND_COLOR, true: theme.INPUT_BACKGROUND_COLOR }}
          thumbColor={isDarkTheme ? theme.SECONDARY_COLOR : theme.SECONDARY_COLOR}
          ios_backgroundColor="#3e3e3e"
          onValueChange={handleThemeToggle}
          value={isDarkTheme}
        />
      </View>

      <View style={[styles.settingItem, styles.toggleContainer]}>
        <Text style={styles.label}>Barcode Beep</Text>
        <TouchableOpacity onPress={handleBeepToggle} style={styles.iconToggle}>
          <Ionicons 
            name={isBeepEnabled ? "volume-high-outline" : "volume-mute-outline"} 
            size={30} 
            color={isBeepEnabled ? theme.PRIMARY_COLOR : theme.INPUT_PLACEHOLDER_COLOR} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.BACKGROUND_COLOR,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: theme.TEXT_COLOR,
  },
  settingItem: {
    marginBottom: 25,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: theme.TEXT_COLOR,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.INPUT_BORDER_COLOR,
    backgroundColor: theme.INPUT_BACKGROUND_COLOR,
    color: theme.INPUT_TEXT_COLOR,
    padding: 10,
    fontSize: 16,
    borderRadius: 5,
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconToggle: {
    padding: 5, // Add some padding around the icon for easier touch
  }
});
