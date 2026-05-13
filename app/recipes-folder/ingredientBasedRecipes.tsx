import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  Button,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalizeQuantity } from '../../utils/normalizeQuantity';
import { auth, db } from '../../backend/firebase';
import { doc, getDoc, onSnapshot, setDoc, collection, getDocs } from 'firebase/firestore';
import Colors from '../../constants/Colors';
import { commonStyles } from '../../constants/Styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchWithCache } from '../../utils/mealdb';
import { styles } from '../recipes-folder/styles/ingredientBasedRecipes.styles';

// interfata pentru reteta cu informatii de matching
interface Recipe {
  id: string;
  title: string;
  image: string | number;  // poate fi URL string sau numar imagine require
  matchPercentage: number;
  matchingIngredientsCount: number;
  totalIngredientsCount: number;
  missingIngredients: string[];
  isUserRecipe?: boolean;  // flag optional pentru identificarea retetelor utilizatorului
  area?: string;
}

// interfata pentru ingrediente cu cantitati si tipuri de masura
interface Ingredient {
  name: string;
  quantity: string;
  measurementType: 'weight' | 'volume' | 'pieces' | 'other';
}

// imaginile implicite pentru retete
const RECIPE_IMAGES = [
  require('../../assets/images/breakfast-ok.png'),
  require('../../assets/images/lunch-ok.png'),
  require('../../assets/images/dinner-ok.png'),
  require('../../assets/images/dessert-ok.png'),
  require('../../assets/images/meat-ok.png'),
];

// returneaza unitatea de afisare pentru tipul de masura
const getUnitDisplay = (type: 'weight' | 'volume' | 'pieces' | 'other'): string => {
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

// formateaza cantitatea pentru afisare cu unitatea corespunzatoare
const getQuantityDisplay = (details: { quantity: string; measurementType: string }) => {
  if (!details || !details.quantity) return '';
  if (details.measurementType === 'other') {
    return details.quantity;
  }
  const q = details.quantity.trim();
  if (
    q.endsWith('g') ||
    q.endsWith('ml') ||
    q.endsWith('pcs') ||
    q.toLowerCase() === 'to taste'
  ) {
    return q;
  }
  return `${q}${getUnitDisplay(details.measurementType as 'weight' | 'volume' | 'pieces' | 'other')}`;
};

// 20 de retete per pagina pentru paginare
const ITEMS_PER_PAGE = 20;

// extrage ingredientele dintr-o reteta din API, inclusiv "stock"
const extractIngredients = (meal: any): string[] => {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    if (ingredient && ingredient.trim() !== '') {
      ingredients.push(ingredient.trim());
    }
  }
  return ingredients;
};

