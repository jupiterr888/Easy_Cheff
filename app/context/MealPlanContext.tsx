import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../../backend/firebase';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export interface Recipe {
  id: string;
  title: string;
  image: string | number;
  isUserRecipe?: boolean;
}

export interface DateMealPlan {
  date: string;
  userId: string;
  meals: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
  };
}

interface MealPlanContextType {
  loading: boolean;
  getDateMealPlan: (date: string) => Promise<DateMealPlan | null>;
  updateDateMealSlot: (date: string, mealType: string, recipe: Recipe, forceReplace?: boolean) => Promise<boolean>;
  removeDateMealSlot: (date: string, mealType: string) => Promise<void>;
  clearWeekMealPlan: (weekId: string) => Promise<void>;
}

const MealPlanContext = createContext<MealPlanContextType | undefined>(undefined);

export function useMealPlan() {
  const ctx = useContext(MealPlanContext);
  if (!ctx) throw new Error('useMealPlan must be used within MealPlanProvider');
  return ctx;
}

// Get the start of the week (Monday) for any given date
export const getWeekStart = (date: Date = new Date()) => {
  const currentDay = date.getDay();
  const monday = new Date(date);
  // If Sunday (0), go back 6 days, if Monday (1) go back 0 days, etc.
  monday.setDate(date.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
  return monday.toISOString().split('T')[0];
};

export default function MealPlanProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);

  // Get meal plan for a specific date
  const getDateMealPlan = async (date: string): Promise<DateMealPlan | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      const mealPlanRef = doc(db, 'users', user.uid, 'dateMealPlans', date);
      const mealPlanDoc = await getDoc(mealPlanRef);
      if (mealPlanDoc.exists()) {
        return mealPlanDoc.data() as DateMealPlan;
      }
      return null;
    } catch (error) {
      console.error('Error getting date meal plan:', error);
      return null;
    }
  };

  // Update a meal slot for a specific date
  const updateDateMealSlot = async (date: string, mealType: string, recipe: Recipe, forceReplace = false): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;
    try {
      const mealPlanRef = doc(db, 'users', user.uid, 'dateMealPlans', date);
      const mealPlanDoc = await getDoc(mealPlanRef);
      let plan: DateMealPlan;
      if (mealPlanDoc.exists()) {
        plan = mealPlanDoc.data() as DateMealPlan;
      } else {
        plan = {
          date,
          userId: user.uid,
          meals: {}
        };
      }
      if (!forceReplace && plan.meals[mealType as keyof typeof plan.meals]) {
        // Slot already occupied and not forcing replace
        return false;
      }
      plan.meals[mealType as keyof typeof plan.meals] = recipe;
      await setDoc(mealPlanRef, plan);
      return true;
    } catch (error) {
      console.error('Error updating date meal slot:', error);
      return false;
    }
  };

  // Remove a meal slot for a specific date
  const removeDateMealSlot = async (date: string, mealType: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const mealPlanRef = doc(db, 'users', user.uid, 'dateMealPlans', date);
      const mealPlanDoc = await getDoc(mealPlanRef);
      if (!mealPlanDoc.exists()) return;
      const plan = mealPlanDoc.data() as DateMealPlan;
      if (plan.meals[mealType as keyof typeof plan.meals]) {
        delete plan.meals[mealType as keyof typeof plan.meals];
        await setDoc(mealPlanRef, plan);
      }
    } catch (error) {
      console.error('Error removing date meal slot:', error);
    }
  };

  // Function to clear the entire meal plan for a given week
  const clearWeekMealPlan = async (weekId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      // Get all dates in the week
      const weekStart = new Date(weekId);
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      // Delete all date meal plans for the week
      for (const date of dates) {
        const mealPlanRef = doc(db, 'users', user.uid, 'dateMealPlans', date);
      await deleteDoc(mealPlanRef);
      }
    } catch (error) {
      console.error('Error clearing week meal plan:', error);
      throw error; // Re-throw to be caught by the caller
    }
  };

  return (
    <MealPlanContext.Provider value={{
      loading,
      getDateMealPlan,
      updateDateMealSlot,
      removeDateMealSlot,
      clearWeekMealPlan,
    }}>
      {children}
    </MealPlanContext.Provider>
  );
} 