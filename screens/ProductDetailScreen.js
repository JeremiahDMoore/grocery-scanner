import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as barcodeApi from '../api/barcodeApi';
import { ThemeContext } from '../context/ThemeContext';

const ASYNC_STORAGE_ZIP_KEY = 'user_zip_code';

export default function ProductDetailScreen({ route, navigation }) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  const { barcodeData } = route.params;
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [brand, setBrand] = useState('');
  const [storedZipCode, setStoredZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isKrogerLoading, setIsKrogerLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [krogerApiError, setKrogerApiError] = useState(null);

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
        const offProduct = await barcodeApi.lookupOpenFoodFacts(barcodeData);
        if (offProduct && offProduct.product_name) {
          foundName = offProduct.product_name;
          foundBrand = offProduct.brands || '';
        }

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
          if (!foundName && item.title) {
            foundName = item.title;
          }
          if (!foundBrand && item.brand) {
            foundBrand = item.brand;
          }
          
          if (item.lowest_recorded_price) {
            foundPrice = item.lowest_recorded_price.toString();
          } else if (item.offers && item.offers.length > 0 && item.offers[0].price) {
            foundPrice = item.offers[0].price.toString();
          }
        }

        if (foundName || foundPrice) {
          setProductName(foundName || 'Unknown Product');
          setBrand(foundBrand);
          setPrice(foundPrice);
          if (!foundName && !foundPrice) {
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

  useEffect(() => {
    const loadZipAndFetchKrogerPrice = async () => {
      let currentZip = '';
      try {
        const fetchedZip = await AsyncStorage.getItem(ASYNC_STORAGE_ZIP_KEY);
        if (fetchedZip) {
          setStoredZipCode(fetchedZip);
          currentZip = fetchedZip;
        } else {
          setKrogerApiError("No ZIP code stored. Please set a ZIP code first.");
          return;
        }
      } catch (e) {
        console.error("Failed to load ZIP for Kroger price", e);
        setKrogerApiError("Could not load ZIP code for price lookup.");
        return;
      }

      if (barcodeData && currentZip) {
        setIsKrogerLoading(true);
        setKrogerApiError(null);
        try {
          const krogerData = await barcodeApi.lookupKrogerPrice(barcodeData, currentZip);
          if (krogerData && krogerData.price) {
            const newPrice = (krogerData.price.promo > 0 ? krogerData.price.promo : krogerData.price.regular).toString();
            setPrice(newPrice);
            if (!productName && krogerData.description) {
              setProductName(krogerData.description);
            }
            if (!brand && krogerData.brand && krogerData.brand !== 'N/A') {
              setBrand(krogerData.brand);
            }
          } else {
            setKrogerApiError("Price not found in Kroger for this item and ZIP code.");
          }
        } catch (error) {
          console.error("Kroger API Error in screen:", error);
          setKrogerApiError(error.message || "Failed to fetch price from Kroger.");
        } finally {
          setIsKrogerLoading(false);
        }
      }
    };

    if (!isLoading && barcodeData) {
        loadZipAndFetchKrogerPrice();
    }
  }, [barcodeData, isLoading, navigation]);

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
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.header}>Product Details</Text>
      {apiError && <Text style={styles.errorText}>{apiError}</Text>}
      
      <Text style={styles.label}>Barcode</Text>
      <TextInput
        style={[styles.input, styles.readOnlyInput]}
        value={barcodeData}
        editable={false}
        placeholderTextColor={theme.INPUT_PLACEHOLDER_COLOR}
      />

      <Text style={styles.label}>Product Name*</Text>
      <TextInput
        style={styles.input}
        value={productName}
        onChangeText={setProductName}
        placeholder="e.g., Organic Apples"
        placeholderTextColor={theme.INPUT_PLACEHOLDER_COLOR}
      />
      
      {brand ? (
        <>
          <Text style={styles.label}>Brand</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={brand}
            editable={false} 
            placeholderTextColor={theme.INPUT_PLACEHOLDER_COLOR}
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
        placeholderTextColor={theme.INPUT_PLACEHOLDER_COLOR}
      />

      {isKrogerLoading && (
        <View style={styles.centeredRow}>
          <ActivityIndicator size="small" color={theme.PRIMARY_COLOR} />
          <Text style={styles.loadingKrogerText}>Fetching Kroger price for ZIP: {storedZipCode}...</Text>
        </View>
      )}
      {krogerApiError && <Text style={styles.errorText}>{krogerApiError}</Text>}
      {!isKrogerLoading && !krogerApiError && price && storedZipCode && (
        <View style={styles.zipInfoRow}>
          <Text style={styles.infoText}>Price displayed is based on ZIP code: {storedZipCode}.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ZipEntry', { isChanging: true })}>
            <Text style={styles.changeZipText}>change</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={{ marginBottom: 15 }} /> 


      <Text style={styles.label}>Quantity*</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        placeholder="e.g., 1"
        keyboardType="numeric"
        defaultValue="1"
        placeholderTextColor={theme.INPUT_PLACEHOLDER_COLOR}
      />

      <Button title="Add to Shopping List" onPress={saveItem} color={theme.SUCCESS_COLOR} />
      <View style={{ marginVertical: 10 }} />
      <Button 
        title="Enter Manually Instead" 
        onPress={() => navigation.replace('ManualEntry', { barcodeData })} 
        color={theme.SECONDARY_COLOR}
      />

    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.BACKGROUND_COLOR,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.BACKGROUND_COLOR,
  },
  loadingText: {
    marginTop: 10,
    color: theme.TEXT_COLOR,
    fontSize: 16,
  },
  loadingKrogerText: {
    marginLeft: 10,
    color: theme.TEXT_COLOR,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: theme.TEXT_COLOR,
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
  readOnlyInput: {
    backgroundColor: theme.mode === 'light' ? '#f0f0f0' : '#3A3A3C',
    color: theme.mode === 'light' ? '#555' : '#C7C7CC',
  },
  errorText: {
    color: theme.ERROR_COLOR,
    textAlign: 'center',
    marginBottom: 10,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 12,
    color: theme.mode === 'light' ? 'grey' : theme.INPUT_PLACEHOLDER_COLOR,
    // Removed marginBottom:10 as it's now in zipInfoRow
  },
  zipInfoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10, // Added marginBottom here
  },
  changeZipText: {
    color: theme.PRIMARY_COLOR,
    fontSize: 12,
    textDecorationLine: 'underline',
    marginLeft: 5, // Space between info text and change button
  },
  centeredRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  }
});