export default function IngredientBasedRecipesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [ingredientDetails, setIngredientDetails] = useState<{ [key: string]: { quantity: string; measurementType: string } }>({});
  const [savedRecipes, setSavedRecipes] = useState<{ [key: string]: any }>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

  // initializeaza listeneri realtime pentru pantry si retete salvate
  useEffect(() => {
    // listener Firestore in timp real pentru pantry
    const user = auth.currentUser;
    if (!user) return;
    
    // seteaza listener pentru pantry
    const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
    const pantryUnsubscribe = onSnapshot(userIngredientsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // normalizeaza si filtreaza numele ingredientelor
        const ingredients = Object.keys(data)
          .map(item => item.trim().toLowerCase())
          .filter(item => !!item);
        setAvailableIngredients(ingredients);
        setIngredientDetails(data);
        fetchRecipes(ingredients);
      } else {
        setAvailableIngredients([]);
        setIngredientDetails({});
        setRecipes([]);
      }
    });

    // seteaza listener pentru retetele salvate
    const userFavoritesRef = doc(db, 'users', user.uid, 'favorites', 'recipes');
    const favoritesUnsubscribe = onSnapshot(userFavoritesRef, (docSnap) => {
      if (docSnap.exists()) {
        setSavedRecipes(docSnap.data());
      } else {
        setSavedRecipes({});
      }
    });

    return () => {
      pantryUnsubscribe();
      favoritesUnsubscribe();
    };
  }, []);

  // incarca retetele din API si firebase bazate pe ingredientele disponibile
  const fetchRecipes = async (ingredients: string[], pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // incarca retetele din API
      const allMeals: any[] = [];
      const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
      
      // foloseste chunk-uri pentru a preveni rate limiting
      const chunkSize = 5;
      for (let i = 0; i < letters.length; i += chunkSize) {
        const chunk = letters.slice(i, i + chunkSize);
        const promises = chunk.map(letter => 
          fetchWithCache(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`)
        );
        
        try {
          const results = await Promise.all(promises);
          results.forEach(data => {
            if (data?.meals) {
              allMeals.push(...data.meals);
            }
          });
          
          // adauga o mica intarziere intre chunk-uri pentru a preveni rate limiting
          if (i + chunkSize < letters.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error('Error fetching recipes chunk:', error);
        }
      }

      // proceseaza retetele din API
      const apiRecipes = allMeals.map(meal => {
        const recipeIngredients = extractIngredients(meal)
          .map(ing => ing.trim().toLowerCase());

        const matchingIngredients = recipeIngredients.filter(ing => 
          ingredients.includes(ing)
        );

        const missingIngredients = recipeIngredients.filter(ing => 
          !ingredients.includes(ing)
        );

        return {
          id: meal.idMeal,
          title: meal.strMeal,
          image: meal.strMealThumb,
          matchPercentage: Math.round((matchingIngredients.length / recipeIngredients.length) * 100),
          matchingIngredientsCount: matchingIngredients.length,
          totalIngredientsCount: recipeIngredients.length,
          missingIngredients,
          isUserRecipe: false,
          area: meal.strArea
        };
      });

      // incarca retetele utilizatorului
      const userRecipes: Recipe[] = [];
      const user = auth.currentUser;
      
      if (user) {
        try {
          const recipesRef = collection(db, 'recipes');
          const recipesSnapshot = await getDocs(recipesRef);
          
          recipesSnapshot.forEach((doc) => {
            const recipe = doc.data();
            
            const recipeIngredients = recipe.ingredients.map((ing: { name: string }) => 
              ing.name.trim().toLowerCase()
            );

            const matchingIngredients = recipeIngredients.filter((ing: string) => 
              ingredients.includes(ing)
            );

            const missingIngredients = recipeIngredients.filter((ing: string) => 
              !ingredients.includes(ing)
            );

            userRecipes.push({
              id: doc.id,
              title: recipe.title,
              image: recipe.uploadedImage ? recipe.uploadedImage : (recipe.imageIndex !== undefined ? RECIPE_IMAGES[recipe.imageIndex] : RECIPE_IMAGES[0]),
              matchPercentage: Math.round((matchingIngredients.length / recipeIngredients.length) * 100),
              matchingIngredientsCount: matchingIngredients.length,
              totalIngredientsCount: recipeIngredients.length,
              missingIngredients,
              isUserRecipe: true,
              area: recipe.area
            });
          });
        } catch (error) {
          console.error('Error fetching user recipes:', error);
        }
      }

      // combina si sorteaza toate retetele
      let allRecipesData: Recipe[] = [];
      if (ingredients.length > 0) {
        allRecipesData = [...apiRecipes, ...userRecipes]
          .filter(r => r.matchPercentage > 0)
          .sort((a, b) => b.matchPercentage - a.matchPercentage);
      }
      setAllRecipes(allRecipesData);

      // aplica paginarea
      const start = (pageNum - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const paginatedRecipes = allRecipesData.slice(start, end);
      setHasMore(end < allRecipesData.length);

      if (append) {
        setRecipes(prev => [...prev, ...paginatedRecipes]);
      } else {
        setRecipes(paginatedRecipes);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setError('Failed to load recipes. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // incarca mai multe retete pentru paginare
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchRecipes(availableIngredients, nextPage, true);
    }
  };

  // adauga sau sterge reteta din favorite
  const toggleSaveRecipe = async (recipe: Recipe) => {
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
        // sterge reteta din favorite
        const { [recipe.id]: removed, ...rest } = currentData;
        updatedData = rest;
      } else {
        // adauga reteta in favorite
        updatedData = {
          ...currentData,
          [recipe.id]: {
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            savedAt: new Date().toISOString()
          }
        };
      }
      await setDoc(userFavoritesRef, updatedData);
    } catch (error) {
      console.error('Error toggling save:', error);
      alert('Failed to save recipe. Please try again.');
    }
  };

  // renderizeaza un element din lista de retete
  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    const isSaved = savedRecipes[item.id];
    
    // obtine sursa corecta pentru imagine bazata pe tipul retetei
    const getImageSource = () => {
      if (typeof item.image === 'number') {
        return item.image; // imagine din require()
      }
      return { uri: item.image }; // URL string
    };

    return (
      <TouchableOpacity
        style={styles.recipeCard}
        onPress={() => {
          router.push(item.isUserRecipe 
            ? `/recipes-folder/recipeMatch?id=${item.id}`
            : `/recipes-folder/recipeMatch?id=${item.id}`
          );
        }}
      >
        {item.area && (
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
            <Text style={{ color: Colors.primaryDark, fontWeight: 'bold', fontSize: 12, textTransform: 'capitalize' }}>{item.area}</Text>
          </View>
        )}
        <Image 
          source={getImageSource()} 
          style={styles.recipeImage}
          defaultSource={require('../../assets/images/default-recipe.png')}
        />
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
          <View style={styles.matchContainer}>
            <Ionicons 
              name="checkmark-circle" 
              size={20} 
              color={item.matchPercentage >= 80 ? Colors.owned : Colors.medium} 
            />
            <Text style={[
              styles.matchPercentage,
              { color: item.matchPercentage >= 80 ? Colors.owned : Colors.medium }
            ]}>
              {item.matchPercentage}% Match ({item.matchingIngredientsCount}/{item.totalIngredientsCount} ingredients)
            </Text>
          </View>
          {item.missingIngredients.length > 0 && (
            <Text style={styles.missingText}>
              Missing {item.missingIngredients.length} ingredients
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={commonStyles.heartButton}
          onPress={() => toggleSaveRecipe(item)}
        >
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={28}
            color={isSaved ? Colors.error : Colors.border}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // afiseaza loading screen
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text>Loading recipes...</Text>
      </SafeAreaView>
    );
  }

  // afiseaza error screen
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.pantryButton}
          onPress={() => router.push('/(tabs)/pantry')}
        >
          <Text style={styles.pantryButtonText}>Go to Pantry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Recipe Matches',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.textDark },
          headerTitleStyle: { color: Colors.background },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={Colors.background} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Recipes You Can Make</Text>
          <Text style={styles.subtitle}>
            Based on {availableIngredients.length} ingredients in your pantry
          </Text>
        </View>

        <TouchableOpacity style={styles.reviewButton} onPress={() => setReviewModalVisible(true)}>
          <Text style={styles.reviewButtonText}>Review My Pantry </Text>
        </TouchableOpacity>

        {/* modalul pentru revizuirea pantry-ului */}
        <Modal
          visible={reviewModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>My Ingredients</Text>
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                {availableIngredients.length === 0 ? (
                  <Text style={styles.emptyText}>No ingredients in your pantry.</Text>
                ) : (
                  [...availableIngredients].sort((a, b) => a.localeCompare(b)).map((ing, idx) => {
                    const details = ingredientDetails[ing.toLowerCase()];
                    return (
                      <View key={idx} style={styles.modalIngredientRow}>
                        <Text style={styles.modalIngredientName}>{ing}</Text>
                        <View style={styles.modalIngredientQtyBox}>
                          <Text style={styles.modalIngredientQty}>{details ? getQuantityDisplay(details) : 'N/A'}</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity style={styles.modalOkButton} onPress={() => setReviewModalVisible(false)}>
                  <Text style={styles.modalOkButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalModifyButton} onPress={() => {
                  setReviewModalVisible(false);
                  router.push('/pantry-folder/myIngredients');
                }}>
                  <Text style={styles.modalModifyButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* lista de retete cu paginare infinita */}
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRecipeItem}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 40 }]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => 
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
        />
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
} 