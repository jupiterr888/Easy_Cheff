import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Image, Modal, ScrollView, Alert } from 'react-native';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../backend/firebase';
import { doc, setDoc, getDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import searchIcon from '../../assets/images/search-ok.png';
import { commonStyles } from '../../constants/Styles';
import { styles } from '../settings-folder/styles/bannedIngredients.styles';

// interfata pentru ingredient cu status de interzis
interface Ingredient {
  id: string;
  name: string;
  isBanned: boolean;
}

// ecranul pentru gestionarea ingredientelor interzise cu sincronizare real-time
export default function BannedIngredientsScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [bannedIngredients, setBannedIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  // initializeaza datele la montarea componentei si seteaza listener real-time
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initializeData = async () => {
      try {
        const cleanup = await loadIngredients();
        unsubscribe = cleanup;
      } catch (error) {
        console.error('Error initializing banned ingredients:', error);
      }
    };

    initializeData();

    // functia de cleanup pentru listener-ul real-time
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // incarca ingredientele din api si seteaza listener pentru ingredientele interzise
  const loadIngredients = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setIsLoading(true);
      
      // incarca ingredientele din api, doar o data
      const response = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?i=list');
      const data = await response.json();
      
      if (data?.meals) {
        const ingredientsList = data.meals.map((item: any) => ({
          id: item.idIngredient,
          name: item.strIngredient,
          isBanned: false 
        }));

        // sorteaza ingredientele alfabetic
        ingredientsList.sort((a: Ingredient, b: Ingredient) => a.name.localeCompare(b.name));
        setIngredients(ingredientsList);
      }
      
      // seteaza listener in timp real pentru ingredientele interzise ale utilizatorului
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (userDoc) => {
        try {
          const userBannedIngredients = userDoc.data()?.bannedIngredients || [];
          setBannedIngredients(userBannedIngredients);

          // actualizeaza lista de ingrediente cu statusul curent de interzis
          setIngredients(prev => prev.map(ing => ({
            ...ing,
            isBanned: userBannedIngredients.includes(ing.name.toLowerCase())
          })));
        } catch (error) {
          console.error('Error processing banned ingredients:', error);
        } finally {
          setIsLoading(false);
        }
      }, (error) => {
        console.error('Error listening to banned ingredients:', error);
        setIsLoading(false);
      });

      // returneaza functia de cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error loading ingredients:', error);
      setIsLoading(false);
    }
  };

  // comuta statusul de interzis pentru un ingredient folosind arrayUnion/arrayRemove
  const toggleBannedIngredient = async (ingredientId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const ingredient = ingredients.find(ing => ing.id === ingredientId);
      if (!ingredient) return;

      const isCurrentlyBanned = bannedIngredients.includes(ingredient.name.toLowerCase());

      if (isCurrentlyBanned) {
        // sterge din lista de ingrediente interzise
        await setDoc(userRef, {
          bannedIngredients: arrayRemove(ingredient.name.toLowerCase())
        }, { merge: true });
      } else {
        // adauga in lista de ingrediente interzise
        await setDoc(userRef, {
          bannedIngredients: arrayUnion(ingredient.name.toLowerCase())
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error updating banned ingredients:', error);
    }
  };

  // sterge toate ingredientele interzise cu confirmare
  const handleDeleteAll = async () => {
    Alert.alert(
      'Delete All Banned Ingredients',
      'Are you sure you want to remove all banned ingredients?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
              const userRef = doc(db, 'users', user.uid);
              await setDoc(userRef, {
                bannedIngredients: []
              }, { merge: true });
              
              Alert.alert('Success', 'All banned ingredients have been removed.');
            } catch (error) {
              console.error('Error removing all banned ingredients:', error);
              Alert.alert('Error', 'Failed to remove banned ingredients. Please try again.');
            }
          }
        }
      ]
    );
  };

  // cautarea ingredientelor dupa nume
  const filteredIngredients = ingredients
    .filter(ing => ing.name.toLowerCase().includes(searchText.toLowerCase()))
    .sort((a, b) => {
      const searchLower = searchText.toLowerCase();
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      const aStartsWith = aName.startsWith(searchLower);
      const bStartsWith = bName.startsWith(searchLower);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // daca ambele incep cu textul de cautare, sorteaza alfabetic
      return aName.localeCompare(bName);
    });

  // afiseaza modalul cu ingredientele interzise
  const handleShowBanned = () => {
    setModalVisible(true);
  };

  // randare un ingredient cu statusul de interzis
  const renderIngredient = ({ item }: { item: Ingredient }) => (
    <TouchableOpacity
      style={[styles.ingredientItem, item.isBanned && styles.bannedIngredientItem]}
      onPress={() => toggleBannedIngredient(item.id)}
    >
      <View style={styles.ingredientContent}>
        <Text style={[styles.ingredientName, item.isBanned && styles.bannedIngredientName]}>
          {item.name.toLowerCase()}
        </Text>
        {item.isBanned && (
          <View style={styles.bannedBadge}>
            <Ionicons name="close-circle" size={16} color={Colors.pinkicon} />
            <Text style={styles.bannedText}>banned</Text>
          </View>
        )}
      </View>
      <Ionicons
        name={item.isBanned ? "close-circle" : "ellipse-outline"}
        size={24}
        color={item.isBanned ? Colors.pinkicon : Colors.primary}
      />
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Banned Ingredients',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.textDark },
          headerTitleStyle: { color: Colors.background },
        }}
      />
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        {/* header-ul cu cautare si butoane */}
        <View style={styles.header}>
          <Text style={styles.title}>Banned Ingredients</Text>
          <View style={commonStyles.searchContainer}>
            <View style={commonStyles.searchBarContainer}>
              <Image source={searchIcon} style={commonStyles.searchIcon} />
              <TextInput
                style={commonStyles.searchInput}
                placeholder="Search ingredients..."
                placeholderTextColor={Colors.bar}
                value={searchText}
                onChangeText={setSearchText}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.seeBannedButton} onPress={handleShowBanned}>
              <Text style={styles.seeBannedButtonText}>
                See Your Banned Ingredients ( {bannedIngredients.length} )
              </Text>
            </TouchableOpacity>
            {bannedIngredients.length > 0 && (
              <TouchableOpacity 
                style={styles.deleteAllButton} 
                onPress={handleDeleteAll}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.description}>
            Select ingredients you want to exclude from your recipes:
          </Text>
        </View>

        {/* lista de ingrediente cu loading state */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredIngredients}
            renderItem={renderIngredient}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
          />
        )}
      </SafeAreaView>
      

      {/* Modal pentru afisarea ingredientelor interzise */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Your Banned Ingredients ({bannedIngredients.length})
            </Text>
            {bannedIngredients.length === 0 ? (
              <Text style={styles.emptyText}>You have no banned ingredients.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {[...bannedIngredients]
                  .sort((a, b) => a.localeCompare(b))
                  .map((name, idx) => (
                    <Text key={name + idx} style={styles.modalIngredient}>{name.toLowerCase()}</Text>
                  ))
                }
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
} 