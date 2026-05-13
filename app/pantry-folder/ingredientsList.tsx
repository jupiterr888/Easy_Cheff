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
import { auth, db } from '../../backend/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DietaryPreferences, checkDietaryConflicts, loadDietaryPreferencesRealtime } from '../../utils/dietaryPreferences';
import { normalizeQuantity } from '../../utils/normalizeQuantity';
import Colors from '../../constants/Colors';
import { styles } from './styles/ingredientList.styles'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import filterIcon from '../../assets/images/filter-ok.png';
import alphaIcon from '../../assets/images/alpha-ok.png';
import zetaIcon from '../../assets/images/zeta-ok.png';

interface Ingredient {
  id: string;
  name: string;
  selected: boolean;
  quantity: string;
  measurementType: 'weight' | 'volume' | 'pieces' | 'other';
}

const SORT_ICONS = {
  default: filterIcon,
  asc: alphaIcon,
  desc: zetaIcon,
};

export default function IngredientsListScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [loading, setLoading] = useState(true);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [quantityInput, setQuantityInput] = useState('');
  const [measurementType, setMeasurementType] = useState<'weight' | 'volume' | 'pieces' | 'other'>('weight');
  const [pantryIngredients, setPantryIngredients] = useState<string[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreferences | null>(null);
  const router = useRouter();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('other');

  // se incarca datele principale din api si camara
  useFocusEffect(
    useCallback(() => {
      let unsubscribeDietary: (() => void) | undefined;
      
      const initializeData = async () => {
      fetchIngredients();
      loadPantryIngredients();
        
        // listener realtime pentru preferinte alimentare
        const dietaryCleanup = await loadDietaryPreferencesRealtime((prefs) => {
          setDietaryPreferences(prefs);
        });
        unsubscribeDietary = dietaryCleanup;
      };
      
      initializeData();
      
      // cleanup la demontare
      return () => {
        if (unsubscribeDietary) {
          unsubscribeDietary();
        }
      };
    }, [])
  );

  useEffect(() => {
    let filtered = [...ingredients];  // se copiaza lista de ingrediente, se lucreaza pe ea
    
    // se filtreaza dupa text cautat
    if (searchText) {
      filtered = filtered.filter(ingredient =>
      ingredient.name.toLowerCase().includes(searchText.toLowerCase())
    );
    
      // se prioriteaza itemele care incep cu textul cautat
      const lowerSearch = searchText.toLowerCase();
      const startsWith = filtered.filter(item => 
        item.name.toLowerCase().startsWith(lowerSearch)
      );
      const contains = filtered.filter(item => 
        !item.name.toLowerCase().startsWith(lowerSearch) && 
        item.name.toLowerCase().includes(lowerSearch)
      );
      
      // se sorteaza alfabetic fiecare grup
      startsWith.sort((a, b) => a.name.localeCompare(b.name));
      contains.sort((a, b) => a.name.localeCompare(b.name));
      
      filtered = [...startsWith, ...contains];
    } else {
      // se sorteaza dupa optiunea selectata
      switch (sortOrder) {
        case 'asc':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'desc':
      filtered.sort((a, b) => b.name.localeCompare(a.name));
          break;
        // default nu se sorteaza
      }
    }
    
    setFilteredIngredients(filtered);
  }, [searchText, ingredients, sortOrder]);

  // se incarca lista de ingrediente din api si pantry
  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?i=list');
      const data = await response.json();
      
      if (data.meals) {
        const user = auth.currentUser;
        if (!user) {
          // fara cont
          const ingredientsList = data.meals.map((item: any) => ({
            id: item.idIngredient,
            name: item.strIngredient,
            selected: false,
            quantity: '',
            measurementType: 'weight'
          }));
          setIngredients(ingredientsList);
          setFilteredIngredients(ingredientsList);
          setLoading(false);
          return;
        }

        const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
        const ingredientsDoc = await getDoc(userIngredientsRef);
        const pantryData = ingredientsDoc.exists() ? ingredientsDoc.data() : {};
        
        // se construieste lista completa cu status din pantry
        const ingredientsList = data.meals.map((item: any) => {
          const lowerName = item.strIngredient.toLowerCase();
          const pantryItem = pantryData[lowerName];
          
          return {
          id: item.idIngredient,
          name: item.strIngredient,
            selected: pantryItem !== undefined,
            quantity: pantryItem?.quantity || '',
            measurementType: pantryItem?.measurementType || 'weight'
          };
        });
        
        // se actualizeaza listele
        setIngredients(ingredientsList);
        setFilteredIngredients(ingredientsList);
        setPantryIngredients(Object.keys(pantryData));
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      Alert.alert('Error', 'Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  };

  // se incarca ingredientele din pantry 
  const loadPantryIngredients = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      const ingredientsDoc = await getDoc(userIngredientsRef);
      if (ingredientsDoc.exists()) {
        const data = ingredientsDoc.data();
        setPantryIngredients(Object.keys(data));
      } else {
        setPantryIngredients([]);
      }
    } catch (error) {
      console.error('Error loading pantry ingredients:', error);
    }
  };

  // deschide modal pentru cantitate
  const openQuantityModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setQuantityInput(ingredient.quantity || '');
    setMeasurementType(ingredient.measurementType || 'weight');
    setQuantityModalVisible(true);
  };

  const handleQuantitySubmit = async () => {
    if (!selectedIngredient) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add ingredients');
      return;
    }

    if (!quantityInput || isNaN(Number(quantityInput)) || Number(quantityInput) <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid quantity greater than 0.');
      return;
    }

    try {
      const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      const ingredientsDoc = await getDoc(userIngredientsRef);
      const currentData = ingredientsDoc.exists() ? ingredientsDoc.data() : {};
      
      // se adauga la cantitatea existenta sau se seteaza daca nu e deja
      const prevQuantity = currentData[selectedIngredient.name.toLowerCase()]?.quantity || '0';
      const addedQuantity = parseFloat(quantityInput || '0');
      const totalQuantity = (parseFloat(prevQuantity) + addedQuantity).toString();
      const unit = getIngredientUnit(selectedIngredient.name);
      
      // se actualizeaza ingredientul in pantry cu cantitatea noua
      await setDoc(userIngredientsRef, {
        ...currentData,
        [selectedIngredient.name.toLowerCase()]: {
          quantity: totalQuantity + unit,
          measurementType: measurementType
        }
      }, { merge: true });

      setQuantityModalVisible(false);
      setSelectedIngredient(null);
      setQuantityInput('');
      setMeasurementType('weight');

      // se actualizeaza pantry in realtime
      loadPantryIngredients();
      // se actualizeaza lista de ingrediente pentru a afisa cantitatile in realtime
      fetchIngredients();

      Alert.alert(
        'Ingredient Added',
        `You added ${addedQuantity}${unit} of ${selectedIngredient.name} to your pantry.\nYou now have ${totalQuantity}${unit} in your pantry.`
      );
    } catch (error) {
      console.error('Error updating ingredients:', error);
      Alert.alert('Error', 'Failed to update ingredients');
    }
  };

  // determina categoria unui ingredient pe baza cuvintelor cheie
  const getCategory = (itemName: string): string => {
    const lowerName = itemName.toLowerCase();
    const categories = {
      'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
      'Meat': ['beef', 'chicken', 'pork', 'lamb', 'fish'],
      'Produce': ['apple', 'banana', 'carrot', 'lettuce', 'tomato'],
      'Bakery': ['bread', 'bun', 'roll', 'pastry'],
      'Pantry': ['flour', 'sugar', 'oil', 'pasta', 'rice'],
      'Spices': ['salt', 'pepper', 'herbs', 'spices'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category;
      }
    }
    return 'Other';
  };

  // afiseaza cantitatea cu unitatea potrivita
  const getQuantityDisplay = (item: Ingredient) => {
    if (!item.quantity) return '';
    if (item.measurementType === 'other') {
      return `  ${item.quantity}`;
    }
    const q = item.quantity.trim();
    if (
      q.endsWith('g') ||
      q.endsWith('ml') ||
      q.endsWith('pcs') ||
      q.toLowerCase() === 'to taste'
    ) {
      return `  ${q}`;
    }
    return `  ${q}g`;
  };

  // randare pentru fiecare ingredient din lista
  const renderItem = ({ item }: { item: Ingredient }) => {
    const inPantry = pantryIngredients.includes(item.name.toLowerCase());
    // se verifica conflicte cu preferintele alimentare
    const conflicts = dietaryPreferences ? checkDietaryConflicts(item.name, dietaryPreferences) : [];
    const hasConflicts = conflicts.length > 0;

    return (
      <TouchableOpacity
        style={[
          styles.ingredientItem,
          inPantry && styles.inPantryItem,
          hasConflicts && styles.conflictingItem
        ]}
        onPress={() => openQuantityModal(item)}
      >
        <View style={styles.ingredientInfo}>
          <Text style={[
            styles.ingredientName,
            inPantry ? styles.inPantryText : styles.notInPantryText,
            hasConflicts && styles.conflictingText
          ]}>
            {item.name.toLowerCase()}{!inPantry && ` (${getIngredientUnit(item.name)})`}
          </Text>
          {hasConflicts && (
            <View style={styles.conflictBadge}>
              <Text style={styles.conflictBadgeText}>
                {conflicts.map(c => c.replace(/([A-Z])/g, ' $1').trim()).join(', ')}
              </Text>
            </View>
          )}
        </View>
        {item.selected && item.quantity && (
          <Text style={[
            styles.quantityText,
            item.measurementType === 'weight' && styles.weightText,
            item.measurementType === 'other' && styles.otherText,
          ]}>
            {getQuantityDisplay(item)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // asigura ca tipul de masurare e valid
  const safeMeasurementType = (type: any) =>
    type === 'weight' || type === 'other' ? type : 'weight';

  // bara de cautare si sortare
  const renderSearchBar = () => (
    <View style={styles.searchAndSortContainer}>
      <View style={styles.searchBarContainer}>
        <Image 
          source={require('../../assets/images/search-ok.png')} 
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchBar}
          placeholder="Search ingredients..."
          placeholderTextColor={Colors.border}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setSortOrder(sortOrder === 'default' ? 'asc' : sortOrder === 'asc' ? 'desc' : 'default')}
      >
        <View style={styles.sortIconContainer}>
          <Image source={SORT_ICONS[sortOrder]} style={styles.sortIconZoomed} />
        </View>
      </TouchableOpacity>
    </View>
  );

  // se determina unitatea implicita pt ingredient pe baza de nume
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
    if (name.includes('egg')) {
      return 'pcs';
    }
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || 
        name.includes('tomato') || name.includes('potato') || name.includes('onion')) {
      return 'pcs';
    }
    return 'g'; // default pe grame
  };

  // handler pentru adaugare ingredient custom
  const handleAddIngredient = async () => {
    if (!newIngredient.trim()) {
      Alert.alert('Error', 'Please enter an ingredient name');
      return;
    }

    if (!newQuantity.trim()) {
      Alert.alert('Error', 'Please enter a quantity');
      return;
    }

    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    // se determina unitatea si tipul de masurare
    const unit = getIngredientUnit(newIngredient);
    const measurementType = unit === 'ml' ? 'volume' : unit === 'pcs' ? 'pieces' : 'weight';

    try {
      const newItem: Ingredient = {
        id: newIngredient.trim().toLowerCase(),
        name: newIngredient.trim(),
        selected: true,
        quantity: `${quantity}${unit}`,
        measurementType: measurementType
      };

      await addToPantry(newItem);
      setNewIngredient('');
      setNewQuantity('');
      setSelectedCategory('other');
      loadPantryItems();
    } catch (error) {
      console.error('Error adding ingredient:', error);
      Alert.alert('Error', 'Failed to add ingredient');
    }
  };

  // se adauga un ingredient in pantry (firebase)
  const addToPantry = async (item: Ingredient) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const pantryRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      await setDoc(pantryRef, {
        ...item,
        name: item.name.toLowerCase()
      });
    } catch (error) {
      console.error('Error adding to pantry:', error);
      throw error;
    }
  };

  // se reincarca ingredientele din pantry dupa adaugare
  const loadPantryItems = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const pantryRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      const ingredientsDoc = await getDoc(pantryRef);
      if (ingredientsDoc.exists()) {
        const data = ingredientsDoc.data();
        setPantryIngredients(Object.keys(data));
      } else {
        setPantryIngredients([]);
      }
    } catch (error) {
      console.error('Error loading pantry items:', error);
      Alert.alert('Error', 'Failed to load pantry items');
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <View style={styles.content}>
          <Text style={styles.title}>All Ingredients</Text>
          
          {renderSearchBar()}

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading ingredients...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredIngredients}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>

        <Modal
          visible={quantityModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Add {selectedIngredient?.name}
              </Text>
              <View style={styles.quantityInputContainer}>
                <TextInput
                  style={[styles.quantityInput, { flex: 1 }]}
                  placeholder="Edit Quantity"
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  keyboardType="numeric"
                />
                <Text style={styles.unitText}>
                  {selectedIngredient ? getIngredientUnit(selectedIngredient.name) : ''}
                </Text>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setQuantityModalVisible(false);
                    setSelectedIngredient(null);
                    setQuantityInput('');
                    setMeasurementType('weight');
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton, (!quantityInput || isNaN(Number(quantityInput)) || Number(quantityInput) <= 0) && { opacity: 0.5 }]}
                  onPress={handleQuantitySubmit}
                  disabled={!quantityInput || isNaN(Number(quantityInput)) || Number(quantityInput) <= 0}
                >
                  <Text style={[styles.buttonText, styles.confirmButtonText]}>
                    Add
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
}

