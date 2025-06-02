import 'react-native-gesture-handler';
import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

// Import actual screens
import ScanScreen from './screens/ScanScreen';
import { Alert } from 'react-native';
import ManualEntryScreen from './screens/ManualEntryScreen';
import ReceiptScreen from './screens/ReceiptScreen';
import ListScreen from './screens/ListScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ZipCodeEntryScreen from './screens/ZipCodeEntryScreen';
import SettingsScreen from './screens/SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import CustomHeader from './components/CustomHeader';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ASYNC_STORAGE_ZIP_KEY = 'user_zip_code';

function AppContent() {
  const { theme } = useContext(ThemeContext);
  const [isCheckingZip, setIsCheckingZip] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState(null);

  function MainTabsWithTheme() {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else if (route.name === 'Scan') {
              iconName = focused ? 'scan-circle' : 'scan-circle-outline';
            } else if (route.name === 'List') {
              iconName = focused ? 'list-circle' : 'list-circle-outline';
            } else if (route.name === 'Receipt') {
              iconName = focused ? 'receipt' : 'receipt-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarStyle: { backgroundColor: theme.BACKGROUND_COLOR, borderTopColor: theme.INPUT_BORDER_COLOR },
          tabBarActiveTintColor: theme.PRIMARY_COLOR,
          tabBarInactiveTintColor: theme.mode === 'light' ? 'gray' : theme.INPUT_PLACEHOLDER_COLOR,
          headerShown: false,
        })}
      >
        <Tab.Screen name="Settings" component={SettingsScreen} />
        <Tab.Screen name="Scan" component={ScanScreen} />
        <Tab.Screen name="List" component={ListScreen} />
        <Tab.Screen name="Receipt" component={ReceiptScreen} />
      </Tab.Navigator>
    );
  }

  const navigationTheme = {
    dark: theme.mode === 'dark',
    colors: {
      primary: theme.PRIMARY_COLOR,
      background: theme.BACKGROUND_COLOR,
      card: theme.BACKGROUND_COLOR,
      text: theme.TEXT_COLOR,
      border: theme.INPUT_BORDER_COLOR,
      notification: theme.PRIMARY_COLOR,
    },
    // Add fonts to the navigation theme
    fonts: {
      regular: {
        fontFamily: theme.fonts.regular,
        fontWeight: 'normal',
      },
      medium: {
        fontFamily: theme.fonts.medium,
        fontWeight: '500', // React Navigation often expects fontWeight here
      },
      // Add other font weights if needed by React Navigation
    },
  };

  useEffect(() => {
    const checkStoredZip = async () => {
      const DEFAULT_ZIP_CODE = '85016';
      try {
        let currentZip = await AsyncStorage.getItem(ASYNC_STORAGE_ZIP_KEY);
        if (currentZip) {
          setInitialRouteName('Main');
        } else {
          await AsyncStorage.setItem(ASYNC_STORAGE_ZIP_KEY, DEFAULT_ZIP_CODE);
          Alert.alert(
            "Default ZIP Code Set",
            `No ZIP code was found. Default ZIP code ${DEFAULT_ZIP_CODE} has been set. You can change this later.`,
            [{ text: "OK" }]
          );
          console.log(`Default ZIP code ${DEFAULT_ZIP_CODE} set.`);
          setInitialRouteName('Main');
        }
      } catch (e) {
        console.error("Failed to load or set ZIP from storage for initial route", e);
        setInitialRouteName('ZipEntry');
      } finally {
        setIsCheckingZip(false);
      }
    };
    checkStoredZip();
  }, []);

  if (isCheckingZip || !initialRouteName) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.BACKGROUND_COLOR }}>
        <Text style={{ color: theme.TEXT_COLOR }}>Loading application...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={({ navigation }) => ({
          header: (props) => <CustomHeader {...props} />,
        })}
      >
        <Stack.Screen name="ZipEntry" component={ZipCodeEntryScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="Main" 
          component={MainTabsWithTheme} 
          // Removed headerShown: false to allow CustomHeader to be displayed
          // The bottom navbar will remain persistent on all screens, displaying [Settings, Scan, List, Receipt]
          // This means the header will appear above the tab bar.
        />
        <Stack.Screen
          name="ManualEntry"
          component={ManualEntryScreen}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function AppWrapper() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
