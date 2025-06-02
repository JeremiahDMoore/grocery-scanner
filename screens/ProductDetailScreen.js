import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as barcodeApi from '../api/barcodeApi';

export default function ProductDetailScreen({ route, navigation }) {
  const { barcodeData } = route.params;
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [brand, setBrand] = useState('');
  const [zipCode, setZipCode] = useState(''); // Added for ZIP code input
  const [isLoading, setIsLoading] = useState(true); // For initial OFF/UPCitemdb load
  const [isKrogerLoading, setIsKrogerLoading] = useState(false); // For Kroger API load
  const [apiError, setApiError] = useState(null); // For OFF/UPCitemdb errors
  const [krogerApiError, setKrogerApiError] = useState(null); // For Kroger API errors

  useEffect(() => {
    const fetchInitialProductDetails = async () => {
      if (!barcodeData) {
        setIsLoading(false);
        setApiError("No barcode data provided.");
        return;
      }
      setIsLoading(true);
      setApiError(null);
      let foundName = '';
      let foundBrand = '';
      let foundPrice = '';

      try {
        // Call OpenFoodFacts for name/brand
        const offProduct = await barcodeApi.lookupOpenFoodFacts(barcodeData);
        if (offProduct && offProduct.product_name) {
          foundName = offProduct.product_name;
          foundBrand = offProduct.brands || '';
        }

        // Call UPCitemdb for price and to supplement name/brand if needed
        if (barcodeApi.UPCITEMDB_API_KEY === 'demo_key') {
          Alert.alert(
            "Demo API Key Active",
            "The app is using a demo API key for UPCitemdb, which is very limited. Price information may be unavailable or inaccurate. Please replace 'demo_key' with your own API key in app/api/barcodeApi.js for full functionality.",
            [{ text: "OK" }]
          );
        }
        const upcData = await barcodeApi.lookupUPCitemdb(barcodeData);
        if (upcData && upcData.items && upcData.items.length > 0) {
          const item = upcData.items[0];
          if (!foundName && item.title) { // If OpenFoodFacts didn't provide a name, use UPCitemdb's
            foundName = item.title;
          }
          if (!foundBrand && item.brand) { // If OpenFoodFacts didn't provide a brand, use UPCitemdb's
            foundBrand = item.brand;
          }
          
          // Try to get price from UPCitemdb
          if (item.lowest_recorded_price) {
            foundPrice = item.lowest_recorded_price.toString();
          } else if (item.offers && item.offers.length > 0 && item.offers[0].price) {
            // Fallback to first offer price if lowest_recorded_price is not available
            foundPrice = item.offers[0].price.toString();
          }
        }

        if (foundName || foundPrice) { // If we found any useful info
          setProductName(foundName || 'Unknown Product'); // Default if name still not found
          setBrand(foundBrand);
          setPrice(foundPrice);
          if (!foundName && !foundPrice) { // If both APIs failed to yield anything useful
             setApiError("Product not found or no price information available.");
          }
        } else {
          setApiError("Product not found in any database.");
          setProductName('');
        }

      } catch (error) {
        console.error("API Error fetching product details:", error);
        setApiError("Failed to fetch product details. Check connection or API.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialProductDetails();
  }, [barcodeData]);

  const fetchKrogerPrice = async () => {
    if (!zipCode.trim()) {
      setKrogerApiError("Please enter a ZIP code.");
      return;
    }
    if (!barcodeData) {
      setKrogerApiError("Barcode data is missing.");
      return;
    }

    setIsKrogerLoading(true);
    setKrogerApiError(null);
    try {
      const krogerData = await barcodeApi.lookupKrogerPrice(barcodeData, zipCode);
      if (krogerData && krogerData.price) {
        const newPrice = krogerData.price.promo > 0 ? krogerData.price.promo.toString() : krogerData.price.regular.toString();
        setPrice(newPrice); // Update the price field
        
        // Optionally update name and brand if not already found or if Kroger's is preferred
        if (!productName && krogerData.description) {
          setProductName(krogerData.description);
        }
        if (!brand && krogerData.brand && krogerData.brand !== 'N/A') {
          setBrand(krogerData.brand);
        }
        Alert.alert("Kroger Price Found", `Price updated to $${newPrice}`);
      } else {
        setKrogerApiError("Price not found in Kroger for this item and ZIP code.");
      }
    } catch (error) {
      console.error("Kroger API Error in screen:", error);
      setKrogerApiError(error.message || "Failed to fetch price from Kroger. Check connection or service.");
    } finally {
      setIsKrogerLoading(false);
    }
  };

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

      <View style={styles.krogerSection}>
        <Text style={styles.label}>Enter ZIP Code for Kroger Price:</Text>
        <TextInput
          style={styles.input}
          value={zipCode}
          onChangeText={setZipCode}
          placeholder="e.g., 90210"
          keyboardType="number-pad"
        />
        <Button title="Get Kroger Price" onPress={fetchKrogerPrice} disabled={isKrogerLoading} />
        {isKrogerLoading && <View style={styles.centered}><ActivityIndicator size="small" /><Text>Fetching Kroger price...</Text></View>}
        {krogerApiError && <Text style={styles.errorText}>{krogerApiError}</Text>}
      </View>

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
  },
  krogerSection: {
    marginVertical: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  }
});
