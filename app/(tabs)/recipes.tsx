import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { commonStyles } from '../../constants/Styles';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../backend/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { DietaryPreferences, checkDietaryConflicts, loadDietaryPreferencesRealtime } from '../../utils/dietaryPreferences';
import { styles } from '../styles/tabs/recipes.styles';

export default function RecipesScreen() {
  // stari pentru retete, favorite, incarcare, preferinte, ingrediente interzise
  const [recipes, setRecipes] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreferences | null>(null);
  const [bannedIngredients, setBannedIngredients] = useState<string[]>([]);
  const router = useRouter();

  // extrage ingredientele dintr-un meal
  const extractIngredients = (meal: any) => {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push(ingredient.trim());
      }
    }
    return ingredients;
  };

  // se incarca ingredientele interzise in realtime
  const loadBannedIngredients = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      // listener realtime pentru ingrediente interzise
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

      // cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error loading banned ingredients:', error);
    }
  };

  // se incarca retete din API si se filtreaza dupa preferinte si ingrediente interzise
  const fetchRecipes = async () => {
    try {
      const allMeals: any[] = [];
      
      // fac 4 cereri api, 3 retete random si 1 din cautare generala
      const fetchMethods = [
        fetch('https://www.themealdb.com/api/json/v1/1/random.php').then(r => r.json()),
        fetch('https://www.themealdb.com/api/json/v1/1/random.php').then(r => r.json()),
        fetch('https://www.themealdb.com/api/json/v1/1/random.php').then(r => r.json()),
        fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=').then(r => r.json()),
        
      ];

      // asteptam toate fetch-urile
      const results = await Promise.all(fetchMethods);
      
      // combinam toate retetele
      results.forEach(data => {
        if (data?.meals) {
          allMeals.push(...data.meals);
        }
      });

      // fara duplicate dupa id
      const uniqueMeals = Array.from(new Map(allMeals.map(meal => [meal.idMeal, meal])).values());
      
      // amestecam lista random
      const shuffledMeals = [...uniqueMeals].sort(() => Math.random() - 0.5);
      
      // procesam retetele pentru preview, cu extragere de ingrediente
      const processedRecipes = shuffledMeals.map((meal: any) => {
        return {
          id: meal.idMeal,
          title: meal.strMeal,
          image: meal.strMealThumb,
          ingredients: meal.strIngredient1 ? extractIngredients(meal) : [],
          category: meal.strCategory || 'Other',
          area: meal.strArea || '',
        };
      });

      // filtram/eliminam retetele cu ingrediente interzise sau conflicte
      const filteredRecipes = processedRecipes.filter(recipe => {
        // se verifica ingrediente interzise
        const hasBannedIngredients = recipe.ingredients.some(ingredient =>
          bannedIngredients.includes(ingredient.toLowerCase())
        );
        if (hasBannedIngredients) return false;

        // se verifica conflicte alimentare
        if (dietaryPreferences) {
          const hasConflicts = recipe.ingredients.some(ingredient =>
            checkDietaryConflicts(ingredient, dietaryPreferences).length > 0
          );
          if (hasConflicts) return false;
        }

        return true;
      });

      // luam 8 retete random din lista filtrata (daca sunt suficiente)
      function getRandomSubset<T>(array: T[], n: number): T[] {
        const shuffled = array.slice().sort(() => Math.random() - 0.5);
        return shuffled.slice(0, n);
      }
      let topRecipes = getRandomSubset(filteredRecipes, 8);

      // completam daca sunt informatii lipsa gen area
      topRecipes = await Promise.all(topRecipes.map(async (recipe) => {
        if (!recipe.area) {
          try {
            const detailResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.id}`);
            const detailData = await detailResponse.json();
            if (detailData?.meals?.[0]) {
              return {
                ...recipe,
                area: detailData.meals[0].strArea || '',
              };
            }
          } catch (e) {
            // ignoram erorile de background
          }
        }
        return recipe;
      }));

      setRecipes(topRecipes);

      // completam ingredientele lipsa in background
      topRecipes.forEach(async (recipe, idx) => {
        if (!recipe.ingredients || recipe.ingredients.length === 0) {
          try {
            const detailResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.id}`);
            const detailData = await detailResponse.json();
            if (detailData?.meals?.[0]) {
              const fullMeal = detailData.meals[0];
              const newIngredients = extractIngredients(fullMeal);
              setRecipes(prev => {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], ingredients: newIngredients };
                return updated;
              });
            }
          } catch (e) {
            // ignoram erorile de background
          }
        }
      });
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribeBanned: (() => void) | undefined;
    let unsubscribeDietary: (() => void) | undefined;
    
    const initializeData = async () => {
      try {
        // listener realtime pentru ingrediente interzise
        const cleanup = await loadBannedIngredients();
        unsubscribeBanned = cleanup;
        
        // listener realtime pentru preferinte
        const dietaryCleanup = await loadDietaryPreferencesRealtime((prefs) => {
      setDietaryPreferences(prefs);
        });
        unsubscribeDietary = dietaryCleanup;
        
      await fetchRecipes();
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();

    // cleanup la demontare pt listeneri
    return () => {
      if (unsubscribeBanned) {
        unsubscribeBanned();
      }
      if (unsubscribeDietary) {
        unsubscribeDietary();
      }
    };
  }, []);

  // reincarcam retetele cand se schimba ingredientele interzise sau preferintele
  useEffect(() => {
    if (bannedIngredients.length > 0 || dietaryPreferences) {
      fetchRecipes();
    }
  }, [bannedIngredients, dietaryPreferences]);

  // incarcam id-urile retetelor salvate
  const loadSavedIds = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const userFavoritesRef = doc(db, 'users', user.uid, 'favorites', 'recipes');
      const favoritesDoc = await getDoc(userFavoritesRef);
      if (favoritesDoc.exists()) {
        const data = favoritesDoc.data();
        setSavedIds(Object.keys(data || {}));
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
    }
  };

  // adauga sau elimina o reteta din favorite
  const toggleSaveRecipe = async (recipe: any) => {
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to save recipes');
      return;
    }
    try {
      const userFavoritesRef = doc(db, 'users', user.uid, 'favorites', 'recipes');
      const favoritesDoc = await getDoc(userFavoritesRef);
      const currentData = favoritesDoc.exists() ? favoritesDoc.data() : {};
      const isSaved = currentData[recipe.id];
      let updatedData;
      if (isSaved) {
        // scoatem reteta din favorite
        const { [recipe.id]: removed, ...rest } = currentData;
        updatedData = rest;
        await setDoc(userFavoritesRef, updatedData);
        setSavedIds(prev => prev.filter(id => id !== recipe.id));
      } else {
        // adaugam reteta la favorite
        updatedData = {
          ...currentData,
          [recipe.id]: {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            savedAt: new Date().toISOString()
          }
        };
        await setDoc(userFavoritesRef, updatedData);
        setSavedIds(prev => [...prev, recipe.id]);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      alert('Failed to save recipe. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[commonStyles.title, { marginTop: -20}]}>Recipe Suggestions</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchRecipes}
          >
            <Ionicons name="refresh" size={28} color={Colors.primaryDark} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.swiper}>
          {recipes.map((recipe) => {
            const isSaved = savedIds.includes(recipe.id);
            return (
            <TouchableOpacity
              key={recipe.id}
                style={[commonStyles.recipeCard, { marginTop: 10}]}
              onPress={() => router.push({ pathname: '../recipes-folder/recipeMatch', params: { id: recipe.id } })}
            >
              {/* badge cu zona */}
              {recipe.area && (
                <View style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  backgroundColor: Colors.card,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  zIndex: 2,
                  alignSelf: 'flex-start',
                }}>
                  <Text style={{ color: Colors.primaryDark, fontWeight: 'bold', fontSize: 12, textTransform: 'capitalize' }}>{recipe.area}</Text>
                </View>
              )}
              <Image source={{ uri: recipe.image }} style={commonStyles.recipeImage} />
              <View style={commonStyles.recipeContent}>
                <Text style={commonStyles.recipeName}>{recipe.title}</Text>
                <Text style={commonStyles.ingredientList}>
                  {recipe.ingredients.join(', ')}
                </Text>
              </View>
                <TouchableOpacity
                  style={commonStyles.heartButton}
                  onPress={e => {
                    e.stopPropagation();
                    toggleSaveRecipe(recipe);
                  }}
                >
                  <Ionicons
                    name={isSaved ? 'heart' : 'heart-outline'}
                    size={28}
                    color={isSaved ? Colors.error : Colors.border}
                  />
                </TouchableOpacity>
            </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={commonStyles.buttonGroup}>
          <TouchableOpacity style={[commonStyles.primaryButton, { marginTop: 5, marginBottom: -10}]} onPress={() => router.push('/recipes-folder/recipeList')}>
            <Text style={commonStyles.primaryButtonText}>Explore Recipes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[commonStyles.secondaryButton, { marginTop: 5 , marginBottom: -10}]} onPress={() => router.push('/recipes-folder/savedRecipes')}>
            <Text style={commonStyles.secondaryButtonText}>Saved Recipes</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[commonStyles.primaryButton, { marginTop: 5 , marginBottom: -5}]} 
            onPress={() => router.push('/recipes-folder/RecipeForm')}
          >
            <Text style={commonStyles.primaryButtonText}>Add Recipe</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

