import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as barcodeApi from '../api/barcodeApi'; // We'll create this next

export default function ProductDetailScreen({ route, navigation }) {
  const { barcodeData } = route.params;
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [brand, setBrand] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!barcodeData) {
        setIsLoading(false);
        setApiError("No barcode data provided.");
        return;
      }
      setIsLoading(true);
      setApiError(null);
      try {
        // Attempt to fetch from OpenFoodFacts first
        let product = await barcodeApi.lookupOpenFoodFacts(barcodeData);
        if (product && product.product_name) {
          setProductName(product.product_name);
          setBrand(product.brands || '');
        } else {
          // Fallback to UPCitemdb if OpenFoodFacts fails or lacks name
          const upcData = await barcodeApi.lookupUPCitemdb(barcodeData);
          if (upcData && upcData.items && upcData.items.length > 0) {
            const item = upcData.items[0];
            setProductName(item.title || 'Unknown Product');
            setBrand(item.brand || '');
            // UPCitemdb might have price hints
            if (item.lowest_recorded_price) {
              setPrice(item.lowest_recorded_price.toString());
            }
          } else {
            setApiError("Product not found in databases.");
            setProductName(''); // Clear name if not found
          }
        }
      } catch (error) {
        console.error("API Error fetching product details:", error);
        setApiError("Failed to fetch product details. Check connection or API.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [barcodeData]);

  const saveItem = async () => {
    if (!productName.trim() || !price.trim() || !quantity.trim()) {
      Alert.alert('Missing Information', 'Please ensure Product Name, Price, and Quantity are filled.');
      return;
    }
    const newItem = {
      id: Date.now().toString(),
      name: productName,
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      barcode: barcodeData,
      brand: brand,
    };

    try {
      const jsonValue = await AsyncStorage.getItem('shoppingList');
      const list = jsonValue != null ? JSON.parse(jsonValue) : [];
      list.push(newItem);
      await AsyncStorage.setItem('shoppingList', JSON.stringify(list));
      Alert.alert('Item Saved', `${productName} has been added to your list.`);
      navigation.navigate('Main', { screen: 'List' });
    } catch (e) {
      console.error("Failed to save item to AsyncStorage", e);
      Alert.alert('Save Error', 'Failed to save item.');
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /><Text>Loading product details...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Product Details</Text>
      {apiError && <Text style={styles.errorText}>{apiError}</Text>}
      
      <Text style={styles.label}>Barcode</Text>
      <TextInput
        style={[styles.input, styles.readOnlyInput]}
        value={barcodeData}
        editable={false}
      />

      <Text style={styles.label}>Product Name*</Text>
      <TextInput
        style={styles.input}
        value={productName}
        onChangeText={setProductName}
        placeholder="e.g., Organic Apples"
      />
      
      {brand ? (
        <>
          <Text style={styles.label}>Brand</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={brand}
            editable={false} 
          />
        </>
      ) : null}

      <Text style={styles.label}>Price*</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="e.g., 2.99"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Quantity*</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        placeholder="e.g., 1"
        keyboardType="numeric"
        defaultValue="1"
      />

      <Button title="Add to Shopping List" onPress={saveItem} />
      <View style={{ marginVertical: 10 }} />
      <Button title="Enter Manually Instead" onPress={() => navigation.replace('ManualEntry', { barcodeData })} color="grey"/>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
  readOnlyInput: {
    backgroundColor: '#f0f0f0',
    color: '#555',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  }
});
