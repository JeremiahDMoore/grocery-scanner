import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native'; // StyleSheet might not be needed here anymore if placeholders are removed

// Import actual screens
import ScanScreen from './screens/ScanScreen';
import { Alert } from 'react-native'; // Added Alert
import ManualEntryScreen from './screens/ManualEntryScreen';
import ReceiptScreen from './screens/ReceiptScreen';
import ListScreen from './screens/ListScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ZipCodeEntryScreen from './screens/ZipCodeEntryScreen'; // Added
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ASYNC_STORAGE_ZIP_KEY = 'user_zip_code'; // Added

// StyleSheet might not be needed here anymore if placeholders are removed
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

// Tab Navigator for core features
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Scan') {
            iconName = focused ? 'scan-circle' : 'scan-circle-outline';
          } else if (route.name === 'List') {
            iconName = focused ? 'list-circle' : 'list-circle-outline';
          } else if (route.name === 'Receipt') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="List" component={ListScreen} />
      <Tab.Screen name="Receipt" component={ReceiptScreen} />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
export default function App() {
  const [isCheckingZip, setIsCheckingZip] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState(null); // Will be 'ZipEntry' or 'Main'

  useEffect(() => {
    const checkStoredZip = async () => {
      const DEFAULT_ZIP_CODE = '85016';
      try {
        let currentZip = await AsyncStorage.getItem(ASYNC_STORAGE_ZIP_KEY);
        if (currentZip) {
          setInitialRouteName('Main');
        } else {
          // No ZIP stored, set the default and save it
          await AsyncStorage.setItem(ASYNC_STORAGE_ZIP_KEY, DEFAULT_ZIP_CODE);
          Alert.alert(
            "Default ZIP Code Set",
            `No ZIP code was found. Default ZIP code ${DEFAULT_ZIP_CODE} has been set. You can change this later.`,
            [{ text: "OK" }]
          );
          console.log(`Default ZIP code ${DEFAULT_ZIP_CODE} set.`);
          setInitialRouteName('Main'); // Proceed to main app with default ZIP
        }
      } catch (e) {
        console.error("Failed to load or set ZIP from storage for initial route", e);
        // If storage fails, we might still want to go to ZipEntry or handle error
        setInitialRouteName('ZipEntry'); 
      } finally {
        setIsCheckingZip(false);
      }
    };
    checkStoredZip();
  }, []);

  if (isCheckingZip || !initialRouteName) {
    // You can return a proper loading screen here
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading application...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen 
          name="ZipEntry" 
          component={ZipCodeEntryScreen} 
          options={{ title: 'Enter Your ZIP Code', headerShown: false }} 
        />
        <Stack.Screen 
          name="Main" 
          component={MainTabs} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen name="ManualEntry" component={ManualEntryScreen} options={{ title: 'Add Item Manually' }}/>
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
