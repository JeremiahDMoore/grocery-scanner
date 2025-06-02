import 'react-native-gesture-handler';
import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, StatusBar, Platform } from 'react-native';

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
const Stack = createStackNavigator(); // Main stack
const SettingsStack = createStackNavigator(); // Stack for Settings tab
const ScanStack = createStackNavigator();     // Stack for Scan tab
const ListStack = createStackNavigator();     // Stack for List tab
const ReceiptStack = createStackNavigator();  // Stack for Receipt tab

const ASYNC_STORAGE_ZIP_KEY = 'user_zip_code';

function AppContent() {
  const { theme } = useContext(ThemeContext);
  const [isCheckingZip, setIsCheckingZip] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState(null);

  // Define nested Stack Navigators for each tab
  function SettingsStackScreen() {
    return (
      <SettingsStack.Navigator screenOptions={{ header: (props) => <CustomHeader {...props} /> }}>
        <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} options={{ title: 'Settings' }} />
        {/* ZipEntry is now part of Settings flow */}
        <SettingsStack.Screen name="ZipEntry" component={ZipCodeEntryScreen} options={{ headerShown: false }} />
      </SettingsStack.Navigator>
    );
  }

  function ScanStackScreen() {
    return (
      <ScanStack.Navigator screenOptions={{ header: (props) => <CustomHeader {...props} /> }}>
        <ScanStack.Screen name="ScanHome" component={ScanScreen} options={{ title: 'Scan' }} />
        <ScanStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
        <ScanStack.Screen name="ManualEntry" component={ManualEntryScreen} options={{ title: 'Add Item Manually' }} />
      </ScanStack.Navigator>
    );
  }

  function ListStackScreen() {
    return (
      <ListStack.Navigator screenOptions={{ header: (props) => <CustomHeader {...props} /> }}>
        <ListStack.Screen name="ListHome" component={ListScreen} options={{ title: 'Shopping List' }} />
        {/* ManualEntry can also be accessed from List */}
        <ListStack.Screen name="ManualEntry" component={ManualEntryScreen} options={{ title: 'Add Item Manually' }} />
      </ListStack.Navigator>
    );
  }

  function ReceiptStackScreen() {
    return (
      <ReceiptStack.Navigator screenOptions={{ header: (props) => <CustomHeader {...props} /> }}>
        <ReceiptStack.Screen name="ReceiptHome" component={ReceiptScreen} options={{ title: 'Receipt Scanner' }} />
      </ReceiptStack.Navigator>
    );
  }

  // Main Tabs Navigator, now containing Stack Navigators
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
          tabBarStyle: { backgroundColor: theme.INPUT_BACKGROUND_COLOR, borderTopColor: theme.INPUT_BORDER_COLOR },
          tabBarActiveTintColor: theme.PRIMARY_COLOR,
          tabBarInactiveTintColor: theme.mode === 'light' ? theme.SECONDARY_COLOR : theme.SECONDARY_COLOR,
          headerShown: false, // Hide header for the tab navigator itself, headers are in nested stacks
        })}
      >
        <Tab.Screen name="Settings" component={SettingsStackScreen} />
        <Tab.Screen name="Scan" component={ScanStackScreen} />
        <Tab.Screen name="List" component={ListStackScreen} />
        <Tab.Screen name="Receipt" component={ReceiptStackScreen} />
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
    fonts: {
      regular: {
        fontFamily: theme.fonts.regular,
        fontWeight: 'normal',
      },
      medium: {
        fontFamily: theme.fonts.medium,
        fontWeight: '500',
      },
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
      {Platform.OS === 'android' && (
        <StatusBar backgroundColor={theme.SECONDARY_COLOR} barStyle="light-content" />
      )}
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false }} // Hide header for the root stack, nested stacks handle their own
      >
        <Stack.Screen name="ZipEntry" component={ZipCodeEntryScreen} />
        <Stack.Screen name="Main" component={MainTabsWithTheme} />
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
