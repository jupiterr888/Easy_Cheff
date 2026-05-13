import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { commonStyles } from '../../constants/Styles';
import { auth, db } from '../../backend/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { DietaryPreferences } from '../../utils/dietaryPreferences';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './styles/preferences.styles';

// ecranul pentru gestionarea preferintelor alimentare
export default function PreferencesScreen() {
  const router = useRouter();
  // starea pentru preferintele alimentare cu valori implicite
  const [preferences, setPreferences] = useState<DietaryPreferences>({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    nutFree: false,
  });

  // initializare pt datele la montarea componentei
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initializeData = async () => {
      try {
        const cleanup = await loadPreferences();
        unsubscribe = cleanup;
      } catch (error) {
        console.error('Error initializing dietary preferences:', error);
      }
    };

    initializeData();

    // functia de cleanup
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // incarca preferintele alimentare din firebase cu listener realtime
  const loadPreferences = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userPreferencesRef = doc(db, 'users', user.uid, 'preferences', 'dietary');
      
      // seteaza listener in timp real pentru preferintele alimentare
      const unsubscribe = onSnapshot(userPreferencesRef, (preferencesDoc) => {
        try {
      if (preferencesDoc.exists()) {
        setPreferences(preferencesDoc.data() as DietaryPreferences);
      }
        } catch (error) {
          console.error('Error processing dietary preferences:', error);
          Alert.alert('Error', 'Failed to load preferences. Please try again.');
        }
      }, (error) => {
        console.error('Error listening to dietary preferences:', error);
        Alert.alert('Error', 'Failed to load preferences. Please try again.');
      });

      // returneaza functia de cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up dietary preferences listener:', error);
      Alert.alert('Error', 'Failed to load preferences. Please try again.');
    }
  };

  // salveaza preferintele alimentare in firebase
  const savePreferences = async (newPreferences: DietaryPreferences) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save preferences');
      return;
    }

    try {
      const userPreferencesRef = doc(db, 'users', user.uid, 'preferences', 'dietary');
      await setDoc(userPreferencesRef, newPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  // schimba starea unei preferinte alimentare
  const handleToggle = async (preference: keyof DietaryPreferences) => {
    const newPreferences = {
      ...preferences,
      [preference]: !preferences[preference]
    };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  // reseteaza toate preferintele la valorile implicite
  const handleReset = () => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all preferences?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const resetPreferences = {
              vegetarian: false,
              vegan: false,
              glutenFree: false,
              dairyFree: false,
              nutFree: false,
            };
            setPreferences(resetPreferences);
            await savePreferences(resetPreferences);
          }
        }
      ]
    );
  };

  // lista de preferinte alimentare cu mici descrieri
  const preferenceItems = [
    {
      key: 'vegetarian',
      label: 'Vegetarian',
      description: 'No meat, but may include dairy and eggs'
    },
    {
      key: 'vegan',
      label: 'Vegan',
      description: 'No animal products including dairy and eggs'
    },
    {
      key: 'glutenFree',
      label: 'Gluten-Free',
      description: 'No wheat, barley, rye, or their derivatives'
    },
    {
      key: 'dairyFree',
      label: 'Dairy-Free',
      description: 'No milk, cheese, or other dairy products'
    },
    {
      key: 'nutFree',
      label: 'Nut-Free',
      description: 'No nuts or nut products'
    }
  ];

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          <Text style={commonStyles.title}>Dietary Preferences</Text>
          <Text style={[commonStyles.subtitle, { marginBottom: 20 }]}>
            Select your dietary preferences to help us personalize your experience
          </Text>

          {/* lista de preferinte alimentare cu switch-uri */}
          {preferenceItems.map((item) => (
            <View key={item.key} style={commonStyles.preferenceItem}>
              <View style={commonStyles.preferenceInfo}>
                <Text style={commonStyles.preferenceLabel}>{item.label}</Text>
                <Text style={commonStyles.preferenceDescription}>{item.description}</Text>
              </View>
              <Switch
                value={preferences[item.key as keyof DietaryPreferences]}
                onValueChange={() => handleToggle(item.key as keyof DietaryPreferences)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.textLight}
              />
            </View>
          ))}

          {/* butonul pentru resetarea preferintelor */}
          <TouchableOpacity style={commonStyles.resetButton} onPress={handleReset}>
            <Text style={commonStyles.resetButtonText}>Reset All Preferences</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
} 