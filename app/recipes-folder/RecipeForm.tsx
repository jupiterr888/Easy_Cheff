import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { auth, db } from '../../backend/firebase';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import StatusBarConfig from '../../components/StatusBarConfig';
import { commonStyles } from '../../constants/Styles';
import { styles } from '../recipes-folder/styles/RecipeForm.styles';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';

// categorii predefinite
const CATEGORIES = ['breakfast', 'lunch', 'dinner'];

// imagini predefinite
const RECIPE_IMAGES = [
  require('../../assets/images/breakfast-ok.png'),
  require('../../assets/images/lunch-ok.png'),
  require('../../assets/images/dinner-ok.png'),
  require('../../assets/images/dessert-ok.png'),
  require('../../assets/images/grill-ok.png'),
];

const UNITS = ['g', 'ml', 'pcs'];

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export default function RecipeForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [area, setArea] = useState('');
  const [category, setCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [apiIngredients, setApiIngredients] = useState<string[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [allAreas, setAllAreas] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [ingredientModalVisible, setIngredientModalVisible] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState('');

  // incarca ingredientele din api
  useEffect(() => {
    fetchApiIngredients();
    fetchAreasAndCategories();
  }, []);

  const fetchApiIngredients = async () => {
    try {
      const response = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?i=list');
      const data = await response.json();
      const ingredients = data.meals.map((meal: any) => meal.strIngredient);
      setApiIngredients(ingredients);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      Alert.alert('Error', 'Failed to load ingredients list');
    }
  };

  const fetchAreasAndCategories = async () => {
    try {
      const response = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=');
      const data = await response.json();
      const areasSet = new Set<string>();
      const categoriesSet = new Set<string>();
      if (data.meals) {
        data.meals.forEach((meal: any) => {
          if (meal.strArea) areasSet.add(meal.strArea);
          if (meal.strCategory) {
            const cat = meal.strCategory.trim().toLowerCase();
            if (cat !== 'breakfast' && cat !== 'lunch' && cat !== 'dinner') {
              categoriesSet.add(meal.strCategory);
            }
          }
        });
      }
      setAllAreas(Array.from(areasSet).sort((a, b) => a.localeCompare(b)));
      setAllCategories(Array.from(categoriesSet).sort((a, b) => a.localeCompare(b)));
      setArea(Array.from(areasSet)[0] || '');
      setCategory(Array.from(categoriesSet)[0] || '');
    } catch (error) {
      console.error('Error fetching areas/categories:', error);
    }
  };

  const addIngredient = () => {
    if (ingredients.length < 20) {
      setIngredients([...ingredients, { name: '', quantity: '', unit: 'g' }]);
    } else {
      Alert.alert('Maximum Reached', 'You can only add up to 20 ingredients');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);

    if (field === 'name') {
      const filtered = apiIngredients.filter(ing => 
        ing.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredIngredients(filtered);
    }
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (text: string, index: number) => {
    const newInstructions = [...instructions];
    newInstructions[index] = text;
    setInstructions(newInstructions);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
  
    if (!result.canceled && result.assets && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      
      try {
        const imageUrl = await uploadToCloudinary(imageUri);
        console.log('Image uploaded successfully, URL:', imageUrl);
        setUploadedImage(imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        Alert.alert('Error', 'Failed to upload image');
      }
    }
  };
  
  // filtreaza si sorteaza ingredientele pentru modal
  const getFilteredIngredients = () => {
    const search = ingredientSearch.trim().toLowerCase();
    if (!search) {
      return apiIngredients.filter(ing => !ingredients.some(sel => sel.name === ing));
    }
    const startsWith = apiIngredients.filter(
      ing => !ingredients.some(sel => sel.name === ing) && ing.toLowerCase().startsWith(search)
    ).sort((a, b) => a.localeCompare(b));
    const contains = apiIngredients.filter(
      ing => !ingredients.some(sel => sel.name === ing) && !ing.toLowerCase().startsWith(search) && ing.toLowerCase().includes(search)
    ).sort((a, b) => a.localeCompare(b));
    return [...startsWith, ...contains];
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!area) {
      Alert.alert('Error', 'Please select an area');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }
    if (ingredients.some(ing => !ing.name || !ing.quantity)) {
      Alert.alert('Error', 'Please fill in all ingredient fields');
      return;
    }
    if (instructions.some(inst => !inst.trim())) {
      Alert.alert('Error', 'Please fill in all instruction fields');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a recipe');
        return;
      }
      // authorName e mereu setat
      let authorName = user.displayName;
      if (!authorName) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().displayName) {
          authorName = userDoc.data().displayName;
        }
      }
      if (!authorName) authorName = 'Anonymous';
      console.log('uploadedImage:', uploadedImage); // log de debug
      const recipeData = {
        title: title.trim(),
        ingredients: ingredients.map(ing => ({
          name: ing.name.trim(),
          quantity: ing.quantity.trim(),
          unit: ing.unit
        })),
        instructions: instructions.map(inst => inst.trim()),
        category,
        area,
        imageIndex: selectedImage,
        ...(uploadedImage ? { uploadedImage } : {}),
        authorId: user.uid,
        authorName,
        createdAt: new Date().toISOString(),
      };
      console.log('Saving recipe with data:', recipeData);
      await addDoc(collection(db, 'recipes'), recipeData);
      Alert.alert('Success', 'Recipe created successfully!');
      router.back();
    } catch (error) {
      console.error('Error creating recipe:', error);
      Alert.alert('Error', 'Failed to create recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <StatusBarConfig />
        <Stack.Screen
          options={{
            title: 'Add Recipe',
            headerStyle: {
              backgroundColor: Colors.textDark,
            },
            headerTintColor: Colors.background,
            headerTitleStyle: {
              color: Colors.background,
            },
            contentStyle: {
              backgroundColor: Colors.background,
            }
          }}
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={80}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.pageTitle}>Add A New Recipe</Text>

            <View style={styles.section}>
              <Text style={styles.label}>Recipe Title:</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter recipe title"
                placeholderTextColor={Colors.bar}
              />
            </View>

            {/* dropdown pentru zona */}
            <View style={styles.section}>
              <Text style={styles.label}>Area (Cuisine):</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={area}
                  onValueChange={setArea}
                  style={styles.picker}
                >
                  {allAreas.map((a) => (
                    <Picker.Item key={a} label={a} value={a} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* dropdown pentru categorie */}
            <View style={styles.section}>
              <Text style={styles.label}>Category:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                >
                  {allCategories.map((c) => (
                    <Picker.Item key={c} label={c} value={c} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* sectiunea imagine reteta */}
            <View style={styles.section}>
              <Text style={styles.label}>Recipe Image:</Text>
              <Text style={styles.sectionDescription}>Choose one or upload your own!</Text>
              <View style={styles.imageContainer}>
                {uploadedImage ? (
                  <Image source={{ uri: uploadedImage }} style={styles.uploadedImage} />
                ) : (
                  RECIPE_IMAGES.map((image, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.imageOption, selectedImage === index && styles.selectedImage]}
                      onPress={() => setSelectedImage(index)}
                    >
                      <Image source={image} style={styles.imageOptionImage} />
                    </TouchableOpacity>
                  ))
                )}
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                  <Text style={styles.uploadButtonText}>Upload Image</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* sectiunea ingrediente */}
            <View style={styles.section}>
              <Text style={styles.label}>Ingredients:</Text>
              <Text style={styles.sectionDescription}>List all ingredients for one portion.</Text>
              <View style={styles.sectionHeader}>
                <TouchableOpacity style={styles.addButton} onPress={() => setIngredientModalVisible(true)}>
                  <Ionicons name="add-circle" size={24} color={Colors.primary} />
                  <Text style={styles.addButtonText}>Add Ingredient</Text>
                </TouchableOpacity>
              </View>
              
              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientContainer}>
                  <View style={styles.ingredientRow}>
                    <View style={styles.ingredientInputContainer}>
                      <Text style={styles.ingredientNameInput}>{ingredient.name}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeIngredient(index)}
                    >
                      <Ionicons name="remove-circle" size={24} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.quantityRow}>
                    <TextInput
                      style={styles.quantityInput}
                      value={ingredient.quantity}
                      onChangeText={(text) => updateIngredient(index, 'quantity', text)}
                      placeholder="Amount"
                      placeholderTextColor={Colors.bar}
                      keyboardType="numeric"
                    />
                    <View style={styles.unitPickerContainer}>
                      <Picker
                        selectedValue={ingredient.unit}
                        style={styles.unitPicker}
                        onValueChange={(value) => updateIngredient(index, 'unit', value)}
                        mode="dropdown"
                      >
                        {UNITS.map((unit) => (
                          <Picker.Item 
                            key={unit} 
                            label={unit} 
                            value={unit} 
                            color={Colors.text}
                            style={{ fontSize: 16 }}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* modal pentru selectarea ingredientelor */}
            <Modal
              visible={ingredientModalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setIngredientModalVisible(false)}
            >
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, minWidth: 290, maxWidth: 400, maxHeight: '80%' }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 12, textAlign: 'center', color: Colors.primaryDark }}>Select Ingredient</Text>
                  <TextInput
                    style={[styles.input, { marginBottom: 12 }]}
                    placeholder="Search ingredients..."
                    value={ingredientSearch}
                    onChangeText={setIngredientSearch}
                    autoFocus
                  />
                  <FlatList
                    data={getFilteredIngredients()}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border }}
                        onPress={() => {
                          setIngredients(prevIngredients => [...prevIngredients, { name: item, quantity: '', unit: 'g' }]);
                          setIngredientModalVisible(false);
                          setIngredientSearch('');
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 300, minWidth: 220 }}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={<Text style={{ textAlign: 'center', color: Colors.border, marginTop: 20 }}>No ingredients found</Text>}
                  />
                  <TouchableOpacity
                    style={{ marginTop: 16, alignSelf: 'center' }}
                    onPress={() => setIngredientModalVisible(false)}
                  >
                    <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* sectiunea instructiuni */}
            <View style={styles.section}>
              <Text style={styles.label}>Instructions:</Text>
              <Text style={styles.sectionDescription}>Break down your recipe into clear, step-by-step instructions.</Text>
              <View style={styles.sectionHeader}>
                <TouchableOpacity style={styles.addButton} onPress={addInstruction}>
                  <Ionicons name="add-circle" size={24} color={Colors.primary} />
                  <Text style={styles.addButtonText}>Add Step</Text>
                </TouchableOpacity>
              </View>
              
              {instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionContainer}>
                  <View style={styles.instructionHeader}>
                    <Text style={styles.stepNumber}>Step {index + 1}:</Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeInstruction(index)}
                    >
                      <Ionicons name="remove-circle" size={24} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.instructionInput}
                    value={instruction}
                    onChangeText={(text) => updateInstruction(text, index)}
                    placeholder="Enter instruction step"
                    placeholderTextColor={Colors.bar}
                    multiline
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Creating Recipe...' : 'Create Recipe'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
} 