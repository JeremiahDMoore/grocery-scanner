import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native'; // StyleSheet might not be needed here anymore if placeholders are removed

// Import actual screens
import ScanScreen from './screens/ScanScreen';
import ManualEntryScreen from './screens/ManualEntryScreen';
import ReceiptScreen from './screens/ReceiptScreen';
import ListScreen from './screens/ListScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

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
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={MainTabs} 
          options={{ headerShown: false }} // Hide header for the tab navigator itself
        />
        <Stack.Screen name="ManualEntry" component={ManualEntryScreen} options={{ title: 'Add Item Manually' }}/>
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
