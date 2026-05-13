import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalizeQuantity } from '../../utils/normalizeQuantity';
import { auth, db } from '../../backend/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import Colors from '../../constants/Colors';
import { commonStyles } from '../../constants/Styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import alphaIcon from '../../assets/images/alpha-ok.png';
import oldestIcon from '../../assets/images/oldest-ok.png';
import newestIcon from '../../assets/images/newest-ok.png';
import searchIcon from '../../assets/images/search-ok.png';
import starIcon from '../../assets/images/star-v1.png';
import { styles } from '../recipes-folder/styles/completedRecipes.styles';

// interfata pentru retetele completate cu toate detaliile necesare
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

// interfata pentru ingrediente cu cantitati si tipuri de masura
interface Ingredient {
  name: string;
  quantity: string;
  measurementType: 'weight' | 'volume' | 'pieces' | 'other';
}

// iconitele pentru diferite tipuri de sortare
const SORT_ICONS = {
  alpha: alphaIcon,
  asc: oldestIcon,
  desc: newestIcon,
  rating: starIcon,
};

// imaginile implicite pentru retete
const RECIPE_IMAGES = [
  require('../../assets/images/breakfast-ok.png'),
  require('../../assets/images/lunch-ok.png'),
  require('../../assets/images/dinner-ok.png'),
  require('../../assets/images/dessert-ok.png'),
  require('../../assets/images/meat-ok.png'),
];

