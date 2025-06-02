import React, { useState, useEffect, useContext } from 'react'; // Added useContext
import { View, Text, FlatList, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext'; // Added ThemeContext

export default function ListScreen({ navigation }) {
  const { theme } = useContext(ThemeContext); // Added: Use theme
  const styles = getStyles(theme); // Dynamic styles

  const [items, setItems] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [maxBudget, setMaxBudget] = useState(0); // Added state for maxBudget
  const isFocused = useIsFocused(); // Keep useIsFocused for general focus detection
  const ASYNC_STORAGE_BUDGET_KEY = 'user_max_budget';

  const loadData = async () => {
    try {
      const itemsJsonValue = await AsyncStorage.getItem('shoppingList');
      const storedItems = itemsJsonValue != null ? JSON.parse(itemsJsonValue) : [];
      setItems(storedItems);
      calculateTotal(storedItems);

      const budgetJsonValue = await AsyncStorage.getItem(ASYNC_STORAGE_BUDGET_KEY);
      const storedBudget = budgetJsonValue != null ? parseFloat(budgetJsonValue) : 0;
      setMaxBudget(storedBudget);

    } catch (e) {
      console.error("Failed to load data from AsyncStorage", e);
      Alert.alert('Error', 'Failed to load shopping list or budget.');
    }
  };

  useEffect(() => {
    // Use navigation.addListener('focus') for more reliable data refresh
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    // Return the function to unsubscribe from the event so it gets cleaned up
    return unsubscribe;
  }, [navigation]); // Depend on navigation object

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
        <Ionicons name="trash-outline" size={24} color={theme.ERROR_COLOR} />
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
        {maxBudget > 0 && (
          <View style={styles.budgetContainer}>
            <Text style={styles.budgetText}>Budget: ${maxBudget.toFixed(2)}</Text>
            <Text style={styles.totalText}>Total: ${totalCost.toFixed(2)}</Text>
            <Text style={
              (maxBudget - totalCost) >= 0 ? styles.remainingBudgetTextPositive : styles.remainingBudgetTextNegative
            }>
              Remaining: ${(maxBudget - totalCost).toFixed(2)}
            </Text>
          </View>
        )}
        {maxBudget === 0 && (
             <Text style={styles.totalText}>Total: ${totalCost.toFixed(2)}</Text>
        )}
        <Button
          title="Add Item Manually"
          onPress={() => navigation.navigate('ManualEntry')}
          color={theme.PRIMARY_COLOR}
        />
      </View>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.BACKGROUND_COLOR,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20, // Added for better text wrapping
  },
  emptyListText: {
    fontSize: 18,
    color: theme.TEXT_COLOR, // Was #666
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
    backgroundColor: theme.BACKGROUND_COLOR, // Was white
    borderBottomWidth: 1,
    borderBottomColor: theme.INPUT_BORDER_COLOR, // Was #eee
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.TEXT_COLOR,
  },
  itemPrice: {
    fontSize: 16,
    color: theme.TEXT_COLOR, // Was #333
  },
  itemBarcode: {
    fontSize: 12,
    color: theme.TEXT_COLOR, // Was #777
    opacity: 0.7,
  },
  deleteButton: {
    padding: 10,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.INPUT_BORDER_COLOR, // Was #ccc
    backgroundColor: theme.BACKGROUND_COLOR, // Was white
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5, // Reduced margin for budget layout
    color: theme.TEXT_COLOR,
  },
  budgetContainer: {
    marginBottom: 15,
    alignItems: 'center',
  },
  budgetText: {
    fontSize: 16,
    color: theme.TEXT_COLOR,
    textAlign: 'center',
  },
  remainingBudgetTextPositive: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.SUCCESS_COLOR, // Or a neutral color
    textAlign: 'center',
    marginBottom: 10,
  },
  remainingBudgetTextNegative: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.ERROR_COLOR,
    textAlign: 'center',
    marginBottom: 10,
  }
});
