import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../backend/firebase';

export interface DietaryPreferences {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  nutFree: boolean;
}

// categorii de ingrediente care intra in conflict cu preferintele alimentare
const DIETARY_CONFLICTS = {
  vegetarian: ['beef', 'chicken', 'pork', 'lamb', 'fish', 'meat', 'bacon', 'sausage', 'ham', 'turkey', 'duck', 'goose', 'veal', 'venison', 'rabbit', 'quail', 'pheasant', 'game', 'broth', 'stock', 'fish sauce'],
  vegan: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'honey', 'egg', 'whey', 'casein', 'lactose', 'gelatin', 'lard', 'tallow', 'fish sauce'],
  glutenFree: ['wheat', 'flour', 'barley', 'rye', 'malt', 'brewer', 'couscous', 'semolina', 'spelt', 'kamut', 'triticale'],
  dairyFree: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'whey', 'casein', 'lactose'],
  nutFree: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut', 'peanut']
};

export async function loadDietaryPreferences(): Promise<DietaryPreferences | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const userPreferencesRef = doc(db, 'users', user.uid, 'preferences', 'dietary');
    const preferencesDoc = await getDoc(userPreferencesRef);
    
    if (preferencesDoc.exists()) {
      return preferencesDoc.data() as DietaryPreferences;
    }
    return null;
  } catch (error) {
    console.error('Error loading dietary preferences:', error);
    return null;
  }
}

export async function loadDietaryPreferencesRealtime(
  onUpdate: (preferences: DietaryPreferences | null) => void
): Promise<(() => void) | undefined> {
  const user = auth.currentUser;
  if (!user) return undefined;

  try {
    const userPreferencesRef = doc(db, 'users', user.uid, 'preferences', 'dietary');
    
    // seteaza listener realtime pentru preferintele alimentare
    const unsubscribe = onSnapshot(userPreferencesRef, (preferencesDoc) => {
      try {
        if (preferencesDoc.exists()) {
          onUpdate(preferencesDoc.data() as DietaryPreferences);
        } else {
          onUpdate(null);
        }
      } catch (error) {
        console.error('Error processing dietary preferences:', error);
        onUpdate(null);
      }
    }, (error) => {
      console.error('Error listening to dietary preferences:', error);
      onUpdate(null);
    });

    // returneaza functia de cleanup
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up dietary preferences listener:', error);
    return undefined;
  }
}

export function checkDietaryConflicts(ingredientName: string, preferences: DietaryPreferences): string[] {
  const conflicts: string[] = [];
  const lowerName = ingredientName.toLowerCase().trim();

  // verifica fiecare preferinta alimentara
  Object.entries(preferences).forEach(([preference, isActive]) => {
    if (isActive && DIETARY_CONFLICTS[preference as keyof typeof DIETARY_CONFLICTS]) {
      const conflictingIngredients = DIETARY_CONFLICTS[preference as keyof typeof DIETARY_CONFLICTS];
      
      // verifica daca vreunul din ingredientele in conflict e prezent in numele ingredientului
      const hasConflict = conflictingIngredients.some(conflict => {
        // imparte numele ingredientului in cuvinte si verifica fiecare cuvant
        const words = lowerName.split(/[\s,]+/);
        return words.some(word => {
          // verifica pentru match exact sau daca cuvantul contine conflictul
          return word === conflict || word.includes(conflict) || conflict.includes(word);
        });
      });

      if (hasConflict) {
        conflicts.push(preference);
      }
    }
  });

  return conflicts;
} 