export default function CompletedRecipesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [completedRecipes, setCompletedRecipes] = useState<CompletedRecipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<CompletedRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'alpha' | 'rating'>('desc');
  const [searchText, setSearchText] = useState('');
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState(false);
  const [selectedCompletedRecipe, setSelectedCompletedRecipe] = useState<CompletedRecipe | null>(null);

  // sterge toata istoria retetelor completate
  const handleDeleteAllHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      'Delete All History',
      'Are you sure you want to delete all completed recipes? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              // sterge toate retetele completate din firebase
              const userCompletedRef = doc(db, 'users', user.uid, 'completedRecipes', 'recipes');
              await setDoc(userCompletedRef, {});
              setCompletedRecipes([]);
              Alert.alert('Success', 'All completed recipes have been deleted.');
            } catch (error) {
              console.error('Error deleting completed recipes:', error);
              Alert.alert('Error', 'Failed to delete completed recipes.');
            }
          }
        }
      ]
    );
  };

  // sterge o singura reteta din istorie
  const handleDeleteRecipe = async (recipeId: string) => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe from your history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (!user) return;

              // obtine documentul cu retetele completate
              const userCompletedRef = doc(db, 'users', user.uid, 'completedRecipes', 'recipes');
              const completedDoc = await getDoc(userCompletedRef);
              
              if (completedDoc.exists()) {
                const data = completedDoc.data();
                const updatedData = { ...data };
                // sterge reteta specifica din obiect
                delete updatedData[recipeId];
                
                // salveaza datele actualizate
                await setDoc(userCompletedRef, updatedData);
                setCompletedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
              }
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Alert.alert('Error', 'Failed to delete recipe. Please try again.');
            }
          }
        }
      ]
    );
  };

  // initializeaza datele la montarea componentei
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initializeData = async () => {
      try {
        const cleanup = await loadCompletedRecipes();
        unsubscribe = cleanup;
      } catch (error) {
        console.error('Error initializing completed recipes:', error);
      }
    };

    initializeData();

    // functia de cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // filtreaza retetele in functie de textul de cautare
  useEffect(() => {
    let filtered = completedRecipes;
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      // prioritizeaza retetele care incep cu textul cautat
      const startsWith = completedRecipes.filter(recipe => 
        recipe.title.toLowerCase().startsWith(lowerSearch)
      );
      // apoi retetele care contin textul cautat
      const contains = completedRecipes.filter(recipe =>
        !recipe.title.toLowerCase().startsWith(lowerSearch) &&
        recipe.title.toLowerCase().includes(lowerSearch)
      );
      // sorteaza ambele liste alfabetic
      startsWith.sort((a, b) => a.title.localeCompare(b.title));
      contains.sort((a, b) => a.title.localeCompare(b.title));
      filtered = [...startsWith, ...contains];
    }
    setFilteredRecipes(filtered);
  }, [searchText, completedRecipes]);

  // incarca retetele completate din firebase cu listener realtime
  const loadCompletedRecipes = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userCompletedRef = doc(db, 'users', user.uid, 'completedRecipes', 'recipes');
      
      // seteaza listener in timp real pentru retetele completate
      const unsubscribe = onSnapshot(userCompletedRef, (completedDoc) => {
        try {
      if (completedDoc.exists()) {
        const data = completedDoc.data();
        // converteste obiectul in array de retete
        setCompletedRecipes(Object.values(data));
      } else {
        setCompletedRecipes([]);
      }
    } catch (error) {
          console.error('Error processing completed recipes:', error);
          setError('Failed to load completed recipes. Please try again.');
        } finally {
          setLoading(false);
        }
      }, (error) => {
        console.error('Error listening to completed recipes:', error);
        setError('Failed to load completed recipes. Please try again.');
        setLoading(false);
      });

      // returneaza functia de cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up completed recipes listener:', error);
      setError('Failed to load completed recipes. Please try again.');
      setLoading(false);
    }
  };

  // formateaza data pentru afisare
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // afiseaza stelele pentru rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={20}
          color={i <= rating ? Colors.rating : Colors.border}
        />
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  // functie helper pentru formatarea cantitatii afisate
  const getDisplayQuantity = (ingredient: Ingredient): string => {
    // returneaza cantitatea originala asa cum e, deoarece a fost deja scalata si salvata corect
    return ingredient.quantity;
  };

  // renderizeaza un element din lista de retete completate
  const renderRecipeItem = ({ item }: { item: CompletedRecipe }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => {
        setSelectedCompletedRecipe(item);
        setIsRecipeModalVisible(true);
      }}
    >
      <Image 
        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
        style={styles.recipeImage}
        defaultSource={require('../../assets/images/default-recipe.png')}
      />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar" size={16} color={Colors.text} />
          <Text style={styles.dateText}>{formatDate(item.completedDate)}</Text>
        </View>
        <View style={styles.ingredientsPreview}>
          <Text style={styles.ingredientsText}>
            {item.ingredients.slice(0, 3).map(ing => ing.name).join(', ')}
            {item.ingredients.length > 3 ? '...' : ''}
          </Text>
        </View>
        <View style={styles.ratingContainer}>
          {renderStars(item.rating)}
        </View>
        {item.mention && (
          <Text style={styles.mentionText}>{item.mention}</Text>
        )}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation(); // previne deschiderea modalului
            handleDeleteRecipe(item.id);
          }}
        >
          <Ionicons name="trash" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // afiseaza loading screen
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your completed recipes...</Text>
      </SafeAreaView>
    );
  }

  // afiseaza error screen
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadCompletedRecipes}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // afiseaza empty state daca nu sunt retete completate
  if (completedRecipes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <View style={[
          commonStyles.card,
          {
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            maxWidth: 400,
            width: '90%',
            alignSelf: 'center',
            marginTop: 50,
            marginHorizontal: '5%',
          },
        ]}>
          <Ionicons name="restaurant" size={64} color={Colors.primary} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>No Completed Recipes Yet</Text>
          <Text style={styles.emptyText}>
            Start cooking and complete your first recipe to see it here!
          </Text>
          <TouchableOpacity
            style={[styles.findRecipesButton, { marginTop: 24, minWidth: 180 }]}
            onPress={() => router.push('/(tabs)/recipes')}
          >
            <Text style={styles.findRecipesButtonText}>Find Recipes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Completed Recipes</Text>
          <Text style={styles.subtitle}>
            Your cooking history with rating and mentions
          </Text>
        </View>
        {/* bara de cautare si butonul de sortare */}
        <View style={styles.searchSortRow}>
          <View style={styles.searchBarContainer}>
            <Image source={searchIcon} style={styles.searchIcon} />
            <TextInput
              style={styles.searchBar}
              placeholder="Search for a recipe..."
              placeholderTextColor={Colors.border}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity 
            style={styles.sortButton} 
            onPress={() => setSortOrder(
              sortOrder === 'desc' ? 'asc' : 
              sortOrder === 'asc' ? 'alpha' : 
              sortOrder === 'alpha' ? 'rating' : 'desc'
            )}
          >
            <View style={styles.sortIconContainer}>
              <Image source={SORT_ICONS[sortOrder]} style={styles.sortIconZoomed} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.sortingInfoContainer, { marginBottom: 5 }]}>
          <Text style={styles.sortingInfoText}>
            Sorting by: {
              sortOrder === 'alpha' ? 'alphabetical' :
              sortOrder === 'rating' ? 'highest rated' :
              sortOrder === 'asc' ? 'oldest first' :
              'newest first'
            }
          </Text>
        </View>

        {/* lista de retete cu sortare dinamica */}
        <FlatList
          data={filteredRecipes.sort((a, b) => {
            if (sortOrder === 'alpha') {
              return a.title.localeCompare(b.title);
            } else if (sortOrder === 'rating') {
              return b.rating - a.rating; // sorteaza dupa rating (cel mai mare primul)
            }
            const dateA = new Date(a.completedDate).getTime();
            const dateB = new Date(b.completedDate).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
          })}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => `completed-${item.id}-${item.completedDate}`}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        />
        {/* butonul de stergere a intregii istorii la sfarsit */}
        <View style={styles.bottomDeleteContainer}>
          <TouchableOpacity style={styles.deleteAllButton} onPress={handleDeleteAllHistory}>
            <Text style={styles.deleteAllButtonText}>Delete All History</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />

      {/* modalul cu detaliile retetei */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isRecipeModalVisible}
        onRequestClose={() => {
          setIsRecipeModalVisible(!isRecipeModalVisible);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButtonTopRight}
              onPress={() => setIsRecipeModalVisible(false)}
            >
              <Ionicons name="close-circle" size={30} color={Colors.text} />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {selectedCompletedRecipe && (
                <View>
                  <Image 
                    source={typeof selectedCompletedRecipe.image === 'number' ? 
                      selectedCompletedRecipe.image : 
                      { uri: selectedCompletedRecipe.image }
                    }
                    style={styles.modalRecipeImage}
                    defaultSource={require('../../assets/images/default-recipe.png')}
                  />
                  <Text style={styles.modalRecipeTitle}>{selectedCompletedRecipe.title}</Text>

                  {/* afiseaza numarul de portii facute */}
                  {selectedCompletedRecipe.scalingFactor && ( // Only display if scalingFactor is available
                     <Text style={styles.modalSectionTitle}>Portions Made: {selectedCompletedRecipe.scalingFactor}</Text>
                  )}

                  <Text style={styles.modalSectionTitle}>Ingredients Used:</Text>
                  {selectedCompletedRecipe.ingredients.map((ingredient, index) => (
                    <Text key={index} style={styles.modalIngredientText}>
                      • {ingredient.name}: {getDisplayQuantity(ingredient)}
                    </Text>
                  ))}

                  <Text style={styles.modalSectionTitle}>Your Rating:</Text>
                  <View style={styles.modalRatingContainer}>{renderStars(selectedCompletedRecipe.rating)}</View>

                  {selectedCompletedRecipe.mention && (
                    <View>
                      <Text style={styles.modalSectionTitle}>Your Mention:</Text>
                      <Text style={styles.modalMentionText}>{selectedCompletedRecipe.mention}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
} 