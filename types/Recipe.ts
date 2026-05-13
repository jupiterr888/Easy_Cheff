export interface Recipe {
  id: string;
  title: string;
  authorId: string;
  authorName?: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  categories: string[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface CreateRecipeData extends Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName'> {
  // campurile necesare cand creezi o reteta noua
}

export interface UpdateRecipeData extends Partial<CreateRecipeData> {
  // campurile care pot fi actualizate
} 