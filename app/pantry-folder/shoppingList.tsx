import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { normalizeQuantity } from '../../utils/normalizeQuantity';
import { auth, db } from '../../backend/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import clockIcon from '../../assets/images/clock-ok.png';
import cookBookIcon from '../../assets/images/cook-book-ok.png';
import alphaIcon from '../../assets/images/alpha-ok.png';
import { commonStyles } from '../../constants/Styles';

import { styles } from './styles/shoppingList.styles';

// tip pentru item din lista de cumparaturi
interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
  recipeName?: string;
  measurementType?: 'weight' | 'volume' | 'pieces' | 'other';
  remainingQuantity?: string;
  boughtQuantity?: string;
  unit?: string;
}

// categorii pentru organizarea ingredientelor
const CATEGORIES = {
  'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
  'Meat': ['beef', 'chicken', 'pork', 'lamb', 'fish'],
  'Produce': ['apple', 'banana', 'carrot', 'lettuce', 'tomato'],
  'Bakery': ['bread', 'bun', 'roll', 'pastry'],
  'Pantry': ['flour', 'sugar', 'oil', 'pasta', 'rice'],
  'Spices': ['salt', 'pepper', 'herbs', 'spices'],
  'Other': []
};

// moduri de sortare disponibile
const SORT_MODES = [
  { key: 'recipe', icon: cookBookIcon, label: 'recipe' },
  { key: 'time', icon: clockIcon, label: 'time added' },
  { key: 'alpha', icon: alphaIcon, label: 'alphabetical' },
];

// asigura ca tipul de masurare e valid
const safeMeasurementType = (type: any) =>
  type === 'weight' || type === 'other' ? type : 'weight';

// componenta pentru butonul de stergere
const DeleteButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity
    style={{ marginLeft: 8 }}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons name="close" size={22} color={Colors.error} />
  </TouchableOpacity>
);

