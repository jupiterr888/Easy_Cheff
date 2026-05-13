import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import QuickNavSheet from '../../components/QuickNavSheet';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import StatusBarConfig from '../../components/StatusBarConfig';

export default function RecipesLayout() {
  const router = useRouter();
  const [showQuickNav, setShowQuickNav] = useState(false);

  // configurarea butoanelor din header pentru navigare rapida
  const headerRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TouchableOpacity
        style={{ padding: 2, marginRight: 4 }}
        onPress={() => router.push('/pantry-folder/shoppingList')}
      >
        <Ionicons name="cart-outline" size={24} color={Colors.background} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ padding: 2, marginRight: 4 }}
        onPress={() => router.push('/(tabs)')}
      >
        <Ionicons name="home" size={24} color={Colors.background} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ padding: 2, marginRight: 4 }}
        onPress={() => router.push('/settings-folder/settings')}
      >
        <Ionicons name="settings-outline" size={24} color={Colors.background} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ padding: 2, marginRight: 20 }}
        onPress={() => setShowQuickNav(true)}
      >
        <Ionicons name="menu" size={24} color={Colors.background} />
      </TouchableOpacity>
    </View>
  );

  // stilurile implicite pentru toate ecranele din stack-ul de retete
  const defaultScreenOptions = {
    headerStyle: {
      backgroundColor: Colors.textDark,
    },
    headerTintColor: Colors.background,
    headerTitleStyle: {
      color: Colors.background,
    },
    contentStyle: {
      backgroundColor: '#000000',
    },
    headerLeft: undefined,
  };

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBarConfig />
      <Stack screenOptions={defaultScreenOptions}>
        {/* ecranul pentru cautarea retetelor pe baza ingredientelor */}
        <Stack.Screen
          name="ingredientBasedRecipes"
          options={{
            title: 'Find Recipes',
            headerShown: true,
            headerRight,
          }}
        />
        {/* ecranul pentru potrivirea retetelor */}
        <Stack.Screen
          name="recipeMatch"
          options={{
            title: 'Recipe-Match',
            headerShown: true,
            headerRight,
          }}
        />
        {/* lista generala de retete */}
        <Stack.Screen
          name="recipeList"
          options={{
            title: 'Recipe List',
            headerShown: true,
            headerRight,
          }}
        />
        {/* retetele salvate de utilizator */}
        <Stack.Screen
          name="savedRecipes"
          options={{
            title: 'Saved Recipes',
            headerShown: true,
            headerRight,
          }}
        />
        {/* retetele finalizate */}
        <Stack.Screen
          name="completedRecipes"
          options={{
            title: 'Completed Recipes',
            headerShown: true,
            headerRight,
          }}
        />
        {/* retetele in curs de preparare */}
        <Stack.Screen
          name="cookingInProgress"
          options={{
            title: 'Cooking in Progress',
            headerShown: true,
            headerRight,
          }}
        />

        {/* formularul pentru adaugarea de retete noi */}
        <Stack.Screen
          name="RecipeForm"
          options={{
            title: 'Recipe Form',
            headerShown: true,
            headerRight,
          }}
        />

        {/* retetele create de utilizator */}
        <Stack.Screen
          name="myRecipes"
          options={{
            title: 'My Own Recipes',
            headerShown: true,
            headerRight,
          }}
        />
      </Stack>
      {/* componenta pentru navigare rapida */}
      <QuickNavSheet
        visible={showQuickNav}
        onClose={() => setShowQuickNav(false)}
      />
    </ThemeProvider>
  );
} 