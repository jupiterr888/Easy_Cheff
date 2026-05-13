import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { auth, db } from '../../backend/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, arrayUnion, Timestamp, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import Colors from '../../constants/Colors';
import { commonStyles } from '../../constants/Styles';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/tabs/profile.styles';

// tip pentru istoric schimbare nume
interface NameChange {
  oldName: string;
  newName: string;
  timestamp: Timestamp;
}

export default function ProfileScreen() {
  const router = useRouter();
  // state pentru statistici si date user
  const [recipeCount, setRecipeCount] = useState(0);
  const [ingredientCount, setIngredientCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [myRecipesCount, setMyRecipesCount] = useState(0);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState('male-ok.png');
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // se incarca imaginea de profil salvata
  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        const userPrefsRef = doc(db, 'users', user.uid, 'preferences', 'profile');
        const prefsDoc = await getDoc(userPrefsRef);
        if (prefsDoc.exists()) {
          setSelectedImage(prefsDoc.data().profileImage || 'male-ok.png');
        }
      } catch (error) {
        console.error('Error loading profile image preference:', error);
      }
    };
    loadProfileImage();
  }, []);

  // salveaza imaginea de profil selectata
  const handleImageSelect = async (imageName: string) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userPrefsRef = doc(db, 'users', user.uid, 'preferences', 'profile');
      await setDoc(userPrefsRef, { profileImage: imageName }, { merge: true });
      setSelectedImage(imageName);
      setShowImagePicker(false);
    } catch (error) {
      console.error('Error saving profile image preference:', error);
      Alert.alert('Error', 'Failed to save profile image preference');
    }
  };

  // se incarca numele si id-ul userului la montare
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.displayName) {
      setUserName(user.displayName);
    }
    if (user?.uid) {
      setUserId(user.uid); 
    }
  }, []);

  // logout cu confirmare
  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  // se incarca datele userului in timp real la focus/revenire pe ecran
  useFocusEffect(
    useCallback(() => {
      let unsubscribeFavorites: (() => void) | undefined;
      let unsubscribeCompleted: (() => void) | undefined;
      let unsubscribeIngredients: (() => void) | undefined;
      let unsubscribeMyRecipes: (() => void) | undefined;

      const setupRealTimeListeners = async () => {
        try {
          // luam numele si id-ul userului
          const user = auth.currentUser;
          if (user?.displayName) {
            setUserName(user.displayName);
          }
          if (user?.uid) {
            setUserId(user.uid);
          }

          if (user) {
            // listener realtime pentru retete salvate
            const userFavoritesRef = doc(db, 'users', user.uid, 'favorites', 'recipes');
            unsubscribeFavorites = onSnapshot(userFavoritesRef, (favoritesDoc) => {
            if (favoritesDoc.exists()) {
              const data = favoritesDoc.data();
              setRecipeCount(Object.keys(data).length);
            } else {
              setRecipeCount(0);
            }
            });

            // listener realtime pt retete completate
            const userCompletedRef = doc(db, 'users', user.uid, 'completedRecipes', 'recipes');
            unsubscribeCompleted = onSnapshot(userCompletedRef, (completedDoc) => {
            if (completedDoc.exists()) {
              const data = completedDoc.data();
              setCompletedCount(Object.keys(data).length);
            } else {
              setCompletedCount(0);
            }
            });

            // listener realtime pt ingrediente
            const userIngredientsRef = doc(db, 'users', user.uid, 'ingredients', 'pantry');
            unsubscribeIngredients = onSnapshot(userIngredientsRef, (ingredientsDoc) => {
            if (ingredientsDoc.exists()) {
              const data = ingredientsDoc.data();
              setIngredientCount(Object.keys(data).length);
              setIngredients(Object.keys(data));
            } else {
              setIngredientCount(0);
              setIngredients([]);
            }
            });

            // listener realtime pt retetele proprii
            const myRecipesRef = collection(db, 'recipes');
            const myRecipesQuery = query(myRecipesRef, where('authorId', '==', user.uid));
            unsubscribeMyRecipes = onSnapshot(myRecipesQuery, (myRecipesSnapshot) => {
            setMyRecipesCount(myRecipesSnapshot.size);
            });
          }
        } catch (error) {
          console.error('Error setting up real-time listeners:', error);
          Alert.alert('Error', 'Failed to load profile data. Please try again.');
        }
      };

      setupRealTimeListeners();

      // cleanup la demontare
      return () => {
        if (unsubscribeFavorites) unsubscribeFavorites();
        if (unsubscribeCompleted) unsubscribeCompleted();
        if (unsubscribeIngredients) unsubscribeIngredients();
        if (unsubscribeMyRecipes) unsubscribeMyRecipes();
      };
    }, [])
  );

  // schimbare nume
  const handleChangeName = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to change your name');
      return;
    }

    if (!newName) {
      Alert.alert('Error', 'Please enter a new name');
      return;
    }

    setIsLoading(true);
    try {
      const oldName = user.displayName || 'Unknown';
      await updateProfile(user, { displayName: newName });
      
      // salvam si in istoric
      const nameChange: NameChange = {
        oldName,
        newName,
        timestamp: Timestamp.now()
      };

      await setDoc(doc(db, 'users', user.uid), {
        nameHistory: arrayUnion(nameChange)
      }, { merge: true });

      setUserName(newName);
      setNewName('');
      setShowNameEdit(false);
      
      Alert.alert('Success', 'Name updated successfully');
    } catch (error) {
      console.error('Error changing name:', error);
      Alert.alert('Error', 'Failed to change name');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={commonStyles.screenContainer}>
      <View style={styles.content}>
        <View style={commonStyles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                selectedImage === 'male-ok.png'
                  ? require('@/assets/images/male-ok.png')
                  : require('@/assets/images/female-ok.png')
              }
              style={commonStyles.profileImage}
            />
            {/* butonul de edit imagine profil */}
            <TouchableOpacity 
              style={styles.editImageButton}
              onPress={() => setShowImagePicker(true)}
            >
              <Ionicons name="pencil" size={16} color={Colors.background} />
            </TouchableOpacity>
          </View>
          <View style={styles.nameContainer}>
            <Text style={commonStyles.profileName}>{userName || 'Loading...'}</Text>
            {/* butonul de edit nume */}
            <TouchableOpacity 
              style={styles.editNameButton}
              onPress={() => setShowNameEdit(true)}
            >
              <Ionicons name="pencil" size={16} color={Colors.background} />
            </TouchableOpacity>
          </View>
        </View>

        {/* modal edit nume */}
        <Modal
          visible={showNameEdit}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNameEdit(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Name</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="Enter your new name"
                value={newName}
                onChangeText={setNewName}
                placeholderTextColor={Colors.primary}
                editable={!isLoading}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowNameEdit(false);
                    setNewName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    styles.saveButton,
                    (!newName || isLoading) && styles.buttonDisabled
                  ]}
                  onPress={handleChangeName}
                  disabled={!newName || isLoading}
                >
                  <Text style={styles.saveButtonText}>
                    {isLoading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* modal alegere imagine profil */}
        <Modal
          visible={showImagePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImagePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Profile Image</Text>
              <View style={styles.imageOptions}>
                <TouchableOpacity 
                  style={[
                    styles.imageOption,
                    selectedImage === 'male-ok.png' && styles.selectedImage
                  ]}
                  onPress={() => handleImageSelect('male-ok.png')}
                >
                  <Image
                    source={require('@/assets/images/male-ok.png')}
                    style={styles.optionImage}
                  />
                  <Text style={styles.optionText}>M</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.imageOption,
                    selectedImage === 'female-ok.png' && styles.selectedImage
                  ]}
                  onPress={() => handleImageSelect('female-ok.png')}
                >
                  <Image
                    source={require('@/assets/images/female-ok.png')}
                    style={styles.optionImage}
                  />
                  <Text style={styles.optionText}>F</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[commonStyles.logoutButton, { width: '50%'}]}
                onPress={() => setShowImagePicker(false)}
              >
                <Text style={commonStyles.logoutButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* statistici user: retete salvate, ingrediente, retete completate */}
        <View style={[commonStyles.statsSection, { marginTop: -20}]}> 
          <TouchableOpacity style={commonStyles.statCard} onPress={() => router.push('../recipes-folder/savedRecipes')}>
            <Image source={require('@/assets/images/saved-recipes-ok.png')} style={commonStyles.statsImage} />
            <Text style={commonStyles.statNumber}>{recipeCount}</Text>
            <Text style={commonStyles.statLabel}>Saved Recipes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={commonStyles.statCard} onPress={() => router.push('../pantry-folder/myIngredients')}>
            <Image source={require('@/assets/images/manage-pantry-ok.png')} style={commonStyles.statsImage} />
            <Text style={commonStyles.statNumber}>{ingredientCount}</Text>
            <Text style={commonStyles.statLabel}>Home Ingredients</Text>
          </TouchableOpacity>

          <TouchableOpacity style={commonStyles.statCard} onPress={() => router.push('../recipes-folder/completedRecipes')}>
            <Image source={require('@/assets/images/completed-ok.png')} style={commonStyles.statsImage} />
            <Text style={commonStyles.statNumber}>{completedCount}</Text>
            <Text style={commonStyles.statLabel}>Completed Recipes</Text>
          </TouchableOpacity>
        </View>

        {/* alt rand: preferinte, retetele mele, ingrediente interzise */}
        <View style={[commonStyles.statsSection, { marginTop: -20, marginBottom: 20 }]}>  
          <TouchableOpacity style={commonStyles.statCard} onPress={() => router.push('../settings-folder/preferences')}>
            <Image source={require('@/assets/images/salad-ok.png')} style={commonStyles.statsImage} />
            <Text style={commonStyles.statLabel}>Dietary Preferences</Text>
          </TouchableOpacity>
          <TouchableOpacity style={commonStyles.statCard} onPress={() => router.push('/recipes-folder/myRecipes')}>
            <Image source={require('../../assets/images/cook-book-ok.png')} style={commonStyles.statsImage} />
            <Text style={commonStyles.statNumber}>{myRecipesCount}</Text>
            <Text style={commonStyles.statLabel}>My Own Recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={commonStyles.statCard} onPress={() => router.push('/settings-folder/bannedIngredients')}>
            <Image source={require('@/assets/images/banned-ok.png')} style={commonStyles.statsImage} />
            <Text style={commonStyles.statLabel}>Banned Ingredients</Text>
          </TouchableOpacity>
        </View>

        {/* buton logout */}
        <View style={[commonStyles.buttonGroup, { marginTop: -5}]}>  
          <TouchableOpacity style={commonStyles.logoutButton} onPress={handleLogout}>
            <Text style={commonStyles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