export default function ShoppingListScreen() {
  const router = useRouter();
  // state pentru lista, filtrare, cautare, modale, sortare, cantitati pantry
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ShoppingItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [measurementType, setMeasurementType] = useState<'weight' | 'volume' | 'pieces' | 'other'>('weight');
  const [sortModeIdx, setSortModeIdx] = useState(1); // default la 'time'
  const [lastSortModeIdx, setLastSortModeIdx] = useState(1); // default la 'recipe'
  const sortMode = SORT_MODES[sortModeIdx] || SORT_MODES[1]; // fallback pentru a evita undefined
  const [pantryQuantities, setPantryQuantities] = useState<{ [key: string]: string }>({});

  // listener realtime pentru lista de cumparaturi
  useFocusEffect(
    useCallback(() => {
      let unsubscribe: (() => void) | undefined;
      
      const initializeData = async () => {
        try {
          const cleanup = await loadShoppingList();
          unsubscribe = cleanup;
        } catch (error) {
          console.error('Error initializing shopping list:', error);
        }
      };

      initializeData();

      // cleanup la demontare
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }, [])
  );

  // filtrare si sortare lista
  useEffect(() => {
    let filtered = items;
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      // prioritizam itemele care incep cu textul cautat
      const startsWith = items.filter(item => 
        (item.name || '').toLowerCase().startsWith(lowerSearch)
      );
      const contains = items.filter(item =>
        !(item.name || '').toLowerCase().startsWith(lowerSearch) &&
        (item.name || '').toLowerCase().includes(lowerSearch)
      );
      startsWith.sort((a, b) => a.name.localeCompare(b.name));
      contains.sort((a, b) => a.name.localeCompare(b.name));
      filtered = [...startsWith, ...contains];
    }

    // aplica sortarea doar daca nu cautam
    if (!searchText) {
      const currentSortMode = sortMode?.key || 'time';  // default la time, gen cele mai recente
      if (currentSortMode === 'alpha') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else if (currentSortMode === 'recipe') {
        // se grupeaza dupa numele retetei
        filtered.sort((a, b) => {
          const recipeA = a.recipeName || 'Other';
          const recipeB = b.recipeName || 'Other';
          return recipeA.localeCompare(recipeB);
        });
      }
    }

    setFilteredItems(filtered);
  }, [searchText, items, sortMode?.key]);

  // schimbare automata la sortare alfabetica cand se cauta
  useEffect(() => {
    if (searchText && sortMode.key !== 'alpha') {
      setLastSortModeIdx(sortModeIdx);
      setSortModeIdx(3); // 3 era optiunea de alfabetic
    } else if (!searchText && sortMode.key === 'alpha') {
      setSortModeIdx(lastSortModeIdx);
    }
  }, [searchText]);

  // incarca lista de cumparaturi din firebase
  const loadShoppingList = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to view shopping list');
      return;
    }

    try {
      const userShoppingListRef = doc(db, 'users', user.uid, 'shoppingList', 'items');
      
      // listener realtime pentru lista de cumparaturi
      const unsubscribe = onSnapshot(userShoppingListRef, (shoppingListDoc) => {
        try {
      if (shoppingListDoc.exists()) {
        const data = shoppingListDoc.data();
        // datele sunt indexate dupa cheie compusa
        const items = Object.values(data);
        setItems(items);
        setFilteredItems(items);
      } else {
        setItems([]);
        setFilteredItems([]);
      }
    } catch (error) {
          console.error('Error processing shopping list:', error);
          Alert.alert('Error', 'Failed to load shopping list');
        }
      }, (error) => {
        console.error('Error listening to shopping list:', error);
        Alert.alert('Error', 'Failed to load shopping list');
      });

      // cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up shopping list listener:', error);
      Alert.alert('Error', 'Failed to load shopping list');
    }
  };

  // salveaza lista de cumparaturi in firebase
  const saveShoppingList = async (updatedItems: ShoppingItem[]) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save shopping list');
      return;
    }

    try {
      const userShoppingListRef = doc(db, 'users', user.uid, 'shoppingList', 'items');
      // se foloseste cheia compusa pentru fiecare item
      const itemsObject = updatedItems.reduce((acc, item) => {
        acc[getItemKey(item)] = item;
        return acc;
      }, {} as Record<string, ShoppingItem>);
      await setDoc(userShoppingListRef, itemsObject);
    } catch (error) {
      console.error('Error saving shopping list:', error);
      Alert.alert('Error', 'Failed to save shopping list');
    }
  };

  // determina categoria unui ingredient pe baza cuvintelor cheie
  const getCategory = (itemName: string): string => {
    const lowerName = (itemName || '').toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }
    return 'Other';
  };

  // schimba starea de bifat pentru un item din lista
  const toggleItem = async (item: ShoppingItem) => {
    try {
      // daca itemul e deja bifat, se afiseaza dialogul de confirmare pt stergere
      if (item.checked) {
        Alert.alert(
          'Delete Item',
          `Delete ${item.name} from your shopping list?`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                const updatedList = items.filter(listItem => listItem.name !== item.name);
                await saveShoppingList(updatedList);
                setItems(updatedList);
              }
            }
          ]
        );
        return;
      }

      // caz special daca cantitatea e to taste, se schimba starea de bifat si se adauga in pantry
      const lowerTrimmedQuantity = item.quantity ? item.quantity.trim().toLowerCase() : '';
      if (lowerTrimmedQuantity === 'to taste' || lowerTrimmedQuantity === 'to') {
        Alert.alert(
          'Mark as Bought',
          `Do you want to mark '${item.name}' as bought? This will add it to your pantry as 'to taste'.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Mark as Bought',
              onPress: async () => {
                const updatedList = items.map(listItem =>
                  listItem.name === item.name ? { ...listItem, checked: !listItem.checked } : listItem
                );
                await saveShoppingList(updatedList);
                setItems(updatedList);
                // se adauga in pantry daca se bifeaza ca cumparat
                if (!item.checked) {
                  const user = auth.currentUser;
                  if (user) {
                    const userPantryRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
                    const pantryDoc = await getDoc(userPantryRef);
                    const currentPantry = pantryDoc.exists() ? pantryDoc.data() : {};
                    const pantryKey = (item.name || '').toLowerCase();
                    currentPantry[pantryKey] = {
                      quantity: 'to taste',
                      measurementType: 'other'
                    };
                    await setDoc(userPantryRef, currentPantry);
                  }
                }
              }
            }
          ]
        );
        return;
      }

      const updatedList = items.map(listItem => {
        if (listItem.name === item.name) {
          const newChecked = !listItem.checked;

          if (newChecked) {
            setSelectedItem(item);
            setQuantityInput(item.quantity.match(/\d+(?:\.\d+)?/)?.[0] || '');
            setMeasurementType(safeMeasurementType(item.measurementType));
            setQuantityModalVisible(true);
            return listItem;
          }

          return { ...listItem, checked: newChecked };
        }
        return listItem;
      });

      await saveShoppingList(updatedList);
      setItems(updatedList);
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  // determina unitatea implicita pentru un ingredient pe baza numelui
  const getIngredientUnit = (ingredientName: string): string => {
    const name = ingredientName.toLowerCase();
    if (name.includes('water') || name.includes('milk') || name.includes('juice') ||
        name.includes('oil') || name.includes('vinegar') || name.includes('sauce')) {
      return 'ml';
    }
    if (name.includes('sugar') || name.includes('flour') || name.includes('salt') ||
        name.includes('pepper') || name.includes('spice') || name.includes('powder')) {
      return 'g';
    }
    // se adauga iteme de brutarie si alte iteme pe bucati
    if (name.includes('egg') || name.includes('apple') || name.includes('banana') ||
        name.includes('orange') || name.includes('tomato') || name.includes('potato') ||
        name.includes('onion') || name.includes('bread') || name.includes('bun') ||
        name.includes('roll') || name.includes('bagel')) { // adaugat bread, bun, roll, bagel
      return 'pcs';
    }
    return 'g'; // default la grame
  };

  // proceseaza cantitatea cumparata si o adauga in pantry
  const handleQuantitySubmit = async () => {
    if (!selectedItem) return;
    try {
      const requiredQuantity = parseFloat(selectedItem.quantity);
      const boughtQuantity = parseFloat(quantityInput);
      // folosim unitatea din itemul din lista de cumparaturi (din reteta)
      const unit = selectedItem.quantity.match(/[a-zA-Z]+/)?.[0] || '';
      const measurementType = unit === 'ml' ? 'volume' : unit === 'pcs' ? 'pieces' : 'weight';

      if (isNaN(boughtQuantity) || boughtQuantity <= 0) {
        Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
        return;
      }

      const user = auth.currentUser;
      if (!user) return;

      const userPantryRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      const pantryDoc = await getDoc(userPantryRef);
      let currentPantry = pantryDoc.exists() ? pantryDoc.data() : {};
      const pantryKey = (selectedItem.name || '').toLowerCase();

      let pantryQuantity = 0;
      // parsare sigura a cantitatii existente din pantry
      if (currentPantry[pantryKey] && currentPantry[pantryKey].quantity) {
        const match = String(currentPantry[pantryKey].quantity).match(/(\d+(?:\.\d+)?)/);
        pantryQuantity = match ? parseFloat(match[1]) : 0;
      }

      const newPantryQuantity = pantryQuantity + boughtQuantity;

      currentPantry[pantryKey] = {
        quantity: `${newPantryQuantity}${unit}`,
        measurementType: measurementType
      };
      await setDoc(userPantryRef, currentPantry);

      // se determina daca itemul din lista de cumparaturi ar trebui bifat
      const shouldBeChecked = newPantryQuantity >= requiredQuantity;

      // se actualizeaza statusul de bifat al itemului din lista de cumparaturi
      const updatedList = items.map(listItem => {
        if (listItem.name === selectedItem.name) {
          // foloseste statusul shouldBeChecked bazat pe cantitatea acumulata din pantry
          return { ...listItem, checked: shouldBeChecked };
        }
        return listItem;
      });

      await saveShoppingList(updatedList);
      setItems(updatedList);
      // setFilteredItems trebuie actualizat si el daca e necesar
      setFilteredItems(updatedList.filter(i => ((i.name || '').toLowerCase().includes((searchText || '').toLowerCase()))));

      setQuantityModalVisible(false);
      setSelectedItem(null);
      setQuantityInput('');

      Alert.alert('Success', `Added ${boughtQuantity}${unit} to your pantry. ${shouldBeChecked ? 'Shopping list item checked.' : ''}`);

    } catch (error) {
      console.error('Error updating item and pantry:', error);
      Alert.alert('Error', 'Failed to update item and pantry');
    }
  };

  const addToPantry = async (item: ShoppingItem) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add items to pantry');
      return;
    }

    try {
      // se preiau itemele curente din pantry
      const userPantryRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      const pantryDoc = await getDoc(userPantryRef);
      const currentPantry = pantryDoc.exists() ? pantryDoc.data() : {};
      
      // se foloseste doar numele ingredientului ca cheie pentru pantry
      const pantryKey = (item.name || '').toLowerCase();
      let normalizedQuantity = normalizeQuantity(item.quantity, item.name);
      // se elimina 'g' sau 'ml' duplicate daca sunt prezente
      normalizedQuantity = normalizedQuantity.replace(/(g|ml)\s*\1/, '$1');
      
      // adauga itemul in pantry daca nu e deja acolo
      if (!currentPantry[pantryKey]) {
        currentPantry[pantryKey] = {
          quantity: normalizedQuantity,
          measurementType: item.measurementType
        };
        await setDoc(userPantryRef, currentPantry);
        Alert.alert(
          'Added to Pantry',
          `${item.name} has been added to your pantry with quantity: ${normalizedQuantity}`
        );
      }
    } catch (error) {
      console.error('Error adding to pantry:', error);
      Alert.alert('Error', 'Failed to add item to pantry');
    }
  };

  const removeItem = async (item: ShoppingItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${item.name} from your shopping list?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedItems = items.filter(i => {
                // compara doar numele pentru stergere
                return i.name.toLowerCase() !== item.name.toLowerCase();
              });
              
              // actualizeaza state-ul
              setItems(updatedItems);
              setFilteredItems(
                updatedItems.filter(i =>
                  ((i.name || '').toLowerCase().includes((searchText || '').toLowerCase()))
                )
              );

              // actualizeaza firestore in background
              const user = auth.currentUser;
              if (!user) {
                throw new Error('User not logged in');
              }

              const userShoppingListRef = doc(db, 'users', user.uid, 'shoppingList', 'items');
              // creeaza un obiect cu itemele actualizate
              const itemsObject = updatedItems.reduce((acc, item) => {
                acc[getItemKey(item)] = item;
                return acc;
              }, {} as Record<string, ShoppingItem>);

              await setDoc(userShoppingListRef, itemsObject);
            } catch (error) {
              console.error('Error removing item:', error);
              // daca actualizarea firestore esueaza
              loadShoppingList();
              Alert.alert('Error', 'Failed to remove item from shopping list');
            }
          }
        }
      ]
    );
  };

  const clearList = async () => {
    Alert.alert(
      'Clear Shopping List',
      'Are you sure you want to clear the entire shopping list?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) return;

              const userShoppingListRef = doc(db, 'users', user.uid, 'shoppingList', 'items');
              await setDoc(userShoppingListRef, {});
              setItems([]);
              setFilteredItems([]);
            } catch (error) {
              console.error('Error clearing list:', error);
              Alert.alert('Error', 'Failed to clear shopping list');
            }
          },
        },
      ]
    );
  };

  const renderCategory = ({ item: category }: { item: string }) => {
    const categoryItems = filteredItems.filter(item => item.category === category);
    if (categoryItems.length === 0) return null;

    return (
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>{category}</Text>
        {categoryItems.map((item, index) => (
          <View key={item.name.trim().toLowerCase() + '-' + index} style={[
            styles.itemContainer,
            item.checked && styles.checkedItemContainer
          ]}>
            <TouchableOpacity
              style={[styles.checkbox, { borderColor: item.checked ? Colors.primary : Colors.error }]}
              onPress={() => toggleItem(item)}
            >
              <Text style={styles.checkboxText}>{item.checked ? '✓' : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.itemDetails}
              onPress={() => toggleItem(item)}
            >
              <Text style={[
                styles.itemName,
                item.checked && styles.checkedItem
              ]}>
                {highlightMatch(item.name.toLowerCase(), searchText)}
                {item.quantity && item.quantity !== 'to taste' && (
                  <Text
                    style={[
                      styles.quantityText,
                      item.checked && { color: Colors.owned },
                      (isNaN(parseFloat(item.quantity)) || !item.quantity.trim()) && { color: Colors.owned }
                    ]}
                  >
                    {' '}
                    {(isNaN(parseFloat(item.quantity)) || !item.quantity.trim())
                      ? 'to taste'
                      : (() => {
                          const parseNum = (q: string | undefined) => {
                            if (!q) return 0;
                            const match = q.match(/(\d+(?:\.\d+)?)/);
                            return match ? parseFloat(match[1]) : 0;
                          };
                          const getUnit = (q: string | undefined) => {
                            if (!q) return '';
                            const match = q.match(/[a-zA-Z]+/);
                            return match ? match[0] : '';
                          };
                          const total = parseNum(item.quantity);
                          const pantry = parseNum(pantryQuantities[(item.name || '').toLowerCase()]);
                          const unit = getUnit(item.quantity) || '';
                          let remaining = total - pantry;
                          if (remaining < 0) remaining = 0;
                          if (pantry && pantry >= total) {
                            return (
                              <>
                                <Text style={{ color: Colors.owned }}>{`0${unit}`}</Text>
                                <Text style={{ color: Colors.border }}>{`/${total}${unit}`}</Text>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <Text style={{ color: Colors.owned }}>{`${remaining}${unit}`}</Text>
                                <Text style={{ color: Colors.border }}>{`/${total}${unit}`}</Text>
                              </>
                            );
                          }
                        })()
                    }
                  </Text>
                )}
                {item.recipeName && sortMode.key !== 'recipe' && sortMode.key !== 'alpha' && (
                  <Text style={styles.recipeText}>  ({item.recipeName})</Text>
                )}
              </Text>
            </TouchableOpacity>
            <DeleteButton onPress={() => removeItem(item)} />
          </View>
        ))}
      </View>
    );
  };

  const categories = Object.keys(CATEGORIES);

  useEffect(() => {
    // fost log de debug
  }, [items]);

  const handleSortPress = () => {
    setSortModeIdx((prev) => (prev + 1) % SORT_MODES.length);
  };

  // helper pentru a insuma cantitatile pentru acelasi ingredient, aceeasi unitate
  const sumQuantities = (items: ShoppingItem[]): ShoppingItem[] => {
    const grouped: { [key: string]: ShoppingItem } = {};
    items.forEach(item => {
      const key = (item.name || '').toLowerCase();
      const existing = grouped[key];
      const parseQuantity = (q: string | undefined | null) => {
        if (!q || typeof q !== 'string') return 0;
        const match = q.match(/(\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
      };
      const getUnit = (q: string | undefined | null) => {
        if (!q || typeof q !== 'string') return '';
        const match = q.match(/[a-zA-Z]+/);
        return match ? match[0] : '';
      };
      if (existing) {
        // suma doar daca unitatile se potrivesc
        const unit = getUnit(existing.quantity || '');
        const thisUnit = getUnit(item.quantity || '');
        if (unit === thisUnit) {
          const total = parseQuantity(existing.quantity || '') + parseQuantity(item.quantity || '');
          grouped[key] = {
            ...existing,
            quantity: `${total}${unit}`,
            recipeName: undefined, // eliminam recipeName pentru vizualizarea totala
          };
        } else {
          // daca unitatile nu se potrivesc, pastram ambele (ar putea fi imbunatatit)
          // pentru moment, doar le concatenam ca string
          grouped[key] = {
            ...existing,
            quantity: `${existing.quantity} + ${item.quantity}`,
            recipeName: undefined,
          };
        }
      } else {
        grouped[key] = { ...item, recipeName: undefined };
      }
    });
    return Object.values(grouped);
  };

  const getSortedItems = () => {
    if (sortMode.key === 'recipe') {
      // grupam dupa nume alfabetic si ingredientele alfabetic
      const recipeMap: { [key: string]: ShoppingItem[] } = {};
      filteredItems.forEach(item => {
        const key = item.recipeName || 'Other';
        if (!recipeMap[key]) recipeMap[key] = [];
        recipeMap[key].push(item);
      });
      const sortedRecipeNames = Object.keys(recipeMap).sort();
      let sorted: ShoppingItem[] = [];
      sortedRecipeNames.forEach(recipe => {
        const items = recipeMap[recipe].sort((a, b) => a.name.localeCompare(b.name));
        sorted.push(...items);
      });
      return sorted;
    } else if (sortMode.key === 'alpha') {
      // sortare alfabetica dupa nume
      return [...filteredItems].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // pentru cronologic insumam cantitatile pentru fiecare ingredient
      return sumQuantities(filteredItems);
    }
  };

  const sortedItems = getSortedItems();

  // pentru gruparea pe categorii si retete, avem nevoie de headers de grup
  const renderList = () => {
    if (sortMode.key === 'recipe') {
      // grupeaza dupa recipeName
      const recipeNames = Array.from(new Set(sortedItems.map(i => i.recipeName || 'Other'))).sort();
      // urmareste prima aparitie a fiecarui ingredient
      const shownPantryFor: { [key: string]: boolean } = {};
      return (
        <FlatList
          data={recipeNames}
          renderItem={({ item: recipe }) => {
            const recipeItems = sortedItems.filter(i => (i.recipeName || 'Other') === recipe);
            if (recipeItems.length === 0) return null;
            return (
              <View style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>{recipe}</Text>
                {recipeItems.map((item, index) => {
                  const lowerName = (item.name || '').toLowerCase();
                  let showPantry = false;
                  if (!shownPantryFor[lowerName]) {
                    shownPantryFor[lowerName] = true;
                    const pantryQ = pantryQuantities[lowerName];
                    if (pantryQ && parseFloat(pantryQ) > 0) {
                      showPantry = true;
                    }
                  }
                  return (
                    <View key={item.name.trim().toLowerCase() + '-' + index} style={[
                      styles.itemContainer,
                      item.checked && styles.checkedItemContainer
                    ]}>
                      <TouchableOpacity
                        style={[styles.checkbox, { borderColor: item.checked ? Colors.primary : Colors.error }]}
                        onPress={() => toggleItem(item)}
                      >
                        <Text style={styles.checkboxText}>{item.checked ? '✓' : ''}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.itemDetails}
                        onPress={() => toggleItem(item)}
                      >
                        <Text style={[
                          styles.itemName,
                          item.checked && styles.checkedItem
                        ]}>
                          {highlightMatch(item.name.toLowerCase(), searchText)}
                          {/* afisare cantitate pantry/necesara */}
                          {(() => {
                            const parseNum = (q: string | undefined | null) => {
                              if (!q) return 0;
                              if (typeof q !== 'string') return 0;
                              const match = q.match(/(\d+(?:\.\d+)?)/);
                              return match ? parseFloat(match[1]) : 0;
                            };
                            const getUnit = (q: string | undefined | null) => {
                              if (!q) return '';
                              if (typeof q !== 'string') return '';
                              const match = q.match(/[a-zA-Z]+/);
                              return match ? match[0] : '';
                            };
                            const required = parseNum(item.quantity);
                            const pantry = parseNum(pantryQuantities[(item.name || '').toLowerCase()]);
                            const unit = getUnit(item.quantity) || '';
                            const roundedPantry = Math.round(pantry * 100) / 100;
                            const roundedRequired = Math.round(required * 100) / 100;
                            if (item.quantity && (item.quantity.trim().toLowerCase() === 'to taste' || item.quantity.trim().toLowerCase() === 'to')) {
                              return <Text style={[styles.quantityText, { minWidth: 60, flexShrink: 1 }, item.checked && { color: Colors.owned }]}>{' '}to taste</Text>;
                            }
                            return <Text style={[styles.quantityText, pantry >= required ? { color: Colors.owned } : { color: Colors.error }]}>{` ${roundedPantry}${unit}/`}</Text>;
                          })()}
                          {/* afisare cantitate necesara */}
                          {item.quantity && !(item.quantity.trim().toLowerCase() === 'to taste' || item.quantity.trim().toLowerCase() === 'to') ? (
                            <Text style={[styles.quantityText, item.checked && { color: Colors.owned }]}>{`${Math.round((() => {const match = (item.quantity || '').match(/(\d+(?:\.\d+)?)/);return match ? parseFloat(match[1]) : 0;})() * 100) / 100}${(() => {const match = (item.quantity || '').match(/[a-zA-Z]+/);return match ? match[0] : ''})()}`}</Text>
                          ) : null}
                          {item.recipeName && sortMode.key !== 'recipe' && sortMode.key !== 'alpha' && (
                            <Text style={styles.recipeText}>  ({item.recipeName})</Text>
                          )}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            );
          }}
          keyExtractor={item => item}
          contentContainerStyle={styles.listContainer}
        />
      );
    } else {
      // Time Added sau Alphabetical are lista plana
      return (
        <FlatList
          data={sortedItems}
          renderItem={({ item, index }) => (
            <View key={item.name.trim().toLowerCase() + '-' + index} style={[
              styles.itemContainer,
              item.checked && styles.checkedItemContainer
            ]}>
              <TouchableOpacity
                style={[styles.checkbox, { borderColor: item.checked ? Colors.primary : Colors.error }]}
                onPress={() => toggleItem(item)}
              >
                <Text style={styles.checkboxText}>{item.checked ? '✓' : ''}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.itemDetails}
                onPress={() => toggleItem(item)}
              >
                <Text style={[
                  styles.itemName,
                  item.checked && styles.checkedItem
                ]}>
                  {highlightMatch(item.name.toLowerCase(), searchText)}
                  {item.quantity && (item.quantity.trim().toLowerCase() === 'to taste' || item.quantity.trim().toLowerCase() === 'to') ? (
                    <Text style={[styles.quantityText, { minWidth: 60, flexShrink: 1 }, item.checked && { color: Colors.owned }]}>{' '}to taste</Text>
                  ) : item.quantity ? (
                    <Text style={[
                      styles.quantityText, 
                      { minWidth: 60, flexShrink: 1 }, 
                      item.checked && { color: Colors.owned },
                      (() => {
                      const parseNum = (q: string | undefined | null) => {
                        if (!q) return 0;
                        if (typeof q !== 'string') return 0;
                        const match = q.match(/(\d+(?:.\d+)?)/);
                        return match ? parseFloat(match[1]) : 0;
                      };
                      const required = parseNum(item.quantity);
                      const pantry = parseNum(pantryQuantities[(item.name || '').toLowerCase()]);
                      return pantry >= required ? { color: Colors.owned } : { color: Colors.error };
                      })()
                    ]}>
                      {' '}{(() => {
                        const parseNum = (q: string | undefined | null) => {
                          if (!q) return 0;
                          if (typeof q !== 'string') return 0;
                          const match = q.match(/(\d+(?:\.\d+)?)/);
                          return match ? parseFloat(match[1]) : 0;
                        };
                        const getUnit = (q: string | undefined | null) => {
                          if (!q) return '';
                          if (typeof q !== 'string') return '';
                          const match = q.match(/[a-zA-Z]+/);
                          return match ? match[0] : '';
                        };
                        const required = parseNum(item.quantity);
                        const pantry = parseNum(pantryQuantities[(item.name || '').toLowerCase()]);
                        const unit = getUnit(item.quantity) || '';
                        const roundedPantry = Math.round(pantry * 100) / 100;
                        const roundedRequired = Math.round(required * 100) / 100;
                        return `${roundedPantry}${unit}/${roundedRequired}${unit}`;
                      })()}
                    </Text>
                  ) : null}
                  {item.recipeName && sortMode.key !== 'recipe' && sortMode.key !== 'alpha' && (
                    <Text style={styles.recipeText}>  ({item.recipeName})</Text>
                  )}
                </Text>
              </TouchableOpacity>
              <DeleteButton onPress={() => removeItem(item)} />
            </View>
          )}
          keyExtractor={(item, idx) => item.name.trim().toLowerCase() + '-' + idx}
          contentContainerStyle={styles.listContainer}
        />
      );
    }
  };

  // helper pentru a evidenția textul de cautare in numele ingredientelor
  const highlightMatch = (name: string, search: string) => {
    if (!search) return <Text>{name}</Text>;
    const lowerName = (name || '').toLowerCase();
    const lowerSearch = (search || '').toLowerCase();
    const matchIndex = lowerName.indexOf(lowerSearch);
    if (matchIndex === -1) return <Text>{name}</Text>;
    return (
      <Text>
        {name.substring(0, matchIndex)}
        <Text style={{ fontWeight: 'bold', color: Colors.primaryDark }}>{name.substring(matchIndex, matchIndex + search.length)}</Text>
        {name.substring(matchIndex + search.length)}
      </Text>
    );
  };

  const addItem = async (newItem: ShoppingItem) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add items');
      return;
    }

    try {
      // se adauga categoria la itemul nou
      const itemWithCategory = {
        ...newItem,
        category: getCategory(newItem.name)
      };

      // obtine lista de cumparaturi curenta
      const userShoppingListRef = doc(db, 'users', user.uid, 'shoppingList', 'items');
      const shoppingListDoc = await getDoc(userShoppingListRef);
      const currentItems = shoppingListDoc.exists() ? shoppingListDoc.data() : {};

      // adauga itemul nou cu cheia compusa
      currentItems[getItemKey(itemWithCategory)] = itemWithCategory;

      // salveaza lista actualizata
      await setDoc(userShoppingListRef, currentItems);

      // actualizeaza state-ul local
      const updatedItems = Object.values(currentItems);
      setItems(updatedItems);
      setFilteredItems(updatedItems);
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item to shopping list');
    }
  };

  // helper pentru a crea o cheie unica pentru fiecare pereche ingredient-reteta
  const getItemKey = (item: ShoppingItem) => {
    if (!item.name) return '';
    const key = item.recipeName 
      ? `${item.name.toLowerCase()}__${item.recipeName}` 
      : item.name.toLowerCase();
    return key;
  };

  // incarca cantitatile din pantry
  useEffect(() => {
      const user = auth.currentUser;
      if (!user) return;
        const userPantryRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
    const unsubscribe = onSnapshot(userPantryRef, (pantryDoc) => {
        if (pantryDoc.exists()) {
          const data = pantryDoc.data();
          const quantities: { [key: string]: string } = {};
          Object.keys(data).forEach(key => {
            quantities[key] = data[key]?.quantity || '';
          });
          setPantryQuantities(quantities);
        } else {
          setPantryQuantities({});
        }
    });
    return () => unsubscribe();
  }, []);

  const renderSearchBar = () => (
    <View>
      <View style={commonStyles.searchContainer}>
        <View style={commonStyles.searchBarContainer}>
          <Image source={require('../../assets/images/search-ok.png')} style={commonStyles.searchIcon} />
          <TextInput
            style={commonStyles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={Colors.border}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity
          style={commonStyles.sortButton}
          onPress={handleSortPress}
        >
          <Image source={sortMode.icon} style={commonStyles.sortIconZoomed} />
        </TouchableOpacity>
      </View>
      <View style={styles.sortingInfoContainer}>
        <Text style={styles.sortingInfoText}>
          Sorting by: {sortMode.label}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        <View style={styles.content}>
          <Text style={styles.title}>Shopping List ({items.length})</Text>
          {renderSearchBar()}
          {renderList()}
        </View>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />

      <Modal
        visible={quantityModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setQuantityModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              What quantity did you buy? Add {selectedItem?.name ? selectedItem.name.toLowerCase() : ''} to your pantry
            </Text>
            
            <View style={styles.quantityInputContainer}>
              <TextInput
                style={[styles.quantityInput, { flex: 1 }]}
                placeholder="Enter quantity"
                value={quantityInput}
                onChangeText={text => {
                  // permite doar numere si un singur punct zecimal
                  let cleaned = text.replace(/[^\d.]/g, '');
                  // previne mai mult de un punct zecimal
                  const parts = cleaned.split('.');
                  if (parts.length > 2) {
                    cleaned = parts[0] + '.' + parts.slice(1).join('');
                  }
                  setQuantityInput(cleaned);
                }}
                keyboardType="numeric"
              />
              <Text style={styles.unitText}>
                {selectedItem ? (selectedItem.quantity.match(/[a-zA-Z]+/)?.[0] || '') : ''}
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setQuantityModalVisible(false);
                  setSelectedItem(null);
                  setQuantityInput('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleQuantitySubmit}
              >
                <Text style={[styles.buttonText, styles.confirmButtonText]}>
                  Add to Pantry
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

