import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
} from 'react-native';
import { auth, db } from '../../backend/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import searchIcon from '../../assets/images/search-ok.png';
import Colors from '../../constants/Colors';
import { commonStyles } from '../../constants/Styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import alphaIcon from '../../assets/images/alpha-ok.png';
import oldestIcon from '../../assets/images/oldest-ok.png';
import newestIcon from '../../assets/images/newest-ok.png';
import { Ionicons } from '@expo/vector-icons';
import { DietaryPreferences, checkDietaryConflicts, loadDietaryPreferencesRealtime } from '../../utils/dietaryPreferences';
import { fetchWithCache } from '../../utils/mealdb';
import { styles } from '../recipes-folder/styles/savedRecipes.styles';

const SORT_ICONS = {
  alpha: alphaIcon,
  asc: oldestIcon,
  desc: newestIcon,
};

const ITEMS_PER_PAGE = 20;

export default function SavedRecipesScreen() {
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<'alpha' | 'asc' | 'desc'>('desc');
  const [bannedIngredients, setBannedIngredients] = useState<string[]>([]);
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreferences | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const extractIngredients = (meal: any) => {
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      if (ingredient) ingredients.push(ingredient);
    }
    return ingredients;
  };

  const fetchIngredientsForSaved = async (recipes: any[]) => {
    const updated = [];
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const recipesToProcess = recipes.slice(startIndex, endIndex);

    for (const recipe of recipesToProcess) {
      if (recipe.ingredients) {
        updated.push(recipe);
        continue;
      }

      try {
        const apiUrl = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipe.id}`;
        const data = await fetchWithCache(apiUrl);

        if (data?.meals?.length) {
          const meal = data.meals[0];
          updated.push({
            ...recipe,
            ingredients: extractIngredients(meal),
          });
        } else {
          updated.push(recipe);
        }
      } catch (error) {
        console.error(`Error loading ingredients for recipe ${recipe.id}:`, error);
        updated.push(recipe);
      }
    }

    return updated;
  };

  const loadSavedRecipes = async (pageNum: number = 1, append: boolean = false) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const userFavoritesRef = doc(db, 'users', user.uid, 'favorites', 'recipes');
      
      // seteaza listener in timp real pentru retetele salvate
      const unsubscribe = onSnapshot(userFavoritesRef, async (favoritesDoc) => {
        try {
      if (favoritesDoc.exists()) {
        const data = favoritesDoc.data();
        const allRecipes = Object.values(data);
        
        // sorteaza retetele
        const sortedRecipes = [...allRecipes].sort((a, b) => {
          switch (sortMode) {
            case 'alpha':
              return a.title.localeCompare(b.title);
            case 'asc':
              return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
            case 'desc':
              return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
            default:
              return 0;
          }
        });

        // aplica paginarea
        const start = (pageNum - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const paginatedRecipes = sortedRecipes.slice(start, end);
        
        setHasMore(end < sortedRecipes.length);

        // incarca ingredientele pentru pagina curenta
        const enrichedRecipes = await fetchIngredientsForSaved(paginatedRecipes);

        if (append) {
          setSavedRecipes(prev => [...prev, ...enrichedRecipes]);
          setFilteredRecipes(prev => [...prev, ...enrichedRecipes]);
        } else {
          setSavedRecipes(enrichedRecipes);
          setFilteredRecipes(enrichedRecipes);
        }
          } else {
            setSavedRecipes([]);
            setFilteredRecipes([]);
            setHasMore(false);
          }
        } catch (error) {
          console.error('Error processing saved recipes:', error);
          Alert.alert('Error', 'Failed to load saved recipes');
        } finally {
          setLoading(false);
          setLoadingMore(false);
        }
      }, (error) => {
        console.error('Error listening to saved recipes:', error);
        Alert.alert('Error', 'Failed to load saved recipes');
        setLoading(false);
        setLoadingMore(false);
      });

      // returneaza functia de cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up saved recipes listener:', error);
      Alert.alert('Error', 'Failed to load saved recipes');
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadSavedRecipes(nextPage, true);
    }
  };

  const loadAvailableIngredients = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      const ingredientsDoc = await getDoc(userIngredientsRef);
      
      if (ingredientsDoc.exists()) {
        const data = ingredientsDoc.data();
        setAvailableIngredients(Object.keys(data).map(i => i.toLowerCase()));
      } else {
        setAvailableIngredients([]);
      }
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const loadBannedIngredients = async (): Promise<(() => void) | undefined> => {
    const user = auth.currentUser;
    if (!user) return undefined;

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
      return undefined;
    }
  };

  const deleteRecipe = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const userFavoritesRef = doc(db, 'users', user.uid, 'favorites', 'recipes');
      const favoritesDoc = await getDoc(userFavoritesRef);
      if (favoritesDoc.exists()) {
        const currentData = favoritesDoc.data();
        const { [id]: removed, ...rest } = currentData;
        await setDoc(userFavoritesRef, rest);
        const updated = savedRecipes.filter((r) => r.id !== id);
        setSavedRecipes(updated);
        setFilteredRecipes(updated.filter((r) => r.title.toLowerCase().includes(searchText.toLowerCase())));
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      Alert.alert('Error', 'Failed to delete recipe');
    }
  };

  const deleteAllRecipes = async () => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert('Confirmation', 'Are you sure you want to delete all saved recipes?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete all', style: 'destructive', onPress: async () => {
          try {
            const userFavoritesRef = doc(db, 'users', user.uid, 'favorites', 'recipes');
            await setDoc(userFavoritesRef, {});
            setSavedRecipes([]);
            setFilteredRecipes([]);
          } catch (error) {
            console.error('Error deleting all recipes:', error);
            Alert.alert('Error', 'Failed to delete all recipes');
          }
        }
      },
    ]);
  };

  const sortRecipes = (recipes: any[], mode: 'alpha' | 'asc' | 'desc') => {
    const sortByAsc = [...recipes].sort(
      (a, b) => new Date(a.savedAt || 0).getTime() - new Date(b.savedAt || 0).getTime()
    );
  
    switch (mode) {
      case 'alpha':
        return [...recipes].sort((a, b) => a.title.localeCompare(b.title));
      case 'asc':
        return sortByAsc;
      case 'desc':
      default:
        return [...sortByAsc].reverse();
    }
  };

  useEffect(() => {
    let unsubscribeRecipes: (() => void) | undefined;
    let unsubscribeBanned: (() => void) | undefined;
    let unsubscribeDietary: (() => void) | undefined;
    
    const initializeData = async () => {
      try {
        // incarca retetele salvate cu listener in timp real
        const recipesCleanup = await loadSavedRecipes();
        unsubscribeRecipes = recipesCleanup;
        
        // seteaza listener in timp real pentru ingredientele interzise
        const bannedCleanup = await loadBannedIngredients();
        unsubscribeBanned = bannedCleanup;
        
        // incarca alte date
    loadAvailableIngredients();
        
        // seteaza listener in timp real pentru preferintele alimentare
        const dietaryCleanup = await loadDietaryPreferencesRealtime((prefs) => {
          setDietaryPreferences(prefs);
        });
        unsubscribeDietary = dietaryCleanup;
      } catch (error) {
        console.error('Error initializing data:', error);
        Alert.alert('Error', 'Failed to load data');
      }
    };

    initializeData();

    // functia de cleanup
    return () => {
      if (unsubscribeRecipes) {
        unsubscribeRecipes();
      }
      if (unsubscribeBanned) {
        unsubscribeBanned();
      }
      if (unsubscribeDietary) {
        unsubscribeDietary();
      }
    };
  }, []);

  useEffect(() => {
    let filtered = savedRecipes;
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      const startsWith = savedRecipes.filter(recipe => 
        recipe.title.toLowerCase().startsWith(lowerSearch)
      );
      const contains = savedRecipes.filter(recipe =>
        !recipe.title.toLowerCase().startsWith(lowerSearch) &&
        recipe.title.toLowerCase().includes(lowerSearch)
      );
      startsWith.sort((a, b) => a.title.localeCompare(b.title));
      contains.sort((a, b) => a.title.localeCompare(b.title));
      filtered = [...startsWith, ...contains];
    }
    // aplica modul de sortare curent la retetele filtrate
    setFilteredRecipes(sortRecipes(filtered, sortMode));
  }, [searchText, savedRecipes, sortMode, bannedIngredients]);

  const getMissingIngredients = (all: string[]) => {
    return all.filter((ing) => !availableIngredients.includes(ing.toLowerCase()));
  };

  const toggleSortMode = () => {
    const nextMode = sortMode === 'desc' ? 'asc' : sortMode === 'asc' ? 'alpha' : 'desc';
    setSortMode(nextMode);
  };

  const isIngredientBanned = (ingredient: string) => {
    return bannedIngredients.includes(ingredient.toLowerCase());
  };

  const getIngredientStyle = (ingredient: string | undefined) => {
    if (!ingredient) {
      return [styles.ingredientText];
    }

    const isAvailable = availableIngredients.includes(ingredient.toLowerCase());
    const isBanned = isIngredientBanned(ingredient);
    const hasDietaryConflict = dietaryPreferences && checkDietaryConflicts(ingredient, dietaryPreferences).length > 0;

    if (hasDietaryConflict) {
      return [styles.ingredientText, styles.ingredientMissing, { color: Colors.error, backgroundColor: 'transparent' }];
    }
    if (isBanned && isAvailable) {
      return [styles.ingredientText, styles.ingredientAvailable];
    } else if (isBanned) {
      return [styles.ingredientText, styles.bannedIngredientName];
    } else if (isAvailable) {
      return [styles.ingredientText, styles.ingredientAvailable];
    } else {
      return [styles.ingredientText, styles.ingredientMissing];
    }
  };

  const renderRecipe = ({ item }: { item: any }) => {
    const missing = getMissingIngredients(item.ingredients || []);
    
    // gestioneaza diferite formate de imagini
    const getImageSource = () => {
      if (!item.image) {
        return require('../../assets/images/default-recipe.png');
      }
      if (typeof item.image === 'number') {
        const RECIPE_IMAGES = [
          require('../../assets/images/breakfast-ok.png'),
          require('../../assets/images/lunch-ok.png'),
          require('../../assets/images/dinner-ok.png'),
          require('../../assets/images/dessert-ok.png'),
          require('../../assets/images/meat-ok.png'),
        ];
        return RECIPE_IMAGES[item.image] || RECIPE_IMAGES[0];
      }
      return { uri: item.image };
    };

    return (
      <View style={styles.recipeCard}>
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: '/recipes-folder/recipeMatch', params: { id: item.id.toString() } })
          }
        >
          <Image 
            source={getImageSource()} 
            style={styles.recipeImage}
            defaultSource={require('../../assets/images/default-recipe.png')}
          />
          <View style={styles.recipeContent}>
            <Text style={styles.recipeTitle}>{item.title}</Text>
            {item.ingredients && item.ingredients.length > 0 && (
              <View style={styles.ingredientsBox}>
                <View style={styles.ingredientsGrid}>
                  <View style={styles.ingredientColumn}>
                    {(() => {
                      // mai intai, elimina ingredientele duplicate
                      const uniqueIngredients = Array.from(new Set(item.ingredients)) as string[];
                      const left: string[] = [];
                      const right: string[] = [];
                      uniqueIngredients.forEach((ing: string, idx: number) => {
                        if (idx % 2 === 0) left.push(ing);
                        else right.push(ing);
                      });
                      const maxLen = Math.max(left.length, right.length);
                      return Array.from({ length: maxLen }).map((_, idx) => (
                        <Text
                          key={`left-${idx}`}
                          style={getIngredientStyle(left[idx])}
                        >
                          {left[idx] ? `• ${left[idx].toLowerCase()}` : ''}
                          {left[idx] && dietaryPreferences && checkDietaryConflicts(left[idx], dietaryPreferences).length > 0 && (
                            <Ionicons name="help-circle" size={16} color={Colors.error} style={styles.warningIcon} />
                          )}
                          {left[idx] && isIngredientBanned(left[idx]) && (
                            <Ionicons name="close-circle" size={16} color={Colors.pinkicon} style={styles.warningIcon} />
                          )}
                        </Text>
                      ));
                    })()}
                  </View>
                  <View style={styles.ingredientColumn}>
                    {(() => {
                      // foloseste aceeasi lista de ingrediente deduplicate
                      const uniqueIngredients = Array.from(new Set(item.ingredients)) as string[];
                      const left: string[] = [];
                      const right: string[] = [];
                      uniqueIngredients.forEach((ing: string, idx: number) => {
                        if (idx % 2 === 0) left.push(ing);
                        else right.push(ing);
                      });
                      const maxLen = Math.max(left.length, right.length);
                      return Array.from({ length: maxLen }).map((_, idx) => (
                        <Text
                          key={`right-${idx}`}
                          style={getIngredientStyle(right[idx])}
                        >
                          {right[idx] ? `• ${right[idx].toLowerCase()}` : ''}
                          {right[idx] && dietaryPreferences && checkDietaryConflicts(right[idx], dietaryPreferences).length > 0 && (
                            <Ionicons name="help-circle" size={16} color={Colors.error} style={styles.warningIcon} />
                          )}
                          {right[idx] && isIngredientBanned(right[idx]) && (
                            <Ionicons name="close-circle" size={16} color={Colors.pinkicon} style={styles.warningIcon} />
                          )}
                        </Text>
                      ));
                    })()}
                  </View>
                </View>
              </View>
            )}
            {missing.length === 0 && (
              <Text style={styles.allAvailable}>You have all ingredients!</Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={commonStyles.heartButton}
          onPress={() => {
            Alert.alert(
              'Remove from Favorites',
              'Are you sure you want to remove this recipe from your favorites?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => deleteRecipe(item.id)
                }
              ]
            );
          }}
        >
          <Ionicons
            name="heart"
            size={28}
            color={Colors.error}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text>Loading saved recipes...</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <View style={styles.content}>
        <Text style={[commonStyles.title, { marginTop: -20}]}>
            Favorite Recipes ({savedRecipes.length})
          </Text>

          <View style={commonStyles.searchContainer}>
            <View style={commonStyles.searchBarContainer}>
              <Image source={searchIcon} style={commonStyles.searchIcon} />
              <TextInput
                style={commonStyles.searchInput}
                placeholder="Search for a saved recipe..."
                placeholderTextColor={Colors.border}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
            <TouchableOpacity style={commonStyles.sortButton} onPress={toggleSortMode}>
              <View style={styles.sortIconContainer}>
                <Image source={SORT_ICONS[sortMode]} style={commonStyles.sortIconZoomed} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.sortingInfoContainer}>
            <Text style={styles.sortingInfoText}>
              Sorting by: {
                sortMode === 'alpha' ? 'alphabetical' :
                sortMode === 'asc' ? 'oldest first' :
                'newest first'
              }
            </Text>
          </View>

          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No saved recipes found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecipes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderRecipe}
              contentContainerStyle={[styles.listContainer, { paddingBottom: 40 }]}
              keyboardShouldPersistTaps="handled"
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
          )}
        </View>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
}
