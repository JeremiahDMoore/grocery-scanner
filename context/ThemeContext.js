import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ASYNC_STORAGE_THEME_KEY = 'user_theme_preference';

export const lightTheme = {
  mode: 'light',
  BACKGROUND_COLOR: '#FFFFFF',
  TEXT_COLOR: '#000000',
  PRIMARY_COLOR: '#007AFF', // Dodger Blue (example)
  SECONDARY_COLOR: '#5856D6', // (example purple)
  ACCENT_COLOR: '#FF9500', // (example orange)
  INPUT_BACKGROUND_COLOR: '#F0F0F0',
  INPUT_TEXT_COLOR: '#000000',
  INPUT_BORDER_COLOR: '#CCCCCC',
  INPUT_PLACEHOLDER_COLOR: '#A9A9A9',
  BUTTON_BACKGROUND_COLOR: '#007AFF',
  BUTTON_TEXT_COLOR: '#FFFFFF',
  ERROR_COLOR: '#FF3B30',
  SUCCESS_COLOR: '#34C759',
  // medium: '500', // Removed direct 'medium' property
  fonts: { // Added fonts object
    regular: 'System', // Placeholder font family
    medium: 'System', // Placeholder for medium font weight/family
    bold: 'System',
  },
  // ... add more specific colors based on theme-guide.png
  // e.g., for different states of inputs (default, hover, press, correct, error, disable)
  // For now, these are general.
};

export const darkTheme = {
  mode: 'dark',
  BACKGROUND_COLOR: '#1C1C1E', // Dark mode background
  TEXT_COLOR: '#FFFFFF',
  PRIMARY_COLOR: '#0A84FF', // Dodger Blue (dark mode variant)
  SECONDARY_COLOR: '#5E5CE6', // (example purple dark)
  ACCENT_COLOR: '#FF9F0A', // (example orange dark)
  INPUT_BACKGROUND_COLOR: '#2C2C2E',
  INPUT_TEXT_COLOR: '#FFFFFF',
  INPUT_BORDER_COLOR: '#4A4A4A',
  INPUT_PLACEHOLDER_COLOR: '#8E8E93',
  BUTTON_BACKGROUND_COLOR: '#0A84FF',
  BUTTON_TEXT_COLOR: '#FFFFFF',
  ERROR_COLOR: '#FF453A',
  SUCCESS_COLOR: '#30D158',
  // medium: '500', // Removed direct 'medium' property
  fonts: { // Added fonts object
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  // ... add more specific colors
};

export const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const deviceScheme = useDeviceColorScheme(); // 'light' or 'dark'
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedPreference = await AsyncStorage.getItem(ASYNC_STORAGE_THEME_KEY);
        if (storedPreference) {
          setTheme(storedPreference === 'dark' ? darkTheme : lightTheme);
        } else {
          // If no preference stored, use device scheme
          setTheme(deviceScheme === 'dark' ? darkTheme : lightTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        setTheme(deviceScheme === 'dark' ? darkTheme : lightTheme); // Fallback
      }
    };
    loadThemePreference();
  }, [deviceScheme]);

  const toggleTheme = async () => {
    const newTheme = theme.mode === 'light' ? darkTheme : lightTheme;
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(ASYNC_STORAGE_THEME_KEY, newTheme.mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
