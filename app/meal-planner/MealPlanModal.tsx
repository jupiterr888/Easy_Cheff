import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchAllMealDBRecipes, filterMealDBRecipes, MealDBRecipe } from '../../utils/mealdb';
import { auth, db } from '../../backend/firebase';
import { doc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import Colors from '../../constants/Colors';
import { useMealPlan } from '../context/MealPlanContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './styles/MealPlanModal.styles';

// imagini predefinite pentru retete
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
  image: string | number;
  isUserGenerated?: boolean;
}

interface MealPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
  day: string;
  mealType: string;
  existingRecipe?: Recipe;
}

type TabType = 'all' | 'saved';

export default function MealPlanModal({
  visible,
  onClose,
  onSave,
  day,
  mealType,
  existingRecipe,
}: MealPlanModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allRecipes, setAllRecipes] = useState<MealDBRecipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<MealDBRecipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<MealDBRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const { updateDateMealSlot } = useMealPlan();
  const [dateMealPlans, setDateMealPlans] = useState<{ [date: string]: any }>({});
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [allAreas, setAllAreas] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // la deschiderea modalului, incarca retetele si seteaza listeneri
  useEffect(() => {
    if (visible) {
      let unsubscribe: (() => void) | undefined;
      loadRecipes().then((cleanup) => {
        unsubscribe = cleanup;
      });
      // initializeaza alte date
      loadSavedRecipes();
      setActiveTab('all');
      setSearchQuery('');
      setSelectedMealType(mealType.toLowerCase());
      // cleanup pentru listeneri
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [visible, mealType]);

  // incarca retetele din api si din firestore de la utilizatori, cu listener real-time
  const loadRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      // incarca retetele din API
      const apiRecipes = await fetchAllMealDBRecipes();
      // seteaza listener in timp real pentru retetele generate de utilizator din firestore
      const recipesRef = collection(db, 'recipes');
      // creeaza un map pentru a stoca displayName-urile autorilor
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
      // listener pentru colectia de retete de la utilizatori
      const unsubscribe = onSnapshot(recipesRef, async (querySnapshot) => {
        try {
          // proceseaza retetele utilizatorului si colecteaza id-urile unice ale autorilor
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
                ? data.ingredients.map((ing: any) => 
                    typeof ing === 'string' ? ing : ing.name
                  )
                : [],
              category: data.category || 'Other',
              authorId: authorId,
              authorName,
              isUserGenerated: true
            };
          }));
          // combina retetele din api si cele ale utilizatorului
          const allRecipesData = [...apiRecipes, ...userRecipes].sort((a, b) => 
            a.title.localeCompare(b.title)
          );
          setAllRecipes(allRecipesData);
          setFilteredRecipes(allRecipesData);
        } catch (err) {
          setError('Failed to process recipes. Please try again.');
          console.error('Error processing recipes:', err);
        } finally {
          setLoading(false);
        }
      }, (error) => {
        setError('Failed to load recipes. Please try again.');
        console.error('Error listening to recipes:', error);
        setLoading(false);
      });
      // returneaza functia de cleanup
      return unsubscribe;
    } catch (err) {
      setError('Failed to load recipes. Please try again.');
      console.error('Error loading recipes:', err);
      setLoading(false);
    }
  };

  // incarca retetele salvate de utilizator din subcolectia favorites
  const loadSavedRecipes = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const userFavoritesRef = doc(db, 'users', user.uid, 'favorites', 'recipes');
      const favoritesDoc = await getDoc(userFavoritesRef);
      if (favoritesDoc.exists()) {
        const data = favoritesDoc.data();
        const savedIds = Object.keys(data || {});
        // filtreaza allRecipes dupa savedIds dupa ce allRecipes e incarcat
        setSavedRecipes(
          allRecipes.filter((r) => savedIds.includes(r.id))
        );
      } else {
        setSavedRecipes([]);
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
      setSavedRecipes([]);
    }
  };

  // extrage zonele si categoriile unice pentru filtre avansate
  useEffect(() => {
    const areasSet = new Set<string>();
    const categoriesSet = new Set<string>();
    allRecipes.forEach(recipe => {
      if (recipe.area) areasSet.add(recipe.area);
      if (recipe.category) {
        const cat = recipe.category.trim().toLowerCase();
        if (cat !== 'breakfast' && cat !== 'lunch' && cat !== 'dinner') {
          categoriesSet.add(recipe.category);
        }
      }
    });
    setAllAreas(['All', ...Array.from(areasSet).sort((a, b) => a.localeCompare(b))]);
    setAllCategories(['All', ...Array.from(categoriesSet).sort((a, b) => a.localeCompare(b))]);
  }, [allRecipes]);

  useEffect(() => {
    // Daca tabul activ este 'saved', filtram doar din favorite, altfel din toate retetele
    // Astfel, cand utilizatorul apasa pe "Saved Recipes", vede doar favoritele sale
    const sourceRecipes = activeTab === 'saved' ? savedRecipes : allRecipes;
    let filtered: MealDBRecipe[] = [];
    // filtru de cautare cu prioritizare prefix
    if (searchQuery.trim()) {
      const search = searchQuery.trim().toLowerCase();
      const prefixMatches = sourceRecipes.filter(recipe =>
        recipe.title.toLowerCase().startsWith(search)
      );
      const containsMatches = sourceRecipes.filter(recipe =>
        !recipe.title.toLowerCase().startsWith(search) &&
        recipe.title.toLowerCase().includes(search)
      );
      filtered = [...prefixMatches, ...containsMatches];
    } else {
      filtered = sourceRecipes;
    }
    // filtru pentru tipul de masa
    if (selectedMealType && selectedMealType !== 'all') {
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
          'Main',
          'Miscellaneous',
          'Side',
          'Vegetarian',
          'Vegan',
          'Pasta',
          'Seafood',
          'Chicken',
          'Beef',
          'Lamb',
          'Pork'
        ]
      };
      const allowedCategories = categoryMap[selectedMealType] || [];
      filtered = filtered.filter(recipe => 
        allowedCategories.includes(recipe.category)
      );
    }
    // filtru pentru zona
    if (selectedArea && selectedArea !== 'All') {
      filtered = filtered.filter(recipe => recipe.area === selectedArea);
    }
    // filtru pentru categorie
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(recipe => (recipe.category || '').trim().toLowerCase() === selectedCategory);
    }
    // sorteaza alfabetic dupa titlu
    filtered.sort((a, b) => a.title.localeCompare(b.title));
    setFilteredRecipes(filtered);
  }, [allRecipes, savedRecipes, searchQuery, activeTab, selectedMealType, selectedArea, selectedCategory]);

  // cand allRecipes se schimba, reincarca savedRecipes
  useEffect(() => {
    if (allRecipes.length > 0) {
      loadSavedRecipes();
    }
  }, [allRecipes]);

  // randarea unui item de reteta in lista
  const renderRecipeItem = ({ item }: { item: MealDBRecipe }) => (
    <TouchableOpacity
      style={styles.recipeItem}
      onPress={() => onSave({ id: item.id, title: item.title, image: item.image })}
    >
      <Image
        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
        style={styles.recipeImage}
        resizeMode="cover"
      />
      <View style={styles.recipeDetails}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.isUserGenerated && (
          <View style={styles.userGeneratedBadge}>
            <Ionicons name="person" size={12} color={Colors.background} />
            <Text style={styles.userGeneratedText}>
              {item.authorName || 'User Recipe'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // salveaza reteta selectata in slotul de masa
  const handleSaveMeal = async (recipe: Recipe) => {
    const recipeToSave = {
      id: recipe.id,
      title: recipe.title,
      image: typeof recipe.image === 'number' ? recipe.image : recipe.image,
      isUserRecipe: recipe.isUserGenerated
    };
    const success = await updateDateMealSlot(day, mealType, recipeToSave);
    if (!success) {
      Alert.alert('Slot Occupied', 'This slot already has a planned recipe. Delete it first to add a new one.');
    } else {
      onSave(recipeToSave);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }} edges={["left", "right"]}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {existingRecipe ? 'Edit' : 'Add'} {mealType} for {day}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All Recipes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.card,
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: Colors.primary,
                marginHorizontal: 8,
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 1,
              }}
              onPress={() => setFilterModalVisible(true)}
            >
              <Ionicons name="filter" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 14 }}>
                Filter
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'saved' && styles.tabButtonActive]}
              onPress={() => setActiveTab('saved')}
            >
              <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>Saved Recipes</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.text} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'all' ? 'Search all recipes...' : 'Search saved recipes...'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

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
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecipes}
              renderItem={renderRecipeItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.recipeList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No recipes found</Text>
              }
            />
          )}
        </View>
      </View>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />

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
                              {area === 'All' ? 'All' : area.charAt(0).toUpperCase() + area.slice(1)}
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
                              {category === 'All' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
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
    </Modal>
  );
}

