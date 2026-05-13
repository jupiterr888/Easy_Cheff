import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import QuickNavSheet from '../../components/QuickNavSheet';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function PantryLayout() {
  const router = useRouter();
  // stare pentru meniul rapid
  const [showQuickNav, setShowQuickNav] = useState(false);

  // butoane sus dreapta in header
  const headerRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* buton lista de cumparaturi */}
      <TouchableOpacity
        style={{ padding: 2, marginRight: 4 }}
        onPress={() => router.push('/pantry-folder/shoppingList')}
      >
        <Ionicons name="cart-outline" size={24} color={Colors.background} />
      </TouchableOpacity>
      {/* buton home */}
      <TouchableOpacity
        style={{ padding: 2, marginRight: 4 }}
        onPress={() => router.push('/(tabs)')}
      >
        <Ionicons name="home" size={24} color={Colors.background} />
      </TouchableOpacity>
      {/* buton setari */}
      <TouchableOpacity
        style={{ padding: 2, marginRight: 4 }}
        onPress={() => router.push('/settings-folder/settings')}
      >
        <Ionicons name="settings-outline" size={24} color={Colors.background} />
      </TouchableOpacity>
      {/* buton meniu rapid */}
      <TouchableOpacity
        style={{ padding: 2, marginRight: 20 }}
        onPress={() => setShowQuickNav(true)}
      >
        <Ionicons name="menu" size={24} color={Colors.background} />
      </TouchableOpacity>
    </View>
  );

  // tabs pentru pantry (lasat nefolosit)
  const tabs = [
    {
      name: 'pantry',
      title: 'Pantry',
    },
    {
      name: 'shoppingList',
      title: 'Shopping List',
    },
  ];

  return (
    <>
      {/* Stack cu toate ecranele din pantry-folder */}
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
          name="ingredientsList"
          options={{
            title: 'Ingredients List',
            headerShown: true,
            headerRight,
          }}
        />
        <Stack.Screen
          name="BarcodeScanner"
          options={{
            title: 'Scan Barcode',
            headerShown: true,
            headerRight,
          }}
        />
        <Stack.Screen
          name="BarcodeResults"
          options={{
            title: 'Product Details',
            headerShown: true,
            headerRight,
          }}
        />
        <Stack.Screen
          name="shoppingList"
          options={{
            title: 'Shopping List',
            headerShown: true,
            headerRight,
          }}
        />
        <Stack.Screen
          name="myIngredients"
          options={{
            title: 'My Ingredients',
            headerShown: true,
            headerRight,  
          }}
        />
      </Stack>
      {/* meniul rapid */}
      <QuickNavSheet
        visible={showQuickNav}
        onClose={() => setShowQuickNav(false)}
      />
    </>
  );
} 