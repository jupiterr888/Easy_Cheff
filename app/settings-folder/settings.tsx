import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, Stack } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../backend/firebase';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../settings-folder/styles/settings.styles';

// icons personalizate pentru setari
import profileIcon from '../../assets/images/profile-outline-ok.png';
import editIcon from '../../assets/images/password-ok.png';
import filterIcon from '../../assets/images/salad-ok.png';
import bannedIcon from '../../assets/images/banned-ok.png';
import trashIcon from '../../assets/images/trash-red-ok.png';

// ecranul principal de setari cu navigare catre toate optiunile
export default function SettingsScreen() {
  const router = useRouter();

  // sterge contul utilizatorului
  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to delete your account');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // sterge datele utilizatorului din firestore
              await deleteDoc(doc(db, 'users', user.uid));
              // sterge contul utilizatorului
              await deleteUser(user);
              Alert.alert('Success', 'Your account has been deleted', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/auth/login'),
                },
              ]);
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.textDark },
          headerTitleStyle: { color: Colors.background },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={Colors.background} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            {/* butonul pentru schimbarea numelui */}
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => router.push('/settings-folder/changeName')}
            >
              <View style={styles.buttonContent}>
                <Image source={profileIcon} style={styles.buttonIcon} />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonText}>Change Name</Text>
                  <Text style={styles.buttonSubtext}>Update your display name</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} style={styles.buttonArrow} />
              </View>
            </TouchableOpacity>

            {/* butonul pentru schimbarea parolei */}
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => router.push('/settings-folder/changePassword')}
            >
              <View style={styles.buttonContent}>
                <Image source={editIcon} style={styles.buttonIcon} />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonText}>Change Password</Text>
                  <Text style={styles.buttonSubtext}>Update your account password</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} style={styles.buttonArrow} />
              </View>
            </TouchableOpacity>

            {/* butonul pentru preferintele alimentare */}
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => router.push('/settings-folder/preferences')}
            >
              <View style={styles.buttonContent}>
                <Image source={filterIcon} style={styles.buttonIcon} />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonText}>Dietary Preferences</Text>
                  <Text style={styles.buttonSubtext}>Set your dietary restrictions</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} style={styles.buttonArrow} />
              </View>
            </TouchableOpacity>

            {/* butonul pentru ingredientele interzise */}
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => router.push('/settings-folder/bannedIngredients')}
            >
              <View style={styles.buttonContent}>
                <Image source={bannedIcon} style={styles.buttonIcon} />
                <View style={styles.buttonTextContainer}>
                  <Text style={styles.buttonText}>Banned Ingredients</Text>
                  <Text style={styles.buttonSubtext}>Manage ingredients to avoid</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} style={styles.buttonArrow} />
              </View>
            </TouchableOpacity>

            {/* butonul pentru stergerea contului */}
            <TouchableOpacity 
              style={[styles.button, styles.deleteButton]} 
              onPress={handleDeleteAccount}
            >
              <View style={styles.buttonContent}>
                <Image source={trashIcon} style={styles.buttonIcon} />
                <View style={styles.buttonTextContainer}>
                  <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete Account</Text>
                  <Text style={[styles.buttonSubtext, styles.deleteButtonSubtext]}>Permanently delete your account and data</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.error} style={styles.buttonArrow} />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
} 