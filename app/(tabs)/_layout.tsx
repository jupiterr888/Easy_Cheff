import React, { useState } from 'react';
//  pachetul de iconite pentru tab bar
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, useRouter } from 'expo-router';
import { Pressable, TouchableOpacity, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Ccomponenta pentru meniul rapid
import QuickNavSheet from '../../components/QuickNavSheet';
import Colors from '../../constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// functie auxiliara pentru afisarea icons din tab bar
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  //  aliniere
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  // state pentru afisarea meniului rapid
  const [showQuickNav, setShowQuickNav] = useState(false);

  // functie pentru butoanele de sus
  const headerRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* buton pentru lista de cumparaturi */}
      <TouchableOpacity
        style={{ padding: 8, marginRight: 8 }}
        onPress={() => router.push('/pantry-folder/shoppingList')}
      >
        <Ionicons name="cart-outline" size={24} color={Colors.background} />
      </TouchableOpacity>
      {/*  pentru home */}
      <TouchableOpacity
        style={{ padding: 8, marginRight: 8 }}
        onPress={() => router.push('/(tabs)')}
      >
        <Ionicons name="home" size={24} color={Colors.background} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ padding: 8, marginRight: 8 }}
        onPress={() => router.push('/settings-folder/settings')}
      >
        <Ionicons name="settings-outline" size={24} color={Colors.background} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ padding: 8 }}
        onPress={() => setShowQuickNav(true)}
      >
        <Ionicons name="menu" size={24} color={Colors.background} />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {/* Tabs principale ale aplicatiei */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          headerShown: true,
          headerRight,
          headerTitleAlign: 'left', 
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />, // icon pentru home
          }}
        />
        <Tabs.Screen
          name="pantry"
          options={{
            title: 'Pantry',
            tabBarIcon: ({ color }) => <TabBarIcon name="shopping-basket" color={color} />, 
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: 'Recipes',
            tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color} />, 
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />, 
          }}
        />
      </Tabs>
      {/* meniul rapid */}
      <QuickNavSheet
        visible={showQuickNav}
        onClose={() => setShowQuickNav(false)}
      />
    </>
  );
}
