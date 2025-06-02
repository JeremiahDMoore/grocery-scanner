import React, { useContext } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../context/ThemeContext';
import Constants from 'expo-constants'; // For status bar height

export default function CustomHeader({ title }) {
  const { theme } = useContext(ThemeContext);

  // Gradient colors: Dodger Blue to transparent.
  // For dark theme, Dodger Blue might be too bright. Consider a theme-aware primary color.
  // For now, using a fixed Dodger Blue as per request.
  const gradientColors = ['rgba(30, 144, 255, 1)', 'rgba(30, 144, 255, 0)']; // Dodger Blue to transparent

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0 }]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      >
        <View style={styles.contentContainer}>
          <Text style={[styles.logoText, { color: theme.mode === 'light' ? '#FFFFFF' : theme.TEXT_COLOR }]}>
            Scan and Shop
          </Text>
          {/* If a title is also needed, it can be added here or instead of logo */}
          {/* <Text style={[styles.titleText, { color: theme.TEXT_COLOR }]}>{title}</Text> */}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: (Platform.OS === 'android' ? Constants.statusBarHeight : 0) + 60, // Adjust height as needed
    // backgroundColor: 'transparent', // Gradient will cover
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  contentContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the logo text
    marginTop: Platform.OS === 'ios' ? Constants.statusBarHeight : 0, // Account for iOS status bar if not translucent
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    // fontFamily: 'YourStylishFont', // TODO: Add a custom stylish font if available
  },
  // titleText: { // If you want a screen title alongside/instead of logo
  //   fontSize: 18,
  //   fontWeight: '600',
  // }
});
