import { collection, addDoc, getDocs, getDoc, doc, query, where, updateDoc, deleteDoc, orderBy, limit, startAfter, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, getStorage } from 'firebase/storage';
import { db } from '../backend/firebase';
import { Recipe, CreateRecipeData, UpdateRecipeData } from '../types/Recipe';
import { getAuth } from 'firebase/auth';

// initializeaza Storage cu aplicatia Firebase existenta
const storage = getStorage();

const RECIPES_COLLECTION = 'recipes';

// converteste datele Firestore la tipul Recipe
const convertRecipe = (doc: QueryDocumentSnapshot): Recipe => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    authorId: data.authorId,
    authorName: data.authorName,
    description: data.description,
    ingredients: data.ingredients,
    instructions: data.instructions,
    cookingTime: data.cookingTime,
    servings: data.servings,
    difficulty: data.difficulty,
    categories: data.categories,
    imageUrl: data.imageUrl,
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  };
};

// creeaza o reteta noua
export const createRecipe = async (recipeData: CreateRecipeData): Promise<Recipe> => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to create a recipe');
  }

  const recipeToCreate = {
    ...recipeData,
    authorId: auth.currentUser.uid,
    authorName: auth.currentUser.displayName || 'Anonymous',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, RECIPES_COLLECTION), recipeToCreate);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Failed to create recipe');
  }

  return convertRecipe(docSnap as QueryDocumentSnapshot);
};

// ia toate retetele cu paginare
export const getRecipes = async (pageSize: number = 10, lastDoc?: QueryDocumentSnapshot): Promise<{ recipes: Recipe[]; lastDoc: QueryDocumentSnapshot | undefined }> => {
  let recipesQuery = query(
    collection(db, RECIPES_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    recipesQuery = query(
      collection(db, RECIPES_COLLECTION),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageSize)
    );
  }

  const querySnapshot = await getDocs(recipesQuery);
  const recipes = querySnapshot.docs.map(convertRecipe);
  const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

  return {
    recipes,
    lastDoc: lastVisible,
  };
};

// ia o reteta dupa ID
export const getRecipeById = async (id: string): Promise<Recipe> => {
  const docRef = doc(db, RECIPES_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Recipe not found');
  }

  return convertRecipe(docSnap as QueryDocumentSnapshot);
};

// ia retetele dupa user ID
export const getRecipesByUser = async (userId: string): Promise<Recipe[]> => {
  const recipesQuery = query(
    collection(db, RECIPES_COLLECTION),
    where('authorId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(recipesQuery);
  return querySnapshot.docs.map(convertRecipe);
};

// actualizeaza o reteta
export const updateRecipe = async (id: string, updateData: UpdateRecipeData, imageFile?: File): Promise<Recipe> => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to update a recipe');
  }

  const docRef = doc(db, RECIPES_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Recipe not found');
  }

  if (docSnap.data().authorId !== auth.currentUser.uid) {
    throw new Error('Not authorized to update this recipe');
  }

  let imageUrl = updateData.imageUrl;
  if (imageFile) {
    const storageRef = ref(storage, `recipeImages/${Date.now()}_${imageFile.name}`);
    const uploadResult = await uploadBytes(storageRef, imageFile);
    imageUrl = await getDownloadURL(uploadResult.ref);
  }

  const updatePayload = {
    ...updateData,
    imageUrl,
    updatedAt: Timestamp.now(),
  };

  await updateDoc(docRef, updatePayload);
  
  const updatedDoc = await getDoc(docRef);
  return convertRecipe(updatedDoc as QueryDocumentSnapshot);
};

// sterge o reteta
export const deleteRecipe = async (id: string): Promise<void> => {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to delete a recipe');
  }

  const docRef = doc(db, RECIPES_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Recipe not found');
  }

  if (docSnap.data().authorId !== auth.currentUser.uid) {
    throw new Error('Not authorized to delete this recipe');
  }

  await deleteDoc(docRef);
}; 