import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuickNavSheet from '../../components/QuickNavSheet';
import Colors from '../../constants/Colors';

export default function MealPlannerLayout() {
  const router = useRouter();
  const [showQuickNav, setShowQuickNav] = useState(false);

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

  return (
    <>
      <Stack screenOptions={{
        headerStyle: {
          backgroundColor: Colors.textDark,
        },
        headerTintColor: Colors.background,
        headerTitleStyle: {
          color: Colors.background,
        },
        headerLeft: undefined,
      }}>
        <Stack.Screen
          name="MealPlanner"
          options={{
            title: 'Meal Planner',
            headerShown: true,
            headerRight,
          }}
        />
      </Stack>
      <QuickNavSheet
        visible={showQuickNav}
        onClose={() => setShowQuickNav(false)}
      />
    </>
  );
}
