import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalizeQuantity } from '../../utils/normalizeQuantity';
import { auth, db } from '../../backend/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { DietaryPreferences, checkDietaryConflicts, loadDietaryPreferencesRealtime } from '../../utils/dietaryPreferences';
import Slider from '@react-native-community/slider';
import PlanRecipeModal from '../../components/PlanRecipeModal';
import MealPlanProvider, { useMealPlan } from '../context/MealPlanContext';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '../../constants/Styles';
import { fetchWithCache } from '../../utils/mealdb';
import { styles } from '../recipes-folder/styles/recipeMatch.styles';

// mapare pentru imagini predefinite din formular
const RECIPE_IMAGES = [
  require('../../assets/images/breakfast-ok.png'),
  require('../../assets/images/lunch-ok.png'),
  require('../../assets/images/dinner-ok.png'),
  require('../../assets/images/dessert-ok.png'),
  require('../../assets/images/meat-ok.png'),
];

interface Recipe {
  id: string;
  title: string;
  image: string;
  ingredients: Ingredient[];
  instructions: string;
  sourceUrl?: string;
  area?: string;
}

interface Ingredient {
  name: string;
  quantity: string;
  measurementType: 'weight' | 'volume' | 'pieces' | 'other';
  available?: boolean;
  checked?: boolean;
  unit: string;
}

// mapare pentru unitatile ingredientelor si cantitati implicite
const ingredientUnitMap: Record<string, { unit: string; defaultAmount: number }> = {
  potatoes: { unit: 'g', defaultAmount: 200 }, 
  onion: { unit: 'g', defaultAmount: 100 }, 
  'red pepper': { unit: 'g', defaultAmount: 150 }, 
  cheese: { unit: 'g', defaultAmount: 50 },
  butter: { unit: 'g', defaultAmount: 10 },
  
};

// normalizeaza un ingredient si cantitatea lui pt afisare si procesare
function normalizeIngredient(ingredient: string, measurement: string) {
  const normalized = normalizeQuantity(measurement, ingredient);
  if (normalized === 'to taste' || normalized === 'pinch') {
    return {
      name: ingredient,
      quantity: normalized,
      unit: '',
    };
  }
  const parts = normalized.split(' ');
  if (parts.length === 2) {
    return {
      name: ingredient,
      quantity: parts[0],
      unit: parts[1],
    };
  }
  // daca e doar numar
  if (!isNaN(Number(parts[0])) && parts[0] !== '') {
    return {
      name: ingredient,
      quantity: parts[0],
      unit: '',
    };
  }
  // fallback to taste
  return {
    name: ingredient,
    quantity: 'to taste',
    unit: '',
  };
}

// formateaza un numar la maxim 2 zecimale pentru afisare
function formatToTwoDecimals(num: number): string {
  return Number(num.toFixed(2)).toString();
}

// scaleaza cantitatea unui ingredient in functie de portii
function scaleQuantity(quantity: string | undefined, factor: number): string {
  if (!quantity || typeof quantity !== 'string' || quantity === 'to taste' || quantity.toLowerCase().includes('dash')) {
    return quantity || '';
  }
  const match = quantity.match(/(\d+(?:\.\d+)?)/);
  if (!match) return quantity;
  const numericValue = parseFloat(match[1]);
  const scaledValue = numericValue * factor;
  return quantity.replace(match[1], formatToTwoDecimals(scaledValue));
}

