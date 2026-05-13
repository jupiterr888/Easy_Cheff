import { normalizeQuantity } from './normalizeQuantity';

export interface MealDBRecipe {
  id: string;
  title: string;
  image: string | any;
  ingredients: string[];
  category: string;
  isUserGenerated?: boolean;
  authorId?: string;
  authorName?: string;
  area?: string;
}

const CACHE_EXPIRY = 60 * 60 * 1000; // o ora in milisecunde

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache: { [key: string]: CacheEntry } = {};

export async function fetchWithCache(url: string): Promise<any> {
  const now = Date.now();
  
  // verifica cache-ul mai intai
  if (cache[url] && (now - cache[url].timestamp) < CACHE_EXPIRY) {
    return cache[url].data;
  }

  // daca nu e in cache sau e expirat, ia de la API
  const response = await fetch(url);
  const data = await response.json();
  
  // salveaza in cache
  cache[url] = {
    data,
    timestamp: now
  };

  return data;
}

function convertOuncesToGrams(measurement: string): string {
  if (measurement.toLowerCase().includes('oz') || measurement.toLowerCase().includes('ounce')) {
    const ozMatch = measurement.match(/(\d+(?:\.\d+)?)/);
    if (ozMatch) {
      const oz = parseFloat(ozMatch[1]);
      const grams = Math.round(oz * 28.35);
      return `${grams}g`;
    }
  }
  return measurement;
}

function extractIngredients(meal: any): string[] {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    
    if (ingredient) {
      const ingredientStr = ingredient.trim();
      const measureStr = measure ? normalizeQuantity(measure.trim()) : '1 pcs';
      
      // adauga doar daca avem un ingredient ce nu e gol
      if (ingredientStr) {
        ingredients.push(`${ingredientStr} - ${measureStr}`);
      }
    }
  }
  return ingredients;
}

export async function fetchAllMealDBRecipes(): Promise<MealDBRecipe[]> {
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  const allMeals: MealDBRecipe[] = [];

  // foloseste Promise.all cu delay intre chunks pentru a preveni rate limiting
  const chunkSize = 5;
  for (let i = 0; i < letters.length; i += chunkSize) {
    const chunk = letters.slice(i, i + chunkSize);
    const promises = chunk.map(letter => 
      fetchWithCache(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`)
    );
    
    try {
      const results = await Promise.all(promises);
      results.forEach(data => {
    if (data?.meals) {
      const extracted = data.meals.map((meal: any) => ({
        id: meal.idMeal,
        title: meal.strMeal,
        image: meal.strMealThumb,
        ingredients: extractIngredients(meal),
        category: meal.strCategory,
        area: meal.strArea,
      }));
      allMeals.push(...extracted);
    }
      });
      
      // adauga delay intre chunks pentru a preveni rate limiting
      if (i + chunkSize < letters.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error fetching recipes chunk:', error);
      // continua cu urmatorul chunk chiar daca acesta esueaza
    }
  }
  
  return allMeals;
}

export function filterMealDBRecipes(recipes: MealDBRecipe[], query: string): MealDBRecipe[] {
  return recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(query.toLowerCase())
  );
} 