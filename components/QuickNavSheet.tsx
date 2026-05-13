import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface QuickNavSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function QuickNavSheet({ visible, onClose }: QuickNavSheetProps) {
  const router = useRouter();

  if (!visible) return null;

  const quickNavItems = [
    {
      title: 'Home',
      icon: 'home',
      route: '/(tabs)',
    },
    {
      title: 'My Ingredients',
      icon: 'nutrition',
      route: '/pantry-folder/ingredientsList',
    },
    {
      title: 'Shopping List',
      icon: 'cart',
      route: '/pantry-folder/shoppingList',
    },
    {
      title: 'Find Recipes',
      icon: 'book',
      route: '/(tabs)/recipes',
    },
    {
      title: 'Use My Ingredients',
      icon: 'restaurant',
      route: '/recipes-folder/ingredientBasedRecipes',
    },
    {
      title: 'Profile',
      icon: 'person',
      route: '/(tabs)/profile',
    },
  ];

  const handleNavigation = (route: "/(tabs)" | "/pantry-folder/ingredientsList" | "/pantry-folder/shoppingList" | "/(tabs)/recipes" | "/recipes-folder/ingredientBasedRecipes" | "/(tabs)/profile") => {
    router.push({ pathname: route });
    onClose();
  };

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={styles.title}>Quick Navigation</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.primaryDark} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {quickNavItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => handleNavigation(item.route as "/(tabs)" | "/pantry-folder/ingredientsList" | "/pantry-folder/shoppingList" | "/(tabs)/recipes" | "/recipes-folder/ingredientBasedRecipes" | "/(tabs)/profile")}
          >
            <Ionicons name={item.icon as any} size={24} color={Colors.primary} />
            <Text style={styles.navItemText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: Colors.textDark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  navItemText: {
    fontSize: 16,
    color: Colors.primaryDark,
    marginLeft: 15,
  },
}); 