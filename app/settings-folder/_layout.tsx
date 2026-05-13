import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuickNavSheet from '../../components/QuickNavSheet';
import Colors from '../../constants/Colors';

export default function SettingsLayout() {
  const router = useRouter();
  const [showQuickNav, setShowQuickNav] = useState(false);

  // butoanele din header pentru navigare rapida intre sectiuni
  const headerRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* buton pentru lista de cumparaturi */}
      <TouchableOpacity
        style={{ padding: 2, marginRight: 4 }}
        onPress={() => router.push('/pantry-folder/shoppingList')}
      >
        <Ionicons name="cart-outline" size={24} color={Colors.background} />
      </TouchableOpacity>
      {/* buton pentru pagina principala */}
      <TouchableOpacity
        style={{ padding: 2, marginRight: 4 }}
        onPress={() => router.push('/(tabs)')}
      >
        <Ionicons name="home" size={24} color={Colors.background} />
      </TouchableOpacity>
      {/* buton pentru setari */}
      <TouchableOpacity
        style={{ padding: 2, marginRight: 4 }}
        onPress={() => router.push('/settings-folder/settings')}
      >
        <Ionicons name="settings-outline" size={24} color={Colors.background} />
      </TouchableOpacity>
      {/* buton pentru meniul de navigare rapida */}
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
          name="settings"
          options={{
            title: 'Settings',
            headerShown: true,
            headerRight,
          }}
        />
        <Stack.Screen
          name="changeName"
          options={{
            title: 'Change Name',
            headerShown: true,
            headerRight,
          }}
        />
        <Stack.Screen
          name="changePassword"
          options={{
            title: 'Change Password',
            headerShown: true,
            headerRight,
          }}
        />
        <Stack.Screen
          name="bannedIngredients"
          options={{
            title: 'Banned Ingredients',
            headerShown: true,
            headerRight,
          }}
        />
        <Stack.Screen
          name="preferences"
          options={{
            title: 'Dietary Preferences',
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