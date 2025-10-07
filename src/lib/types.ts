export interface FoodItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  expiryDate: string;
  storage: string;
  dateAdded: string;
  notes?: string;
}

export interface ConsumedItem {
  id: string;
  itemName: string;
  consumedDate: string;
  method: 'manual' | 'recipe';
  quantity: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  isCompleted: boolean;
  source: 'auto' | 'manual';
}

export interface UserPreferences {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'maintain' | 'lose' | 'gain';
  preferredDiet: 'balanced' | 'protein_rich' | 'keto' | 'low_carb' | 'vegetarian' | 'vegan' | 'paleo' | 'mediterranean' | 'dash' | 'gluten_free' | 'whole30' | 'intermittent_fasting' | 'bulking';
  preferredCuisine?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  cuisine: string;
  dietTypes: string[];
  ingredients: RecipeIngredient[];
  instructions: string[];
  image?: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  unit: string;
}

export type ExpiryStatus = 'critical' | 'warning' | 'safe';
