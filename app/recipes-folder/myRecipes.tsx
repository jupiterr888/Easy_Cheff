import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from '../../backend/firebase';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '../../constants/Styles';
import { styles } from './styles/recipeList.styles';
import Colors from '../../constants/Colors';
import { format } from 'date-fns';
import { deleteRecipe } from '../../services/recipeService';
import { Ionicons } from '@expo/vector-icons';

const RECIPE_IMAGES = [
  require('../../assets/images/breakfast-ok.png'),
  require('../../assets/images/lunch-ok.png'),
  require('../../assets/images/dinner-ok.png'),
  require('../../assets/images/dessert-ok.png'),
  require('../../assets/images/meat-ok.png'),
];

export default function MyRecipesScreen() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
          setRecipes([]);
          setLoading(false);
          return;
        }

    setLoading(true);
    
    // seteaza listener in timp real pentru retetele utilizatorului
        const recipesRef = collection(db, 'recipes');
    const unsubscribe = onSnapshot(recipesRef, (querySnapshot) => {
      try {
        const userRecipes = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              image: data.uploadedImage ? data.uploadedImage : (data.imageIndex !== undefined ? RECIPE_IMAGES[data.imageIndex] : RECIPE_IMAGES[0]),
              area: data.area || '',
              authorId: data.authorId,
              createdAt: data.createdAt || null,
            };
          })
          .filter(recipe => recipe.authorId === user.uid)
          .sort((a, b) => (b.createdAt && a.createdAt) ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : 0);
        
        setRecipes(userRecipes);
      } catch (error) {
        console.error('Error processing user recipes:', error);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening to user recipes:', error);
      setRecipes([]);
      setLoading(false);
    });

    // functia de cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  const handleDeleteRecipe = async (recipe: any) => {
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

  const renderRecipe = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => router.push({ pathname: '../recipes-folder/recipeMatch', params: { id: item.id } })}
    >
      {/* badge pentru zona */}
      {item.area ? (
        <View style={styles.areaBadge}>
          <Text style={styles.areaBadgeText}>{item.area}</Text>
        </View>
      ) : null}
      <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={styles.recipeImage} />
      <View style={styles.recipeContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.recipeTitle}>{item.title}</Text>
        </View>
      </View>
      {/* butonul de stergere in coltul din dreapta sus */}
      <TouchableOpacity
        style={[commonStyles.heartButton, { backgroundColor: 'rgba(220, 53, 69, 0.9)' }]}
        onPress={(e) => {
          e.stopPropagation();
          handleDeleteRecipe(item);
        }}
      >
        <Ionicons name="trash-outline" size={20} color="white" />
      </TouchableOpacity>
      {/* badge pentru data crearii, doar pentru retetele proprii ale utilizatorului */}
      {item.createdAt && (
        <View style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          backgroundColor: Colors.muted,
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 3,
          zIndex: 2,
        }}>
          <Text style={{ color: Colors.text, fontSize: 11, fontWeight: 'bold' }}>
            {format(new Date(item.createdAt), 'MMM dd, yyyy')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <>
        <SafeAreaView style={styles.container} edges={["left","right"]}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primaryDark} />
            <Text style={styles.loadingText}>Loading your recipes...</Text>
          </View>
        </SafeAreaView>
        <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
      </>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <View style={styles.content}>
          <Text style={styles.title}>My Own Recipes</Text>
          {recipes.length === 0 ? (
            <View style={commonStyles.emptyContainer}>
              <Text style={commonStyles.emptyText}>You haven't added any recipes yet.</Text>
            </View>
          ) : (
            <FlatList
              data={recipes}
              renderItem={renderRecipe}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
} 