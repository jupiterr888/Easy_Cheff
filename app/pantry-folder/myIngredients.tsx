import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../backend/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField, onSnapshot } from 'firebase/firestore';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import alphaIcon from '../../assets/images/alpha-ok.png';
import zetaIcon from '../../assets/images/zeta-ok.png';
import filterIcon from '../../assets/images/filter-ok.png';
import { styles } from './styles/myIngredients.styles';
import { commonStyles } from '../../constants/Styles';
import { normalizeQuantity } from '../../utils/normalizeQuantity';
import { DietaryPreferences, checkDietaryConflicts, loadDietaryPreferencesRealtime } from '../../utils/dietaryPreferences';

// icons pentru sortare
const SORT_ICONS = {
  default: filterIcon,
  asc: alphaIcon,
  desc: zetaIcon,
};

// tip pentru ingredient din pantry
interface Ingredient {
  name: string;
  quantity: string;
  measurementType: 'weight' | 'volume' | 'pieces' | 'other';
}

export default function MyIngredientsScreen() {
  // state pentru ingrediente, filtrare, cautare, modale, sortare
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [quantityInput, setQuantityInput] = useState('');
  const [measurementType, setMeasurementType] = useState<'weight' | 'volume' | 'pieces' | 'other'>('weight');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const router = useRouter();

  // listener realtime pentru ingredientele din pantry
  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // listener realtime pentru ingrediente
      const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      const unsubscribe = onSnapshot(userIngredientsRef, (ingredientsDoc) => {
        try {
          if (ingredientsDoc.exists()) {
            const data = ingredientsDoc.data();
            // se convertesc datele din firebase in lista de ingrediente
            const ingredientsList = Object.entries(data).map(([name, data]: [string, any]) => ({
              name,
              quantity: data.quantity,
              measurementType: data.measurementType
            }));
            setIngredients(ingredientsList);
          } else {
            setIngredients([]);
          }
        } catch (error) {
          console.error('Error processing ingredients:', error);
          Alert.alert('Error', 'Failed to load ingredients');
        } finally {
          setLoading(false);
        }
      }, (error) => {
        console.error('Error listening to ingredients:', error);
        Alert.alert('Error', 'Failed to load ingredients');
        setLoading(false);
      });

      // cleanup la demontare
      return () => {
        unsubscribe();
      };
    }, [])
  );

  // filtreaza si sorteaza ingrediente
  useEffect(() => {
    const filtered = ingredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(searchText.toLowerCase())
    );

    // sortare pentru prioritizarea itemelor care incep cu textul cautat
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      const startsWith = filtered.filter(item => 
        item.name.toLowerCase().startsWith(lowerSearch)
      );
      const contains = filtered.filter(item => 
        !item.name.toLowerCase().startsWith(lowerSearch) && 
        item.name.toLowerCase().includes(lowerSearch)
      );
      
      // sortare alfabetica pentru fiecare grup
      startsWith.sort((a, b) => a.name.localeCompare(b.name));
      contains.sort((a, b) => a.name.localeCompare(b.name));
      
      setFilteredIngredients([...startsWith, ...contains]);
    } else {
      setFilteredIngredients(filtered);
    }
  }, [searchText, ingredients]);

  // returneaza unitatea de afisare pentru tipul de masurare
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

  // adauga cantitate la ingredientul existent
  const handleAddQuantity = async () => {
    if (!selectedIngredient || !quantityInput) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update ingredients');
      return;
    }

    try {
      const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      const ingredientsDoc = await getDoc(userIngredientsRef);
      const currentData = ingredientsDoc.exists() ? ingredientsDoc.data() : {};
      
      // se calculeaza cantitatea totala
      const currentQuantity = currentData[selectedIngredient.name.trim().toLowerCase()]?.quantity || '0';
      const newQuantity = (parseFloat(currentQuantity) + parseFloat(quantityInput)).toString();
      const unit = getUnitDisplay(selectedIngredient.measurementType);
      const newQuantityWithUnit = newQuantity + unit;
      
      // se actualizeaza in firebase
      await setDoc(userIngredientsRef, {
        ...currentData,
        [selectedIngredient.name.trim().toLowerCase()]: {
          quantity: newQuantityWithUnit,
          measurementType: selectedIngredient.measurementType
        }
      }, { merge: true });
      
      // se actualizeaza state local
      const updatedIngredients = ingredients.map(ing =>
        ing.name === selectedIngredient.name
          ? { ...ing, quantity: newQuantityWithUnit }
          : ing
      );
      
      setIngredients(updatedIngredients);
      setQuantityModalVisible(false);
      setSelectedIngredient(null);
      setQuantityInput('');
      
      Alert.alert(
        'Success',
        `Added ${quantityInput}${unit} of ${selectedIngredient.name}. New total: ${newQuantityWithUnit}`
      );
    } catch (error) {
      console.error('Error updating ingredient quantity:', error);
      Alert.alert('Error', 'Failed to update ingredient quantity');
    }
  };

  // editeaza cantitatea ingredientului
  const handleEditQuantity = async () => {
    if (!selectedIngredient || !quantityInput) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update ingredients');
      return;
    }
    try {
      const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      const ingredientsDoc = await getDoc(userIngredientsRef);
      const currentData = ingredientsDoc.exists() ? ingredientsDoc.data() : {};
      // se extrage unitatea din cantitatea existenta
      let unit = '';
      const match = selectedIngredient.quantity.match(/[a-zA-Z]+$/);
      if (match) {
        unit = match[0];
      } else {
        unit = getUnitDisplay(selectedIngredient.measurementType);
      }
      const newQuantity = quantityInput + unit;
      await setDoc(userIngredientsRef, {
        ...currentData,
        [selectedIngredient.name.trim().toLowerCase()]: {
          quantity: newQuantity,
          measurementType: selectedIngredient.measurementType
        }
      }, { merge: true });
      // se actualizeaza state loc
      const updatedIngredients = ingredients.map(ing =>
        ing.name === selectedIngredient.name
          ? { ...ing, quantity: newQuantity }
          : ing
      );
      setIngredients(updatedIngredients);
      setQuantityModalVisible(false);
      setSelectedIngredient(null);
      setQuantityInput('');
      
      Alert.alert('Success', `Quantity updated for ${selectedIngredient.name}`);
    } catch (error) {
      console.error('Error updating ingredient quantity:', error);
      Alert.alert('Error', 'Failed to update ingredient quantity');
    }
  };

  // afiseaza cantitatea cu unitatea potrivita
  const getQuantityDisplay = (item: Ingredient) => {
    if (!item.quantity) return '';
    if (item.measurementType === 'other') {
      return item.quantity;
    }
    const q = item.quantity.trim();
    if (
      q.endsWith('g') ||
      q.endsWith('ml') ||
      q.endsWith('pcs') ||
      q.toLowerCase() === 'to taste'
    ) {
      return q;
    }
    return `${q}g`;
  };

  // randare pentru fiecare ingredient din lista
  const renderItem = ({ item }: { item: Ingredient }) => (
    <View style={styles.ingredientItem}>
      <View style={styles.ingredientInfo}>
        <Text style={styles.ingredientName}>{item.name.toLowerCase()}</Text>
      </View>
      <View style={styles.rightActions}>
        {/* buton pentru editare cantitate */}
        <TouchableOpacity
          style={styles.quantitySquareBadge}
          onPress={() => {
            setSelectedIngredient(item);
            // extragem doar numarul din cantitate pentru editare fara unitate
            setQuantityInput(item.quantity.match(/\d+(?:\.\d+)?/)?.[0] || '');
            setQuantityModalVisible(true);
          }}
        >
          <Text style={styles.quantitySquareBadgeText}>{getQuantityDisplay(item)}</Text>
        </TouchableOpacity>
        {/* buton pentru stergere ingredient */}
        <TouchableOpacity
          style={{ marginLeft: 8 }}
          onPress={() => {
            setSelectedIngredient(item);
            setRemoveModalVisible(true);
          }}
        >
          <Ionicons name="close" size={22} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // sterge toate ingredientele din pantry
  const handleDeleteAll = async () => {
    const user = auth.currentUser;
    if (!user) return;

    Alert.alert(
      'Delete All Ingredients',
      'Are you sure you want to delete all ingredients? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
              await setDoc(userIngredientsRef, {});
              setIngredients([]);
              Alert.alert('Success', 'All ingredients have been deleted');
            } catch (error) {
              console.error('Error deleting all ingredients:', error);
              Alert.alert('Error', 'Failed to delete all ingredients');
            }
          }
        }
      ]
    );
  };

  // sorteaza ingredientele dupa optiunea selectata
  const getSortedIngredients = (items: Ingredient[]) => {
    if (sortOrder === 'default') return items;
    
    return [...items].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // schimba ordinea de sortare
  const toggleSort = () => {
    setSortOrder(current => {
      if (current === 'default') return 'asc';
      if (current === 'asc') return 'desc';
      return 'default';
    });
  };

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
        onPress={toggleSort}
      >
        <View style={styles.sortIconContainer}>
          <Image source={SORT_ICONS[sortOrder]} style={styles.sortIconZoomed} />
        </View>
      </TouchableOpacity>
    </View>
  );

  // sterge ingredientul "to taste" din pantry
  const handleRemoveToTasteIngredient = async () => {
    if (!selectedIngredient) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
      await updateDoc(userIngredientsRef, {
        [selectedIngredient.name.trim().toLowerCase()]: deleteField()
      });
      setIngredients(ingredients.filter(ing => ing.name !== selectedIngredient.name));
      setRemoveModalVisible(false);
      setSelectedIngredient(null);
    } catch (error) {
      console.error('Error removing ingredient:', error);
      Alert.alert('Error', 'Failed to remove ingredient');
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <View style={styles.content}>
          <Text style={styles.title}>My Ingredients</Text>
          
          {renderSearchBar()}
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading ingredients...</Text>
            </View>
          ) : ingredients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No ingredients in your pantry yet</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/pantry-folder/ingredientsList')}
              >
                <Text style={styles.addButtonText}>Add Ingredients</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={getSortedIngredients(filteredIngredients)}
                renderItem={renderItem}
                keyExtractor={item => item.name}
                contentContainerStyle={styles.listContainer}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/pantry-folder/ingredientsList')}
              >
                <Text style={styles.addButtonText}>Add More Ingredients</Text>
              </TouchableOpacity>
              {ingredients.length > 0 && (
                <TouchableOpacity
                  style={styles.deleteAllButtonBottom}
                  onPress={handleDeleteAll}
                >
                  <Text style={styles.deleteAllButtonBottomText}>Delete All</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* modal pentru stergere ingredient */}
        <Modal
          visible={removeModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Remove {selectedIngredient?.name}?
              </Text>
              <Text style={styles.modalSubtitle}>
                Current quantity: {selectedIngredient ? getQuantityDisplay(selectedIngredient) : ''}
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setRemoveModalVisible(false);
                    setSelectedIngredient(null);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={async () => {
                    if (!selectedIngredient) return;
                    const user = auth.currentUser;
                    if (!user) return;

                    try {
                      const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
                      await updateDoc(userIngredientsRef, {
                        [selectedIngredient.name.trim().toLowerCase()]: deleteField()
                      });
                      setIngredients(ingredients.filter(ing => ing.name !== selectedIngredient.name));
                      setRemoveModalVisible(false);
                      setSelectedIngredient(null);
                    } catch (error) {
                      console.error('Error removing ingredient:', error);
                      Alert.alert('Error', 'Failed to remove ingredient');
                    }
                  }}
                >
                  <Text style={[styles.buttonText, styles.confirmButtonText]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* modal editare cantitate */}
        <Modal
          visible={quantityModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Edit Quantity for {selectedIngredient?.name}
              </Text>
              {selectedIngredient && selectedIngredient.quantity === 'to taste' ? (
                <View style={{ alignItems: 'center', marginVertical: 20, padding: 10 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: Colors.primaryDark }}>
                    Manage "to taste" Ingredient
                  </Text>
                  <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center', color: Colors.text }}>
                    This ingredient is marked as 'to taste'. You cannot set a specific quantity. If you no longer have this ingredient, you can remove it from your pantry.
                  </Text>
                  <TouchableOpacity
                    style={{ backgroundColor: Colors.error, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, marginTop: 10, minWidth: 200 }}
                    onPress={handleRemoveToTasteIngredient}
                  >
                    <Ionicons name="trash" size={20} color={Colors.textLight} style={{ marginRight: 8 }} />
                    <Text style={{ color: Colors.textLight, fontWeight: 'bold', fontSize: 16 }}>Remove from Pantry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.quantityInputContainer}>
                  <TextInput
                    style={[styles.quantityInput, { flex: 1 }]}
                    placeholder="Enter new quantity"
                    value={quantityInput}
                    onChangeText={text => {
                      // permitem doar numere si un singur punct zecimal
                      let cleaned = text.replace(/[^\d.]/g, '');
                      const parts = cleaned.split('.');
                      if (parts.length > 2) {
                        cleaned = parts[0] + '.' + parts.slice(1).join('');
                      }
                      setQuantityInput(cleaned);
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={styles.unitText}>
                    {selectedIngredient ? (selectedIngredient.quantity.match(/[a-zA-Z]+$/)?.[0] || getUnitDisplay(selectedIngredient.measurementType)) : ''}
                  </Text>
                </View>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setQuantityModalVisible(false);
                    setSelectedIngredient(null);
                    setQuantityInput('');
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleEditQuantity}
                >
                  <Text style={[styles.buttonText, styles.confirmButtonText]}>Save</Text>
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


