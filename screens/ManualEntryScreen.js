import React, { useState, useContext } from 'react'; // Added useContext
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native'; // Added Alert
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext'; // Added ThemeContext

export default function ManualEntryScreen({ navigation, route }) {
  const { theme } = useContext(ThemeContext); // Added: Use theme
  const styles = getStyles(theme); // Dynamic styles

  const [productName, setProductName] = useState(route.params?.initialName || '');
  const [price, setPrice] = useState(route.params?.initialPrice || '');
  const [quantity, setQuantity] = useState('1');
  const [barcode, setBarcode] = useState(route.params?.barcodeData || '');

  const saveItem = async () => {
    if (!productName.trim() || !price.trim() || !quantity.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields (Product Name, Price, Quantity).');
      return;
    }
    const newItem = {
      id: Date.now().toString(), // Simple unique ID
      name: productName,
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      barcode: barcode,
    };

    try {
      const jsonValue = await AsyncStorage.getItem('shoppingList');
      const list = jsonValue != null ? JSON.parse(jsonValue) : [];
      list.push(newItem);
      await AsyncStorage.setItem('shoppingList', JSON.stringify(list));
      Alert.alert('Item Saved', `${productName} has been added to your list.`);
      // navigation.navigate('Main', { screen: 'List' });
      navigation.goBack();

    } catch (e) {
      console.error("Failed to save item to AsyncStorage", e);
      Alert.alert('Save Error', 'Failed to save item.');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Product Name*</Text>
      <TextInput
        style={styles.input}
        value={productName}
        onChangeText={setProductName}
        placeholder="e.g., Apples"
        placeholderTextColor={theme.INPUT_PLACEHOLDER_COLOR}
      />

      <Text style={styles.label}>Price*</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="e.g., 1.99"
        keyboardType="numeric"
        placeholderTextColor={theme.INPUT_PLACEHOLDER_COLOR}
      />

      <Text style={styles.label}>Quantity*</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        placeholder="e.g., 1"
        keyboardType="numeric"
        placeholderTextColor={theme.INPUT_PLACEHOLDER_COLOR}
      />

      <Text style={styles.label}>Barcode (Optional)</Text>
      <TextInput
        style={styles.input}
        value={barcode}
        onChangeText={setBarcode}
        placeholder="Scan or type barcode"
        editable={!route.params?.barcodeData} 
        placeholderTextColor={theme.INPUT_PLACEHOLDER_COLOR}
      />

      <Button title="Save Item" onPress={saveItem} color={theme.PRIMARY_COLOR} />
      <View style={{ marginVertical: 10 }} />
      <Button title="Cancel" onPress={() => navigation.goBack()} color={theme.SECONDARY_COLOR} />
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.BACKGROUND_COLOR,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 10,
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
    marginBottom: 15,
  },
});
