import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

export default function ListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const isFocused = useIsFocused();

  const loadItems = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('shoppingList');
      const storedItems = jsonValue != null ? JSON.parse(jsonValue) : [];
      setItems(storedItems);
      calculateTotal(storedItems);
    } catch (e) {
      console.error("Failed to load items from AsyncStorage", e);
      Alert.alert('Error', 'Failed to load shopping list.');
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadItems();
    }
  }, [isFocused]);

  const calculateTotal = (currentItems) => {
    const total = currentItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalCost(total);
  };

  const deleteItem = async (id) => {
    try {
      const updatedItems = items.filter(item => item.id !== id);
      setItems(updatedItems);
      await AsyncStorage.setItem('shoppingList', JSON.stringify(updatedItems));
      calculateTotal(updatedItems);
    } catch (e) {
      console.error("Failed to delete item from AsyncStorage", e);
      Alert.alert('Error', 'Failed to delete item.');
    }
  };

  const confirmDeleteItem = (id) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => deleteItem(id), style: "destructive" }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name} ({item.quantity})</Text>
        <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)} (Unit: ${item.price.toFixed(2)})</Text>
        {item.barcode ? <Text style={styles.itemBarcode}>Barcode: {item.barcode}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => confirmDeleteItem(item.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>Your shopping list is empty.</Text>
            <Text style={styles.emptyListText}>Scan items or add them manually!</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          style={styles.list}
        />
      )}
      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: ${totalCost.toFixed(2)}</Text>
        <Button
          title="Add Item Manually"
          onPress={() => navigation.navigate('ManualEntry')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 16,
    color: '#333',
  },
  itemBarcode: {
    fontSize: 12,
    color: '#777',
  },
  deleteButton: {
    padding: 10,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: 'white',
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
});
