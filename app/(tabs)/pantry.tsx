import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { auth, db } from '../../backend/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Colors from '../../constants/Colors';
import { commonStyles } from '../../constants/Styles';
// icons pentru meniul de pantry
import cameraIcon from '../../assets/images/camera-barcode-ok.png';
import groceryIcon from '../../assets/images/all-ingredients-ok.png';
import managePantryIcon from '../../assets/images/my-pantry-ok.png';
import { styles } from '../styles/tabs/pantry.styles';

const screenHeight = Dimensions.get('window').height;

export default function PantryScreen() {
  const router = useRouter();
  // state pentru lista de cumparaturi
  const [shoppingList, setShoppingList] = useState<{ name: string; checked: boolean }[]>([]);

  // incarcam lista de cumparaturi la focus pe ecran
  useFocusEffect(
    useCallback(() => {
      const loadShoppingList = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
          const userShoppingListRef = doc(db, 'users', user.uid, 'shoppingList', 'items');
          const shoppingListDoc = await getDoc(userShoppingListRef);
          
          if (shoppingListDoc.exists()) {
            const data = shoppingListDoc.data();
            // filtram doar items nebifate
            const items = Object.values(data).filter((item: any) => !item.checked);
            setShoppingList(items);
          } else {
            setShoppingList([]);
          }
        } catch (error) {
          console.error('Error loading shopping list:', error);
        }
      };

      loadShoppingList();
    }, [])
  );

  // iteme pt meniul principal
  const menuItems = [
    {
      title: 'Scan Barcode',
      description: 'Use your camera to scan ingredients',
      icon: cameraIcon,
      route: '/pantry-folder/BarcodeScanner' as const,
    },
  ];

  // eliminam duplicatele din lista de cumparaturi
  const dedupedShoppingList = Array.from(
    new Map(
      shoppingList.map(item => [item.name.trim().toLowerCase(), item])
    ).values()
  );

  // afisam un item din lista de cumparaturi
  const renderShoppingItem = ({ item }: { item: { name: string } }) => (
    <View style={[commonStyles.itemCard, styles.shoppingItemCard]}>
      <Text style={[commonStyles.itemName, styles.shoppingItemText]} numberOfLines={3}>
        • {item.name.toLowerCase()}
      </Text>
    </View>
  );

  // afisam un item din meniul principal: Scan barcode
  const renderMenuItem = ({ item }: { item: typeof menuItems[0] }) => (
    <TouchableOpacity
      style={commonStyles.menuItem}
      onPress={() => router.push(item.route)}
    >
      {typeof item.icon === 'string' ? (
        <Text style={styles.menuIcon}>{item.icon}</Text>
      ) : (
        <Image source={item.icon} style={styles.menuIconImage} />
      )}
      <View style={styles.menuText}>
        <Text style={commonStyles.menuTitle}>{item.title}</Text>
        <Text style={commonStyles.menuDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  // header cu preview la lista de cumparaturi
  const ListHeader = () => (
    <>
      <Text style={commonStyles.title}>Pantry Management</Text>
      <Text style={[commonStyles.subtitle, { marginBottom: 25}]}>Manage what you have and what you need</Text>
      {ListFooter()}
      {/* buton pentru All Ingredients */}
      <TouchableOpacity 
        style={commonStyles.menuItem}
        onPress={() => router.push('/pantry-folder/ingredientsList')}
      >
        <Image source={groceryIcon} style={styles.menuIconImage} />
        <View style={styles.menuText}>
          <Text style={commonStyles.menuTitle}>All Ingredients</Text>
          <Text style={commonStyles.menuDescription}>Browse and search all available ingredients</Text>
        </View>
      </TouchableOpacity>
      {/* buton My Ingredients */}
      <TouchableOpacity 
        style={commonStyles.menuItem}
        onPress={() => router.push('/pantry-folder/myIngredients')}
      >
        <Image source={managePantryIcon} style={styles.menuIconImage} />
        <View style={styles.menuText}>
          <Text style={commonStyles.menuTitle}>My Ingredients</Text>
          <Text style={commonStyles.menuDescription}>View and manage your pantry ingredients</Text>
        </View>
      </TouchableOpacity>
    </>
  );

  // preview  lista de cumparaturi
  const ListFooter = () => {
    // doar primele 6 iteme pentru preview
    const previewItems = dedupedShoppingList.slice(0, 6);
    const hasMoreItems = dedupedShoppingList.length > 6;

    return (
      <>
        <View style={[commonStyles.shoppingListContainer, { marginTop: -15, marginBottom: 15}]}> 
          <Text style={[commonStyles.menuTitle, { marginTop: -10}]}>Shopping List Preview</Text>
          {dedupedShoppingList.length > 0 ? (
            <View style={styles.shoppingListContent}>
              <View style={styles.shoppingListPreviewContainer}>
                <FlatList
                  data={previewItems}
                  renderItem={renderShoppingItem}
                  keyExtractor={item => item.name.trim().toLowerCase()}
                  numColumns={2}
                  columnWrapperStyle={styles.columnWrapper}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
              {/* buton View Complete List sau All numarul */}
              <TouchableOpacity 
                style={styles.viewListButton}
                onPress={() => router.push('/pantry-folder/shoppingList')}
              >
                <Text style={styles.viewListButtonText}>
                  {hasMoreItems 
                    ? `View All ${dedupedShoppingList.length} Items`
                    : 'View Complete List'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => router.push('/pantry-folder/shoppingList')}>
              <Text style={{ color: Colors.border }}>No active ingredients. Tap to open list.</Text>
            </TouchableOpacity>
          )}
        </View>
      </>
    );
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={menuItems}
      renderItem={renderMenuItem}
      keyExtractor={(item) => item.title}
      ListHeaderComponent={ListHeader}
    />
  );
}
