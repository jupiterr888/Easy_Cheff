import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { doc, setDoc, deleteDoc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import searchIcon from '../../assets/images/search-ok.png';
import { Ionicons } from '@expo/vector-icons';
import { DietaryPreferences, checkDietaryConflicts, loadDietaryPreferencesRealtime } from '../../utils/dietaryPreferences';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '../../constants/Styles';
import { deleteRecipe } from '../../services/recipeService';
import { styles } from '../recipes-folder/styles/recipeList.styles';
import { fetchAllMealDBRecipes } from '../../utils/mealdb';

// imaginile implicite pentru retete
const RECIPE_IMAGES = [
  require('../../assets/images/breakfast-ok.png'),
  require('../../assets/images/lunch-ok.png'),
  require('../../assets/images/dinner-ok.png'),
  require('../../assets/images/dessert-ok.png'),
  require('../../assets/images/meat-ok.png'),
];

// helper pentru capitalizarea categoriei pentru afisare
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ecranul principal pentru lista de retete cu filtrare si cautare
export default function RecipesListScreen() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreferences | null>(null);
  const [bannedIngredients, setBannedIngredients] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [allAreas, setAllAreas] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const router = useRouter();

  const ITEMS_PER_PAGE = 20;

  // extrage ingredientele dintr-o reteta din API
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

  // incarca retetele din API si Firebase cu listener realtime
  const loadRecipes = async () => {
    setLoading(true);
    try {
      // incarca toate retetele din TheMealDB API
      const apiRecipes = await fetchAllMealDBRecipes();

      // seteaza listener in timp real pentru retetele generate de utilizator din firestore
      const recipesRef = collection(db, 'recipes');
      
      // creeaza un map pentru a stoca datele utilizatorului
      const userDataMap = new Map<string, string>();
      
      // helper pentru a incarca displayName din firestore
      const getDisplayName = async (authorId: string) => {
        if (userDataMap.has(authorId)) return userDataMap.get(authorId);
        try {
          const userDoc = await getDoc(doc(db, 'users', authorId));
          if (userDoc.exists() && userDoc.data().displayName) {
            userDataMap.set(authorId, userDoc.data().displayName);
            return userDoc.data().displayName;
          }
        } catch {}
        userDataMap.set(authorId, authorId);
        return authorId;
      };

      // seteaza listener in timp real
      const unsubscribe = onSnapshot(recipesRef, async (querySnapshot) => {
        try {
      // proceseaza retetele utilizatorului si colecteaza id-urile unice pt autor
      const userRecipes = await Promise.all(querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const authorId = data.authorId as string;
            let authorName = data.authorName;
            // daca authorName lipseste sau e un UID, incarca displayName live
            if (!authorName || authorName === authorId) {
              authorName = await getDisplayName(authorId);
          }
        return {
          id: docSnapshot.id,
          title: data.title,
          image: data.uploadedImage ? data.uploadedImage : (data.imageIndex !== undefined ? RECIPE_IMAGES[data.imageIndex] : RECIPE_IMAGES[0]),
          ingredients: Array.isArray(data.ingredients)
            ? data.ingredients.map((ing: any) => (typeof ing === 'string' ? ing : ing.name))
            : [],
          isUserGenerated: true,
          category: data.category || 'Other',
              authorName,
          authorId: authorId,
          area: data.area || '',
        };
      }));

      // combina retetele din api si ale utilizatorului, apoi sorteaza alfabetic
      const allRecipes = [...apiRecipes, ...userRecipes].sort((a, b) => a.title.localeCompare(b.title));
      setRecipes(allRecipes);
      setFilteredRecipes(allRecipes);
      setHasMore(false); // nu e nevoie de paginare
        } catch (error) {
          console.error('Error processing recipes:', error);
        }
      }, (error) => {
        console.error('Error listening to recipes:', error);
      });

      // functia de cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // incarca id-urile retetelor salvate din favorite
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

  // seteaza listener realtime pentru ingredientele interzise
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

  // adauga sau sterge reteta din favorite
  const toggleSaveRecipe = async (recipe: any) => {
    const user = auth.currentUser;
    if (!user) return;

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
        await setDoc(userFavoritesRef, updatedData);
        setSavedIds(prev => prev.filter(id => id !== recipe.id));
      } else {
        // adauga reteta in favorite
        updatedData = {
          ...currentData,
          [recipe.id]: {
            id: recipe.id,
            title: recipe.title,
            image: recipe.isUserGenerated ? recipe.image : recipe.image,
            savedAt: new Date().toISOString()
          }
        };
        await setDoc(userFavoritesRef, updatedData);
        setSavedIds(prev => [...prev, recipe.id]);
      }
    } catch (error) {
      console.error('Error toggling saved recipe:', error);
      Alert.alert('Error', 'Failed to update saved recipes');
    }
  };

  // verifica daca reteta are conflicte cu preferintele alimentare
  const recipeHasConflict = (recipe: any) => {
    if (!dietaryPreferences || !recipe.ingredients) return false;
    return recipe.ingredients.some((ingredient: any) => {
      const ingredientName = typeof ingredient === 'string' 
        ? ingredient 
        : ingredient?.name;
      if (!ingredientName) return false;
      return checkDietaryConflicts(ingredientName, dietaryPreferences).length > 0;
    });
  };

  // verifica daca reteta contine ingrediente interzise
  const recipeHasBannedIngredients = (recipe: any) => {
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) return false;
    return recipe.ingredients.some((ingredient: any) => {
      const ingredientName = typeof ingredient === 'string' 
        ? ingredient 
        : ingredient?.name;
      if (!ingredientName) return false;
      return bannedIngredients.includes(ingredientName.toLowerCase());
    });
  };

  // afiseaza conflictele alimentare pentru o reteta
  const showDietaryConflicts = (recipe: any) => {
    if (!dietaryPreferences || !recipe.ingredients) return;
    
    const conflicts = recipe.ingredients
      .map((ingredient: any) => {
        const ingredientName = typeof ingredient === 'string' 
          ? ingredient 
          : ingredient?.name;
        if (!ingredientName) return null;
        const conflicts = checkDietaryConflicts(ingredientName, dietaryPreferences);
        return conflicts.length > 0 ? `${ingredientName}: ${conflicts.join(', ')}` : null;
      })
      .filter(Boolean);

    if (conflicts.length > 0) {
      Alert.alert(
        'Dietary Conflicts Alert',
        `This recipe contains ingredients that conflict with your dietary preferences:\n\n${conflicts.join('\n')}`,
        [{ text: 'OK' }]
      );
    }
  };

  // afiseaza ingredientele interzise pentru o reteta
  const showBannedIngredients = (recipe: any) => {
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) return;
    
    const banned = recipe.ingredients
      .map((ingredient: any) => {
        const ingredientName = typeof ingredient === 'string'
          ? ingredient
          : ingredient?.name;
        if (!ingredientName) return null;
        return bannedIngredients.includes(ingredientName.toLowerCase())
          ? ingredientName
          : null;
      })
      .filter(Boolean);

    if (banned.length > 0) {
      Alert.alert(
        'Banned Ingredients Alert',
        `This recipe contains ingredients you have banned:\n\n${banned.join('\n')}`,
        [{ text: 'OK' }]
      );
    }
  };

  // sterge o reteta creata de utilizator
  const handleDeleteRecipe = async (recipe: any) => {
    if (!recipe.isUserGenerated) return;
    
    const user = auth.currentUser;
    if (!user) return;

    // verifica daca utilizatorul este autorul
    if (recipe.authorId !== user.uid) {
      Alert.alert('Error', 'You can only delete recipes that you created');
      return;
    }

    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe(recipe.id);
              // sterge din starea locala
              setRecipes(prev => prev.filter(r => r.id !== recipe.id));
              setFilteredRecipes(prev => prev.filter(r => r.id !== recipe.id));
              Alert.alert('Success', 'Recipe deleted successfully');
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Alert.alert('Error', 'Failed to delete recipe');
            }
          }
        }
      ]
    );
  };

  // initializeaza toate datele la montarea componentei
  useEffect(() => {
    let unsubscribeRecipes: (() => void) | undefined;
    let unsubscribeBanned: (() => void) | undefined;
    let unsubscribeDietary: (() => void) | undefined;
    
    const initializeData = async () => {
      try {
        // seteaza listener in timp real pentru preferintele alimentare
        const dietaryCleanup = await loadDietaryPreferencesRealtime((prefs) => {
        setDietaryPreferences(prefs);
        });
        unsubscribeDietary = dietaryCleanup;
        
        // seteaza listener in timp real pentru ingredientele interzise
        const bannedCleanup = await loadBannedIngredients();
        unsubscribeBanned = bannedCleanup;
        
        // incarca retetele cu listener in timp real
        const recipesCleanup = await loadRecipes();
        unsubscribeRecipes = recipesCleanup;
        
        await loadSavedIds();
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
    // extrage zonele unice din retete
    const areasSet = new Set<string>();
    const categoriesSet = new Set<string>();
    recipes.forEach(recipe => {
      if (recipe.area) areasSet.add(recipe.area);
      if (recipe.category) {
        const cat = recipe.category.trim().toLowerCase();
        if (cat !== 'breakfast' && cat !== 'lunch' && cat !== 'dinner') {
          categoriesSet.add(cat);
        }
      }
    });
    setAllAreas(['All', ...Array.from(areasSet).sort((a, b) => a.localeCompare(b))]);
    setAllCategories(['All', ...Array.from(categoriesSet).sort((a, b) => a.localeCompare(b))]);
  }, [recipes]);

  // filtreaza retetele
  useEffect(() => {
    let filtered: any[] = [];
    const search = searchText.trim().toLowerCase();
    if (search) {

      const prefixMatches = recipes.filter(recipe =>
        recipe.title.toLowerCase().startsWith(search)
      );

      const containsMatches = recipes.filter(recipe =>
        !recipe.title.toLowerCase().startsWith(search) &&
        recipe.title.toLowerCase().includes(search)
      );
      filtered = [...prefixMatches, ...containsMatches];
    } else {
      filtered = recipes;
    }

    // filtru pentru zona
    if (selectedArea && selectedArea !== 'All') {
      filtered = filtered.filter(recipe => recipe.area === selectedArea);
    }
    // filtru pentru categorie
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(recipe => (recipe.category || '').trim().toLowerCase() === selectedCategory);
    }

    // filtru pentru tipul de masa cu mapping de categorii
    if (selectedMealType) {
      const categoryMap: { [key: string]: string[] } = {
        breakfast: [
          'Breakfast',
          'breakfast',
          'Starter',
          'Dessert',
          'Miscellaneous',
          'Side',
          'Vegetarian',
          'Vegan'
        ],
        lunch: [
          'Lunch',
          'lunch',
          'Side',
          'Miscellaneous',
          'Starter',
          'Vegetarian',
          'Vegan',
          'Pasta',
          'Seafood',
          'Chicken',
          'Beef'
        ],
        dinner: [
          'Dinner',
          'dinner',
          'Main Course',
          'Beef',
          'Chicken',
          'Lamb',
          'Pasta',
          'Pork',
          'Seafood',
          'Vegetarian',
          'Vegan',
          'Side',
          'Miscellaneous'
        ]
      };

      filtered = filtered.filter((recipe) =>
        categoryMap[selectedMealType]?.includes(recipe.category)
      );
    }

    setFilteredRecipes(filtered);
  }, [searchText, recipes, selectedMealType, selectedArea, selectedCategory, bannedIngredients]);

  // randare element din lista de retete
  const renderRecipe = ({ item }: { item: any }) => {
    const isSaved = savedIds.includes(item.id);
    const hasConflict = recipeHasConflict(item);
    const hasBanned = recipeHasBannedIngredients(item);
    const canDelete = item.isUserGenerated && auth.currentUser?.uid === item.authorId;

    return (
      <View style={[
        styles.recipeCard,
        (hasConflict || hasBanned) && styles.conflictingItem
      ]}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/recipes-folder/recipeMatch', params: { id: item.id } })}
        >
          {(item.area) && (
            <View style={styles.areaBadge}>
              <Text style={styles.areaBadgeText}>{item.area}</Text>
            </View>
          )}
          <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={styles.recipeImage} />
          <View style={styles.recipeContent}>
            <View style={styles.titleContainer}>
              <Text style={[
                styles.recipeTitle,
                (hasConflict || hasBanned) && styles.conflictingText
              ]}>
                {item.title}
              </Text>
              <View style={styles.iconContainer}>
                {(hasConflict || hasBanned) && (
                  <View style={styles.warningIcons}>
                    {hasConflict && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          showDietaryConflicts(item);
                        }}
                      >
                        <Ionicons
                          name="alert-circle"
                          size={24}
                          color={Colors.error}
                          style={styles.conflictIcon}
                        />
                      </TouchableOpacity>
                    )}
                    {hasBanned && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          showBannedIngredients(item);
                        }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color={Colors.pinkicon}
                          style={styles.conflictIcon}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {canDelete && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteRecipe(item);
                      }}
                      style={styles.deleteButton}
                    >
                      <Ionicons name="trash-outline" size={24} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            {item.isUserGenerated && (
              <View style={styles.userGeneratedBadge}>
                <Ionicons name="person" size={14} color={Colors.background} />
                <Text style={styles.userGeneratedText}>
                  {item.authorName || 'User Recipe'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
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
      </View>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <View style={styles.content}>
          <Text style={styles.title}>All Recipes</Text>

          <View style={styles.searchContainer}>
            <View style={styles.searchBarContainer}>
              <Image source={searchIcon} style={styles.searchIcon} />
              <TextInput
                style={styles.searchBar}
                placeholder="Search recipes..."
                placeholderTextColor={Colors.bar}
                value={searchText}
                onChangeText={setSearchText}
                returnKeyType="search"
              />
          <TouchableOpacity
                style={styles.inlineFilterButton}
            onPress={() => setFilterModalVisible(true)}
          >
                <Ionicons name="filter" size={22} color={Colors.primaryDark} />
          </TouchableOpacity>
            </View>
          </View>

          {/* modalul unificat pentru filtrare */}
          <Modal
            visible={filterModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setFilterModalVisible(false)}
          >
            <View style={styles.filterModalOverlay}>
              <View style={styles.filterModalContent}>
                <Text style={styles.filterModalHeader}>Filter Recipes</Text>
                <Text style={[styles.filterModalSectionTitle, { marginTop: 0 }]}>Area</Text>
                {(() => {
                  // imparte zonele in doua randuri
                  const rowCount = 2;
                  const chunkedAreas: string[][] = [[], []];
                  allAreas.forEach((area, idx) => {
                    chunkedAreas[idx % rowCount].push(area);
                  });
                  return (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
                      <View style={{ flexDirection: 'column' }}>
                        {chunkedAreas.map((row, rowIdx) => (
                          <View key={rowIdx} style={{ flexDirection: 'row', marginBottom: rowIdx === 0 ? 6 : 0 }}>
                            {row.map((area) => (
                              <TouchableOpacity
                                key={area}
                                style={[
                                  styles.filterChip,
                                  selectedArea === area && styles.filterChipSelected
                                ]}
                                onPress={() => setSelectedArea(area)}
                              >
                                <Text style={selectedArea === area ? styles.filterChipTextSelected : styles.filterChipText}>
                                  {area === 'All' ? 'All' : capitalize(area)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  );
                })()}
                {/* sectiunea pentru categorie */}
                <Text style={styles.filterModalSectionTitle}>Category</Text>
                {(() => {
                  // imparte categoriile in doua randuri
                  const rowCount = 2;
                  const chunkedCategories: string[][] = [[], []];
                  allCategories.forEach((category, idx) => {
                    chunkedCategories[idx % rowCount].push(category);
                  });
                  return (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'column' }}>
                        {chunkedCategories.map((row, rowIdx) => (
                          <View key={rowIdx} style={{ flexDirection: 'row', marginBottom: rowIdx === 0 ? 6 : 0 }}>
                            {row.map((category) => (
                              <TouchableOpacity
                                key={category}
                                style={[
                                  styles.filterChip,
                                  selectedCategory === category && styles.filterChipSelected
                                ]}
                                onPress={() => setSelectedCategory(category)}
                              >
                                <Text style={selectedCategory === category ? styles.filterChipTextSelected : styles.filterChipText}>
                                  {category === 'All' ? 'All' : capitalize(category)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  );
                })()}
                <TouchableOpacity
                  style={{ marginTop: 16, alignSelf: 'center' }}
                  onPress={() => setFilterModalVisible(false)}
                >
                  <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 16 }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* butoanele de filtrare pentru tipul de masa */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedMealType === 'breakfast' && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedMealType(selectedMealType === 'breakfast' ? null : 'breakfast')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedMealType === 'breakfast' && styles.filterButtonTextActive,
              ]}>Breakfast</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedMealType === 'lunch' && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedMealType(selectedMealType === 'lunch' ? null : 'lunch')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedMealType === 'lunch' && styles.filterButtonTextActive,
              ]}>Lunch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedMealType === 'dinner' && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedMealType(selectedMealType === 'dinner' ? null : 'dinner')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedMealType === 'dinner' && styles.filterButtonTextActive,
              ]}>Dinner</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading recipes...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecipes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderRecipe}
              contentContainerStyle={[styles.listContainer, { paddingBottom: 40 }]}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
}
