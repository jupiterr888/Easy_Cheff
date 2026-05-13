import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalizeQuantity } from '../../utils/normalizeQuantity';
import { auth, db } from '../../backend/firebase';
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
import RecipeCompletionModal from '../../components/RecipeCompletionModal';
import { DietaryPreferences, checkDietaryConflicts, loadDietaryPreferencesRealtime } from '../../utils/dietaryPreferences';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../recipes-folder/styles/cookingInProgress.styles';

// interfata pentru reteta in curs de gatit
interface Recipe {
  id: string;
  title: string;
  image: string;
  ingredients: Ingredient[];
  instructions: string;
  scalingFactor: number;
  isUserGenerated?: boolean;
}

// interfata pentru ingrediente cu cantitati si tipuri de masura
interface Ingredient {
  name: string;
  quantity: string;
  measurementType: 'weight' | 'volume' | 'pieces' | 'other';
  unit?: string;
}

// interfata pentru reteta completata cu toate detaliile necesare
interface CompletedRecipe {
  id: string;
  title: string;
  image: string | number;  // poate fi URL string sau index numar imagine
  completedDate: string;
  ingredients: Ingredient[];
  instructions: string;
  rating: number;
  mention: string;
  scalingFactor: number;
  isUserRecipe?: boolean;
}

