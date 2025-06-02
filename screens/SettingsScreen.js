import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

const ASYNC_STORAGE_ZIP_KEY = 'user_zip_code';
const ASYNC_STORAGE_BUDGET_KEY = 'user_max_budget';

export default function SettingsScreen({ navigation }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const [zipCode, setZipCode] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(theme.mode === 'dark');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedZip = await AsyncStorage.getItem(ASYNC_STORAGE_ZIP_KEY);
        const storedBudget = await AsyncStorage.getItem(ASYNC_STORAGE_BUDGET_KEY);
        if (storedZip) setZipCode(storedZip);
        if (storedBudget) setMaxBudget(storedBudget);
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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.settingItem}>
        <Text style={styles.label}>Current ZIP Code: {zipCode || 'Not Set'}</Text>
        <Button 
          title="Change ZIP Code" 
          onPress={() => navigation.navigate('ZipEntry', { isChanging: true })} 
          color={theme.PRIMARY_COLOR}
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
        <Button title="Save Budget" onPress={handleSaveMaxBudget} color={theme.PRIMARY_COLOR} />
      </View>
      
      <View style={[styles.settingItem, styles.themeToggleContainer]}>
        <Text style={styles.label}>Dark Mode</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#545355" }}
          thumbColor={isDarkTheme ? theme.PRIMARY_COLOR : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={handleThemeToggle}
          value={isDarkTheme}
        />
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
  themeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});
