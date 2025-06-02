import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ManualEntryScreen({ navigation, route }) {
  const [productName, setProductName] = useState(route.params?.initialName || '');
  const [price, setPrice] = useState(route.params?.initialPrice || '');
  const [quantity, setQuantity] = useState('1');
  const [barcode, setBarcode] = useState(route.params?.barcodeData || '');

  const saveItem = async () => {
    if (!productName.trim() || !price.trim() || !quantity.trim()) {
      alert('Please fill in all required fields (Product Name, Price, Quantity).');
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
      alert('Item saved!');
      navigation.navigate('Main', { screen: 'List' });
    } catch (e) {
      console.error("Failed to save item to AsyncStorage", e);
      alert('Failed to save item.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Product Name*</Text>
      <TextInput
        style={styles.input}
        value={productName}
        onChangeText={setProductName}
        placeholder="e.g., Apples"
      />

      <Text style={styles.label}>Price*</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="e.g., 1.99"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Quantity*</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        placeholder="e.g., 1"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Barcode (Optional)</Text>
      <TextInput
        style={styles.input}
        value={barcode}
        onChangeText={setBarcode}
        placeholder="Scan or type barcode"
        editable={!route.params?.barcodeData} // If barcode came from scan, don't edit
      />

      <Button title="Save Item" onPress={saveItem} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    fontSize: 16,
    borderRadius: 5,
    marginBottom: 15,
  },
});