export default function RecipeMatchScreen() {
  const { id, fromCompleted } = useLocalSearchParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [missingIngredients, setMissingIngredients] = useState<Ingredient[]>([]);
  const [matchingIngredients, setMatchingIngredients] = useState<Ingredient[]>([]);
  const [scalingFactor, setScalingFactor] = useState(1.0);
  const [isOffline, setIsOffline] = useState(false);
  const [addedToShoppingList, setAddedToShoppingList] = useState<{ [key: string]: boolean }>({});
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreferences | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editIngredient, setEditIngredient] = useState<Ingredient | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [ingredientQuantities, setIngredientQuantities] = useState<{ [key: string]: { quantity: string; measurementType: string } }>({});
  const [isStartingCooking, setIsStartingCooking] = useState(false);
  const { getDateMealPlan, updateDateMealSlot, removeDateMealSlot } = useMealPlan();
  const [portions, setPortions] = useState(1);
  const [scaledIngredients, setScaledIngredients] = useState<Ingredient[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [bannedIngredients, setBannedIngredients] = useState<string[]>([]);
  const [existingMealPlans, setExistingMealPlans] = useState<{
    [date: string]: {
      [mealType: string]: {
        title: string;
      };
    };
  }>({});
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);
  const inputRef = useRef<TextInput>(null);


  useEffect(() => {
    let unsubscribeDietary: (() => void) | undefined;
    
    const initializeData = async () => {
    fetchRecipe();
    loadPantryIngredients();
      
      // seteaza listener in timp real pentru preferintele alimentare
      const cleanup = await loadDietaryPreferencesRealtime((prefs) => {
      setDietaryPreferences(prefs || {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        dairyFree: false,
        nutFree: false
      });
    });
      unsubscribeDietary = cleanup;
      
    checkIfFavorited();
    // listener in timp real pentru ingredientele din pantry firestore
    const user = auth.currentUser;
    if (!user) return;
    const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
    const unsubscribe = onSnapshot(userIngredientsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIngredientQuantities(data);
        setAvailableIngredients(Object.keys(data).map(item => item.toLowerCase()));
      } else {
        setIngredientQuantities({});
        setAvailableIngredients([]);
      }
    });
    return () => unsubscribe();
    };

    initializeData();

    // cleanup pentru listeneri
    return () => {
      if (unsubscribeDietary) {
        unsubscribeDietary();
      }
    };
  }, [id]);

  useEffect(() => {
    if (recipe) {
      checkIfFavorited();
    }
  }, [recipe]);

  useEffect(() => {
    const loadBannedIngredients = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      try {
        // seteaza listener in timp real pentru ingredientele interzise
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (userDoc) => {
          try {
        if (userDoc.exists()) {
          setBannedIngredients(userDoc.data().bannedIngredients || []);
        }
          } catch (error) {
            console.error('Error processing banned ingredients:', error);
          }
        }, (error) => {
          console.error('Error listening to banned ingredients:', error);
        });

        // returneaza functia de cleanup
        return unsubscribe;
      } catch (error) {
        console.error('Error loading banned ingredients:', error);
      }
    };

    let unsubscribe: (() => void) | undefined;
    loadBannedIngredients().then((cleanup) => {
      unsubscribe = cleanup;
    });

    // functia de cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const checkIfFavorited = async () => {
    const user = auth.currentUser;
    if (!user || !recipe) return;

    try {
      const userFavoritesRef = doc(db, 'users', user.uid, 'favorites', 'recipes');
      const favoritesDoc = await getDoc(userFavoritesRef);
      
      if (favoritesDoc.exists()) {
        const data = favoritesDoc.data();
        setIsFavorited(!!data[recipe.id]);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user || !recipe) return;

    try {
      const userFavoritesRef = doc(db, 'users', user.uid, 'favorites', 'recipes');
      const favoritesDoc = await getDoc(userFavoritesRef);
      const currentData = favoritesDoc.exists() ? favoritesDoc.data() : {};

      if (isFavorited) {
        // sterge din favorite
        const { [recipe.id]: removed, ...rest } = currentData;
        await setDoc(userFavoritesRef, rest);
        setIsFavorited(false);
      } else {
        // adauga la favorite
        await setDoc(userFavoritesRef, {
          ...currentData,
          [recipe.id]: {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            savedAt: new Date().toISOString()
          }
        });
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const fetchRecipe = async () => {
    try {
      // mai intai incearca sa incarce din firestore, pt retetele create de utilizator
      const recipeRef = doc(db, 'recipes', id as string);
      const recipeDoc = await getDoc(recipeRef);
      
      if (recipeDoc.exists()) {
        // este o reteta creata de utilizator
        const data = recipeDoc.data();
        const recipe = {
          id: recipeDoc.id,
          title: data.title,
          image: data.uploadedImage ? data.uploadedImage : (data.imageIndex !== undefined ? RECIPE_IMAGES[data.imageIndex] : RECIPE_IMAGES[0]),
          instructions: data.instructions,
          ingredients: data.ingredients.map((ing: any) => ({
            name: typeof ing === 'string' ? ing : ing.name,
            quantity: typeof ing === 'string' ? '' : ing.quantity,
            unit: typeof ing === 'string' ? '' : ing.unit,
            measurementType: typeof ing === 'string' ? 'other' : (ing.measurementType || 'other')
          })),
          area: data.area || undefined,
        };
        setRecipe(recipe);
        setScaledIngredients(recipe.ingredients);
        return;
      }

      // daca nu e in Firestore, incearca API-ul
      const apiUrl = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
      console.log('Fetching recipe from API:', apiUrl);
      
      const data = await fetchWithCache(apiUrl);
      
      if (!data?.meals?.length) {
        throw new Error('No recipe data found');
      }
      
      const meal = data.meals[0];
      const seenIngredients = new Set<string>();
      const ingredients: Ingredient[] = [];
      
      // parcurge toate ingredientele din api, max 20
      for (let i = 1; i <= 20; i++) {
        let ingredient = meal[`strIngredient${i}`];
        let measurement = meal[`strMeasure${i}`];

        if (ingredient) ingredient = ingredient.trim();
        if (measurement) measurement = measurement.trim();

        // sare peste ingredientele goale sau duplicate
        if (!ingredient || ingredient === '' || seenIngredients.has(ingredient.toLowerCase())) continue;

        seenIngredients.add(ingredient.toLowerCase());

        // normalizeaza ingredientul
        const normalized = normalizeIngredient(ingredient, measurement || '');

        // foloseste unitatea din reteta cand exista, altfel foloseste maparea
        let unit = '';
        if (normalized.unit && normalized.unit !== '') {
          unit = normalized.unit;
        } else {
          const mapping = ingredientUnitMap[ingredient.toLowerCase()];
          unit = mapping ? mapping.unit : (measurement ? '' : 'unit');
        }

        ingredients.push({
          name: normalized.name,
          quantity: normalized.quantity,
          measurementType: getCategory(ingredient) as 'weight' | 'volume' | 'pieces' | 'other',
          unit: unit,
        });
      }

      setRecipe({
        id: meal.idMeal,
        title: meal.strMeal,
        image: meal.strMealThumb,
        instructions: meal.strInstructions,
        ingredients,
        sourceUrl: meal.strSource || undefined,
        area: meal.strArea || undefined,
      });
      setScaledIngredients(ingredients);
    } catch (error) {
      console.error('Error loading recipe:', error);
      Alert.alert(
        'Error Loading Recipe',
        'Failed to load recipe. Please check your internet connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => fetchRecipe()
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back()
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPantryIngredients = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to view your pantry ingredients.');
      return;
    }

    try {
      setIsOffline(false);
      const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      const ingredientsDoc = await getDoc(userIngredientsRef);
      
      if (ingredientsDoc.exists()) {
        const data = ingredientsDoc.data();
        const ingredients = Object.keys(data).map(item => item.toLowerCase());
        setAvailableIngredients(ingredients);
      } else {
        setAvailableIngredients([]);
      }
    } catch (error: any) {
      console.error('Error loading pantry ingredients:', error);
      if (error.code === 'failed-precondition' || error.code === 'unavailable') {
        setIsOffline(true);
        Alert.alert(
          'Offline Mode',
          'Unable to connect to the server. Please check your internet connection and try again.',
          [
            {
              text: 'Retry',
              onPress: () => loadPantryIngredients()
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load pantry ingredients. Please try again.');
      }
    }
  };

  useEffect(() => {
    if (scaledIngredients.length > 0) {
      const missing: Ingredient[] = [];
      const matching: Ingredient[] = [];

      scaledIngredients.forEach(ingredient => {
        const ingredientName = ingredient.name.toLowerCase();
        // doar potrivire exacta
        const isAvailable = availableIngredients.includes(ingredientName);

        if (isAvailable) {
          matching.push({ ...ingredient, available: true });
        } else {
          missing.push({ ...ingredient, available: false });
        }
      });

      setMatchingIngredients(matching);
      setMissingIngredients(missing);
    }
  }, [scaledIngredients, availableIngredients, bannedIngredients]);

  const getShoppingListKey = (ingredient: Ingredient) => {
    return recipe?.title ? `${ingredient.name.toLowerCase()}__${recipe.title}` : ingredient.name.toLowerCase();
  };

  const addIngredientToShoppingList = async (ingredient: Ingredient) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add items to shopping list');
      return;
    }

    try {
      const userShoppingListRef = doc(db, 'users', user.uid, 'shoppingList', 'items');
      const shoppingListDoc = await getDoc(userShoppingListRef);
      const currentItems = shoppingListDoc.exists() ? shoppingListDoc.data() : {};

      const itemKey = getShoppingListKey(ingredient);
      const requiredQuantity = parseFloat(ingredient.quantity);
      const requiredUnit = ingredient.unit;

      // permite cantitati non numerice, gen 'to taste'
      if (!ingredient.quantity || ingredient.quantity.trim() === '') {
        Alert.alert('Invalid quantity', `Cannot add ${ingredient.name} to the shopping list because its quantity is empty.`);
        return;
      }

      // daca cantitatea nu e numar, o adauga asa cum e
      if (isNaN(requiredQuantity)) {
        currentItems[itemKey] = {
          name: ingredient.name,
          quantity: ingredient.quantity,
          category: getCategory(ingredient.name),
          checked: false,
          recipeName: recipe?.title
        };
        await setDoc(userShoppingListRef, currentItems);
        setAddedToShoppingList(prev => ({
          ...prev,
          [ingredient.name]: true
        }));
        Alert.alert('Added', `${ingredient.name} (${ingredient.quantity}) has been added to your shopping list for ${recipe?.title}.`);
        return;
      }

      // verifica daca exista vreo intrare pentru acest ingredient, nu conteaza reteta
      const anyEntryForIngredient = Object.keys(currentItems).some(key => key.startsWith(ingredient.name.toLowerCase() + '__'));
      let missingAmount = requiredQuantity;
      if (!anyEntryForIngredient) {
        const pantryQuantityStr = ingredientQuantities[ingredient.name.toLowerCase()]?.quantity;
        const pantryQuantity = parseFloat(pantryQuantityStr);
        const pantryUnit = ingredient.unit;
        if (pantryQuantity > 0 && requiredUnit === pantryUnit) {
          missingAmount = requiredQuantity - pantryQuantity;
        }
      }
      if (missingAmount <= 0) {
        Alert.alert('Already have enough', `You already have enough ${ingredient.name} in your pantry.`);
        return;
      }
      currentItems[itemKey] = {
        name: ingredient.name,
        quantity: `${missingAmount}${requiredUnit}`,
        category: getCategory(ingredient.name),
        checked: false,
        recipeName: recipe?.title
      };
      await setDoc(userShoppingListRef, currentItems);
      setAddedToShoppingList(prev => ({
        ...prev,
        [ingredient.name]: true
      }));
      Alert.alert('Added', `${ingredient.name} has been added to your shopping list for ${recipe?.title}.`);
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      Alert.alert('Error', 'Failed to add item to shopping list');
    }
  };

  const addMissingToShoppingList = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add items to shopping list');
      return;
    }

    try {
      const userShoppingListRef = doc(db, 'users', user.uid, 'shoppingList', 'items');
      const shoppingListDoc = await getDoc(userShoppingListRef);
      const currentItems = shoppingListDoc.exists() ? shoppingListDoc.data() : {};

      // 1)ia toate ingredientele lipsa (nu are deloc)
      const allToAdd = [...missingIngredients];

      // 2)adauga ingredientele partial disponibile (hasButNotEnough din matchingIngredients)
      matchingIngredients.forEach(ingredient => {
        const ingredientName = ingredient.name.toLowerCase();
        const pantryEntry = ingredientQuantities[ingredientName];
        const pantryQuantity = pantryEntry && pantryEntry.quantity ? parseFloat(pantryEntry.quantity) : null;
        const requiredQuantity = ingredient.quantity && !isNaN(Number(ingredient.quantity)) ? parseFloat(ingredient.quantity) : null;
        if (
          pantryQuantity !== null &&
          requiredQuantity !== null &&
          pantryQuantity < requiredQuantity
        ) {
          allToAdd.push(ingredient);
        }
      });

      // 3)adauga toate in lista de cumparaturi cu cantitatea necesara
      const newItems = allToAdd.reduce((acc, ingredient) => {
        const itemKey = getShoppingListKey(ingredient);
        const requiredQuantity = parseFloat(ingredient.quantity);
        if (isNaN(requiredQuantity)) {
          return acc;
        }
        const requiredUnit = ingredient.unit;
        acc[itemKey] = {
          name: ingredient.name,
          quantity: `${requiredQuantity}${requiredUnit}`,
          category: getCategory(ingredient.name),
          checked: false,
          recipeName: recipe?.title
        };
        return acc;
      }, {} as Record<string, any>);

      await setDoc(userShoppingListRef, { ...currentItems, ...newItems });
      // marcheaza toate ingredientele adaugate ca fiind adaugate 
      const addedNames = Object.values(newItems).map(item => item.name);
      setAddedToShoppingList(prev => ({
        ...prev,
        ...Object.fromEntries(addedNames.map(name => [name, true]))
      }));

      Alert.alert(
        'Added To Shopping List',
        `${Object.keys(newItems).length} ingredients have been added to your shopping list for ${recipe?.title}.`
      );
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      Alert.alert('Error', 'Failed to add items to shopping list');
    }
  };

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

  // helper pentru curatarea afisarii cantitatilor
  const getMetricQuantity = (quantity: string) => {
    if (!quantity) return '';
    let metric = quantity.split('/')[0].trim();
    // elimina unitatile
    metric = metric.replace(/\boz\b|ounces?|lbs?|tbls?|tsp|cups?/gi, '').trim();
    return metric;
  };

  const handleEditQuantity = (ingredient: Ingredient) => {
    setEditIngredient(ingredient);
    setEditQuantity('');
    setEditModalVisible(true);
  };

  const saveEditedQuantity = async () => {
    if (!editIngredient) return;
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const name = editIngredient.name.toLowerCase();
      const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      // obtine datele curente
      const docSnap = await getDoc(userIngredientsRef);
      const currentData = docSnap.exists() ? docSnap.data() : {};
      // adauga la cantitatea existenta daca exista
      const prevQuantity = currentData[name]?.quantity ? parseFloat(currentData[name].quantity) : 0;
      const addQuantity = editQuantity ? parseFloat(editQuantity) : 0;
      if (isNaN(addQuantity) || addQuantity <= 0) {
        Alert.alert('Invalid quantity', 'Please enter a quantity greater than 0.');
        return;
      }
      const newQuantity = formatToTwoDecimals(prevQuantity + addQuantity);
      // asigura ca measurementType e definit, default la weight
      const measurementType = editIngredient.measurementType || 'weight';
      // ia unitatea din ingredient
      const unit = editIngredient.unit || 'g';
      // salveaza cantitatea cu unitatea atasata si measurementType
      currentData[name] = { 
        quantity: newQuantity + unit, 
        measurementType: measurementType
      };
      await setDoc(userIngredientsRef, currentData, { merge: true });
      setEditModalVisible(false);
      setEditQuantity('');
      setEditIngredient(null);
    } catch (e) {
      console.error('Error updating quantity:', e);
      Alert.alert('Error', 'Failed to update quantity.');
    }
  };

  const isIngredientBanned = (ingredient: string) => bannedIngredients.includes(ingredient.toLowerCase());

  const renderIngredient = (ingredient: Ingredient, isAvailable: boolean) => {
    const conflicts = dietaryPreferences ? checkDietaryConflicts(ingredient.name, dietaryPreferences) : [];
    const hasConflicts = conflicts.length > 0;
    const isAdded = addedToShoppingList[ingredient.name];
    const isBanned = isIngredientBanned(ingredient.name);

    // verifica daca utilizatorul are ingredientul dar nu si cantitate suficienta
    const pantryEntry = ingredientQuantities[ingredient.name.toLowerCase()];
    const pantryQuantity = pantryEntry && pantryEntry.quantity ? parseFloat(pantryEntry.quantity) : null;
    const requiredQuantity = ingredient.quantity && !isNaN(Number(ingredient.quantity)) ? parseFloat(ingredient.quantity) : null;
    const hasButNoQuantity = isAvailable && (!pantryEntry || !pantryEntry.quantity);
    const hasButNotEnough = isAvailable && pantryQuantity !== null && requiredQuantity !== null && pantryQuantity < requiredQuantity;

    return (
      <View
        key={ingredient.name}
        style={[
          styles.ingredientItem
        ]}
      >
        <View style={styles.ingredientNameCol}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={[
              styles.ingredientName,
              hasConflicts && styles.conflictingText,
              hasConflicts && styles.conflictingNameBg,
              isBanned && !isAvailable && styles.bannedIngredientName,
              isBanned && isAvailable && styles.bannedAvailableIngredientName
            ]}>
              {ingredient.name.toLowerCase()}
            </Text>
            {hasConflicts && (
              <TouchableOpacity
                style={{marginLeft: -2}}
                onPress={() => Alert.alert(
                  'Dietary Conflict',
                  `This ingredient conflicts with your ${conflicts.map(c => c.replace(/([A-Z])/g, ' $1').trim()).join(', ')} dietary preferences.`
                )}
              >
                <Ionicons name="help-circle" size={20} color={Colors.error} />
              </TouchableOpacity>
            )}
            {isBanned && (
              <TouchableOpacity
                style={{marginLeft: -2}}
                onPress={() => Alert.alert(
                  'Ingredient Interzis',
                  'Acest ingredient este în lista de ingrediente interzise.'
                )}
              >
                <Ionicons name="close-circle" size={20} color={Colors.pinkicon} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.ingredientQuantityCol}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={[
              styles.ingredientQuantity,
              isAvailable ? styles.availableIngredient : styles.missingIngredient,
              (hasButNoQuantity || hasButNotEnough) && styles.missingQuantity,
              isBanned && !isAvailable && styles.bannedIngredientQuantity
            ]}>
              {String(ingredient.quantity)} {ingredient.unit}
            </Text>
            {isAvailable && hasButNotEnough && (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Nu Ai Cantitatea Din Alăptare Alert',
                    `Ai deja ${pantryQuantity}${ingredient.unit} în dulap, dar ai nevoie de ${ingredient.quantity}${ingredient.unit}`
                  );
                }}
                style={{ marginLeft: 6 }}
              >
                <Ionicons name="alert-circle" size={18} color={Colors.half} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.ingredientButtonCol}>
          {isAvailable ? (
            <TouchableOpacity
              style={styles.editButtonIcon}
              onPress={() => handleEditQuantity(ingredient)}
            >
              <Ionicons name="pencil" size={20} color={Colors.owned} />
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={styles.editButtonIcon}
                onPress={() => handleEditQuantity(ingredient)}
              >
                <Ionicons name="pencil" size={20} color={Colors.owned} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addButtonIcon,
                  isAdded && styles.addedButtonIcon
                ]}
                onPress={() => addIngredientToShoppingList(ingredient)}
              >
                {isAdded ? (
                  <Ionicons name="cart" size={20} color={Colors.textLight} />
                ) : (
                  <Ionicons name="add-circle-outline" size={20} color={Colors.error} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleStartCooking = async () => {
    if (!canStartCooking()) {
      Alert.alert(
        'Missing Ingredients',
        'You need to have all ingredients in your pantry to start cooking. Would you like to add missing ingredients to your shopping list?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Add to Shopping List',
            onPress: addMissingToShoppingList
          }
        ]
      );
      return;
    }

    setIsStartingCooking(true);
    try {
      await router.push(`/recipes-folder/cookingInProgress?id=${recipe?.id}&scalingFactor=${portions}`);
    } catch (error) {
      console.error('Error navigating to cooking screen:', error);
      Alert.alert('Error', 'Failed to start cooking mode. Please try again.');
    } finally {
      setIsStartingCooking(false);
    }
  };

  const updateScalingFactor = (newFactor: number) => {
    setScalingFactor(newFactor);
    if (recipe) {
      // actualizeaza cantitatile ingredientelor in functie de factorul de scalare
      const updatedIngredients = recipe.ingredients.map(ingredient => ({
        ...ingredient,
        quantity: String(parseFloat(ingredient.quantity) * newFactor)
      }));
      setRecipe({ ...recipe, ingredients: updatedIngredients });
    }
  };

  useEffect(() => {
    if (recipe?.ingredients) {
      // scaleaza ingredientele in functie de numarul de portii
      const scaled = recipe.ingredients.map((ing: Ingredient) => ({
        ...ing,
        quantity: scaleQuantity(ing.quantity, portions),
      }));
      setScaledIngredients(scaled);
    }
  }, [recipe, portions]);

  const handlePortionChange = (value: number) => {
    setPortions(value);
  };

  const handlePlanRecipe = async (date: string, mealType: string, replaceExisting?: boolean) => {
    setPlanLoading(true);
    try {
      if (!recipe) {
        Alert.alert('Error', 'No recipe loaded.');
        setPlanLoading(false);
        return;
      }

      const success = await updateDateMealSlot(date, mealType, {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
      }, replaceExisting);

      if (success) {
        setPlanModalVisible(false);
        Alert.alert('Planned!', `Recipe planned for ${date} (${mealType})`);
        // reincarca planurile de masa pentru a reflecta schimbarea
        loadExistingMealPlans();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to plan recipe.');
    } finally {
      setPlanLoading(false);
    }
  };

  const loadExistingMealPlans = async () => {
    if (!planModalVisible) return;
    
    const today = new Date();
    const endDate = new Date();
    endDate.setFullYear(today.getFullYear() + 2);
    
    const plans: typeof existingMealPlans = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const plan = await getDateMealPlan(dateStr);
      if (plan) {
        plans[dateStr] = {};
        if (plan.meals.breakfast) plans[dateStr].breakfast = { title: plan.meals.breakfast.title };
        if (plan.meals.lunch) plans[dateStr].lunch = { title: plan.meals.lunch.title };
        if (plan.meals.dinner) plans[dateStr].dinner = { title: plan.meals.dinner.title };
      }
    }
    
    setExistingMealPlans(plans);
  };

  useEffect(() => {
    if (planModalVisible) {
      loadExistingMealPlans();
    }
  }, [planModalVisible]);

  const canStartCooking = () => {
    // daca sunt ingrediente lipsa, nu poate incepe
    if (missingIngredients.length > 0) return false;
    // daca orice ingredient disponibil nu e suficient la cantitate, nu poate incepe
    for (const ingredient of matchingIngredients) {
      const ingredientName = ingredient.name.toLowerCase();
      const pantryEntry = ingredientQuantities[ingredientName];
      const pantryQuantity = pantryEntry && pantryEntry.quantity ? parseFloat(pantryEntry.quantity) : null;
      const requiredQuantity = ingredient.quantity && !isNaN(Number(ingredient.quantity)) ? parseFloat(ingredient.quantity) : null;
      if (
        pantryQuantity !== null &&
        requiredQuantity !== null &&
        pantryQuantity < requiredQuantity
      ) {
        return false;
      }
    }
    return true;
  };

  // functie pentru a obtine instructiuni in preview
  const getPreviewInstructions = (instructions: string | string[]) => {
    if (Array.isArray(instructions)) {
      return instructions.slice(0, 2).map((instruction, index) => (
        `${index + 1}. ${instruction}`
      )).join('\n');
    }
    return instructions.split('\n').slice(0, 2).map((instruction, index) => 
      `${index + 1}. ${instruction.trim()}`
    ).join('\n');
  };

  // functie pentru deschidere link sursa
  const handleOpenSourceUrl = () => {
    if (recipe?.sourceUrl) {
      Alert.alert(
        'External Recipe Link',
        'Would you like to view the original recipe on the external website?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Open Link',
            onPress: () => {
              // foloseste linking api din react pentru deschidere URL
              import('react-native').then(({ Linking }) => {
                Linking.openURL(recipe.sourceUrl!).catch((err) => {
                  console.error('Error opening URL:', err);
                  Alert.alert('Error', 'Could not open the recipe link');
                });
              });
            }
          }
        ]
      );
    }
  };

  useEffect(() => {
    if (editModalVisible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [editModalVisible]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text>Loading recipe...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.content}>
            {isOffline && (
              <View style={styles.offlineBanner}>
                <Ionicons name="cloud-offline" size={20} color={Colors.textLight} />
                <Text style={styles.offlineText}>You are offline</Text>
              </View>
            )}
            
            <View style={styles.imageContainer}>
              {recipe && recipe.area && (
                <View style={styles.areaBadge}>
                  <Text style={styles.areaBadgeText}>{recipe.area}</Text>
                </View>
              )}
              <Image 
                source={typeof recipe?.image === 'string' ? { uri: recipe.image } : recipe?.image} 
                style={styles.image} 
              />
              <TouchableOpacity
                style={commonStyles.heartButton}
                onPress={toggleFavorite}
              >
                <Ionicons
                  name={isFavorited ? "heart" : "heart-outline"}
                  size={28}
                  color={isFavorited ? Colors.error : Colors.border}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>{recipe?.title}</Text>

            {/* adauga buton pentru link sursa daca e disponibil */}
            {recipe?.sourceUrl && (
              <TouchableOpacity
                style={styles.sourceButton}
                onPress={handleOpenSourceUrl}
              >
                <Ionicons name="link" size={20} color={Colors.primary} />
                <Text style={styles.sourceButtonText}>View Original Recipe</Text>
              </TouchableOpacity>
            )}

            <View style={styles.portionsContainer}>
              <Text style={styles.portionsLabel}>Adjust portions:</Text>
              <View style={styles.portionsControls}>
                <TouchableOpacity 
                  style={[styles.portionButton, portions === 0.5 && styles.activePortionButton]} 
                  onPress={() => handlePortionChange(0.5)}
                >
                  <Text style={[styles.portionButtonText, portions === 0.5 && styles.activePortionButtonText]}>½</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.portionButton, portions === 1 && styles.activePortionButton]} 
                  onPress={() => handlePortionChange(1)}
                >
                  <Text style={[styles.portionButtonText, portions === 1 && styles.activePortionButtonText]}>1</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.portionButton, portions === 2 && styles.activePortionButton]} 
                  onPress={() => handlePortionChange(2)}
                >
                  <Text style={[styles.portionButtonText, portions === 2 && styles.activePortionButtonText]}>2</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.portionButton, portions === 4 && styles.activePortionButton]} 
                  onPress={() => handlePortionChange(4)}
                >
                  <Text style={[styles.portionButtonText, portions === 4 && styles.activePortionButtonText]}>4</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.portionButton, portions === 6 && styles.activePortionButton]} 
                  onPress={() => handlePortionChange(6)}
                >
                  <Text style={[styles.portionButtonText, portions === 6 && styles.activePortionButtonText]}>6</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.ingredientsContainer}>
              {matchingIngredients.length > 0 && (
                <View style={styles.ingredientSection}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.owned} /> You Have:
                  </Text>
                  {matchingIngredients.map((ingredient) => renderIngredient(ingredient, true))}
                </View>
              )}

              {missingIngredients.length > 0 && (
                <View style={styles.ingredientSection}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="alert-circle" size={20} color={Colors.error} /> You Need: 
                  </Text>
                  {missingIngredients.map((ingredient) => renderIngredient(ingredient, false))}
                  <TouchableOpacity
                    style={styles.addAllButton}
                    onPress={addMissingToShoppingList}
                  >
                    <Text style={styles.addAllButtonText}>
                       Add All Missing To Shopping List
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* instructiunile retetei */}
            <View style={[styles.instructionsContainer, styles.instructionsCard]}>
              <View style={styles.instructionsHeader}>
                <Text style={styles.sectionTitle}>Instructions: </Text>
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setIsInstructionsExpanded(!isInstructionsExpanded)}
                >
                  <Text style={styles.expandButtonText}>
                    {isInstructionsExpanded ? '(Show Less)' : '(Show More)'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {isInstructionsExpanded && (
                Array.isArray(recipe?.instructions) ? (
                  recipe.instructions.map((instruction, index) => (
                    <Text key={index} style={styles.instruction}>
                      {instruction}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.instruction}>
                    {recipe?.instructions.split('\n').map((instruction, index) => 
                      `${instruction.trim()}\n`
                    )}
                  </Text>
                )
              )}
            </View>

            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: Colors.primaryDark, marginBottom: 20 }]}
              onPress={() => setPlanModalVisible(true)}
              disabled={planLoading}
            >
              <Text style={styles.startButtonText}>Schedule This Recipe</Text>
            </TouchableOpacity>

            <PlanRecipeModal
              visible={planModalVisible}
              onClose={() => setPlanModalVisible(false)}
              onConfirm={handlePlanRecipe}
              existingMealPlans={existingMealPlans}
            />

            <TouchableOpacity
              style={[styles.startButton, !canStartCooking() && styles.startButtonDisabled]}
              onPress={handleStartCooking}
              disabled={isStartingCooking}
            >
              {isStartingCooking ? (
                <ActivityIndicator color={Colors.textLight} size="small" />
              ) : (
                <Text style={styles.startButtonText}>Start Cooking Now</Text>
              )}
            </TouchableOpacity>
          </View>
          <Modal
            visible={editModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setEditModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Already have it or realized you have more? Adjust the quantity here:</Text>
                <Text style={{marginBottom: 8}}>
                  {editIngredient?.name?.toLowerCase()}
                  {editIngredient && ingredientQuantities[editIngredient.name.toLowerCase()]?.quantity && (
                    <Text> (you have now: {(() => {
                      const qty = ingredientQuantities[editIngredient.name.toLowerCase()].quantity;
                      const unit = editIngredient.unit || '';
                      // adauga unitatea doar daca nu e deja prezenta
                      return qty && unit && qty.endsWith(unit) ? qty : `${qty}${unit}`;
                    })()})</Text>
                  )}
                </Text>
                <TextInput
                  ref={inputRef}
                  style={styles.modalInput}
                  value={editQuantity}
                  onChangeText={setEditQuantity}
                  keyboardType="numeric"
                  placeholder={`Enter quantity to add${editIngredient?.measurementType === 'weight' ? ' (g)' : editIngredient?.measurementType === 'volume' ? ' (ml)' : editIngredient?.measurementType === 'pieces' ? ' (pcs)' : ''}`}
                  onSubmitEditing={saveEditedQuantity}
                  returnKeyType="done"
                />
                <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16}}>
                  <Pressable onPress={() => setEditModalVisible(false)} style={styles.modalCancelBtn}>
                    <Text style={{color: Colors.primary}}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={saveEditedQuantity} style={styles.modalSaveBtn}>
                    <Text style={{color: Colors.textLight}}>Save</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
} 