export default function CookingInProgressScreen() {
  const { id, scalingFactor } = useLocalSearchParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState(false);
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreferences | null>(null);

  // initializeaza datele la montarea componentei
  useEffect(() => {
    let unsubscribeDietary: (() => void) | undefined;
    
    const initializeData = async () => {
    fetchRecipe();
      
      // seteaza listener in timp real pentru preferintele alimentare
      const dietaryCleanup = await loadDietaryPreferencesRealtime((prefs) => {
      setDietaryPreferences(prefs || {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        dairyFree: false,
        nutFree: false
      });
    });
      unsubscribeDietary = dietaryCleanup;
    };

    initializeData();

    // functia de cleanup
    return () => {
      if (unsubscribeDietary) {
        unsubscribeDietary();
      }
    };
  }, [id]);

  // incarca reteta din firebase sau API extern
  const fetchRecipe = async () => {
    try {
      // mai intai incearca sa incarce din firebase (retete utilizator)
      const recipeRef = doc(db, 'recipes', id as string);
      const recipeDoc = await getDoc(recipeRef);
      
      if (recipeDoc.exists()) {
        // e o reteta utilizator
        const recipeData = recipeDoc.data();
        setRecipe({
          id: recipeDoc.id,
          title: recipeData.title,
          image: recipeData.uploadedImage ? recipeData.uploadedImage : (recipeData.imageIndex !== undefined ? RECIPE_IMAGES[recipeData.imageIndex] : RECIPE_IMAGES[0]),
          ingredients: recipeData.ingredients.map((ing: any) => ({
            ...ing,
            quantity: ing.quantity,
            unit: ing.unit || '',
            measurementType: ing.measurementType || 'other',
          })),
          instructions: recipeData.instructions,
          scalingFactor: Number(scalingFactor) || 1,
          isUserGenerated: true,
        });
      } else {
        // daca nu e in firebase, incearca TheMealDB
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await response.json();
        
        if (data?.meals?.length > 0) {
          const meal = data.meals[0];
          const ingredients: Ingredient[] = [];
          
          // incarca ingredientele cu masuratori
          for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measurement = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim() !== '') {
              // normalizeaza masuratoarea la unitatile noastre standard
              const normalizedQuantity = measurement ? 
                normalizeQuantity(measurement.trim(), ingredient) : 
                'to taste';

              // determina tipul de masuratoare bazat pe cantitatea normalizata
              let measurementType: 'weight' | 'volume' | 'pieces' | 'other' = 'other';
              if (normalizedQuantity.endsWith('g')) {
                measurementType = 'weight';
              } else if (normalizedQuantity.endsWith('ml')) {
                measurementType = 'volume';
              } else if (normalizedQuantity.endsWith('pcs')) {
                measurementType = 'pieces';
              }

              ingredients.push({
                name: ingredient,
                quantity: normalizedQuantity,
                measurementType,
                unit: meal[`strMeasure${i}`]?.trim() // pastreaza masuratoarea originala pentru context, dar nu pentru afisare directa
              });
            }
          }

          setRecipe({
            id: meal.idMeal,
            title: meal.strMeal,
            image: meal.strMealThumb,
            instructions: meal.strInstructions,
            ingredients,
            scalingFactor: Number(scalingFactor) || 1,
            isUserGenerated: false,
          });
        }
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  // imaginile implicite pentru retete
  const RECIPE_IMAGES = [
    require('../../assets/images/breakfast-ok.png'),
    require('../../assets/images/lunch-ok.png'),
    require('../../assets/images/dinner-ok.png'),
    require('../../assets/images/dessert-ok.png'),
    require('../../assets/images/meat-ok.png'),
  ];

  // scaleaza cantitatea ingredientului in functie de factorul de scalare
  const scaleQuantity = (quantity: string, factor: number): string => {
    if (!quantity || quantity === 'to taste' || quantity.toLowerCase().includes('dash')) {
      return quantity;
    }
    
    // valoare numerica si unitate
    const match = quantity.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
    if (!match) return quantity;
    
    const numericValue = parseFloat(match[1]);
    const unit = match[2] || ''; // pastreaza unitatea existenta
    const scaledValue = numericValue * factor;
    
    // rotunjeste la 2 zecimale
    const roundedValue = Math.round(scaledValue * 100) / 100;
    
    // returneaza cu unitatea originala daca exista
    return unit ? `${roundedValue}${unit}` : roundedValue.toString();
  };

  // returneaza unitatea de masura pentru tipul specificat
  const getMeasurementUnit = (type: 'weight' | 'volume' | 'pieces' | 'other'): string => {
    switch (type) {
      case 'weight':
        return 'g';
      case 'volume':
        return 'ml';
      case 'pieces':
        return 'pcs';
      default:
        return '';
    }
  };

  // deschide modalul de completare reteta
  const handleCompleteRecipe = () => {
    setCompletionModalVisible(true);
    setPendingCompletion(true);
  };

  // salveaza reteta completata in firebase
  const handleSaveCompletion = async (rating: number, mention: string) => {
    if (!recipe) return;
    setCompletionModalVisible(false);
    setPendingCompletion(false);

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to complete recipes');
      return;
    }

    try {
      // obtine URL, calea corecta pentru imagine pentru salvare
      const imageToSave = typeof recipe.image === 'number' ? 
        recipe.image :
        recipe.image;

      // creeaza o intrare noua de reteta completata cu id unic pe completare
      const completedRecipe = {
        id: `${recipe.id}_${Date.now()}`,
        recipeId: recipe.id,
        title: recipe.title,
        image: imageToSave,
        completedDate: new Date().toISOString(),
        ingredients: recipe.ingredients.map(ing => {
          const scaledQuantity = scaleQuantity(ing.quantity, recipe.scalingFactor);
          // daca cantitatea nu include o unitate, adauga una potrivita
          if (scaledQuantity !== 'to taste' && !scaledQuantity.match(/[a-zA-Z]/)) {
            const unit = ing.unit || getMeasurementUnit(ing.measurementType);
            return {
              ...ing,
              quantity: unit ? `${scaledQuantity}${unit}` : scaledQuantity
            };
          }
          return {
            ...ing,
            quantity: scaledQuantity
          };
        }),
        instructions: recipe.instructions,
        rating,
        mention,
        scalingFactor: recipe.scalingFactor,
        isUserRecipe: typeof recipe.image === 'number'
      };

      // obtine documentul retetelor completate ale utilizatorului
      const userCompletedRef = doc(db, 'users', user.uid, 'completedRecipes', 'recipes');
      const completedDoc = await getDoc(userCompletedRef);
      let newData = {};
      if (completedDoc.exists()) {
        const data = completedDoc.data();
        newData = { ...data, [completedRecipe.id]: completedRecipe };
      } else {
        newData = { [completedRecipe.id]: completedRecipe };
      }
      await setDoc(userCompletedRef, newData);

      Alert.alert(
        'Recipe Completed!',
        'Great job! This recipe has been added to your completed recipes.',
        [
          {
            text: 'View Completed Recipes',
            onPress: () => router.push('/recipes-folder/completedRecipes')
          },
          {
            text: 'Back to Home',
            onPress: () => router.push('/(tabs)')
          }
        ]
      );
    } catch (error) {
      console.error('Error saving completed recipe:', error);
      Alert.alert('Error', 'Failed to save completed recipe. Please try again.');
    }
  };

  // renderizeaza un ingredient cu verificarea conflictelor alimentare
  const renderIngredient = (ingredient: Ingredient, index: number) => {
    const conflicts = dietaryPreferences ? checkDietaryConflicts(ingredient.name, dietaryPreferences) : [];
    const hasConflicts = conflicts.length > 0;

    // obtine cantitatea scalata
    const scaledQuantity = scaleQuantity(ingredient.quantity, recipe?.scalingFactor || 1);

    let displayQuantity = scaledQuantity;

    // adauga o unitate doar daca scaledQuantity nu contine deja o unitate alfabetica si daca nu e to taste sau goala
    const hasApparentUnit = /[a-zA-Z]+$/.test(scaledQuantity.trim());

    if (!hasApparentUnit && scaledQuantity.trim() !== '' && scaledQuantity.toLowerCase() !== 'to taste') {
        if (ingredient.unit && ingredient.unit.trim() !== '') {
            // foloseste unitatea explicita din ingredient, furnizata de utilizator
            displayQuantity = `${scaledQuantity} ${ingredient.unit}`.trim();
        } else {
            // fallback la unitatea measurementType, pt  API sau cand utilizatorul nu a specificat unitatea
            displayQuantity = `${scaledQuantity} ${getMeasurementUnit(ingredient.measurementType)}`.trim();
        }
    } else if (scaledQuantity.toLowerCase() === 'to taste') {
        displayQuantity = 'to taste'; // se asigura ca to taste e afisat corect fara unitati
    }

    return (
      <View key={`ingredient-${index}-${ingredient.name}`} style={[
        styles.ingredientItem,
        hasConflicts && styles.conflictingItem
      ]}>
        <View style={styles.ingredientInfo}>
          <Text style={[
            styles.ingredientName,
            hasConflicts && styles.conflictingText
          ]}>
            {ingredient.name.toLowerCase()}
          </Text>
          {hasConflicts && (
            <TouchableOpacity
              style={styles.conflictIcon}
              onPress={() => Alert.alert(
                'Dietary Conflict',
                `This ingredient conflicts with your ${conflicts.map(c => c.replace(/([A-Z])/g, ' $1').trim()).join(', ')} dietary preferences.`
              )}
            >
              <Ionicons name="help-circle" size={20} color={Colors.error} />
            </TouchableOpacity>
          )}
          <Text style={styles.ingredientQuantity}>
            {displayQuantity}
          </Text>
        </View>
      </View>
    );
  };

  // afiseaza loading screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.content}>
            <Image 
              source={typeof recipe?.image === 'number' ? recipe.image : { uri: recipe?.image }} 
              style={styles.image}
              defaultSource={require('../../assets/images/default-recipe.png')}
            />
            <Text style={styles.title}>{recipe?.title}</Text>

            <View style={styles.ingredientsContainer}>
              <Text style={styles.sectionTitle}>Ingredient List: </Text>
              {recipe?.ingredients.map((ingredient, index) => renderIngredient(ingredient, index))}
            </View>

            <View style={styles.instructionsContainer}>
              <Text style={styles.sectionTitle}>Instructions: </Text>
              {Array.isArray(recipe?.instructions) ? (
                recipe.instructions.map((instruction, index) => (
                  <Text key={index} style={styles.instruction}>
                    {index + 1}. {instruction}
                  </Text>
                ))
              ) : (
                <Text style={styles.instruction}>
                  {recipe?.instructions.split('\n').map((instruction, index) => 
                    `${index + 1}. ${instruction.trim()}\n`
                  )}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteRecipe}
            >
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              <Text style={styles.completeButtonText}>Mark Recipe as Completed</Text>
            </TouchableOpacity>
          </View>
          <RecipeCompletionModal
            visible={completionModalVisible}
            onClose={() => setCompletionModalVisible(false)}
            onSave={handleSaveCompletion}
          />
        </ScrollView>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
}