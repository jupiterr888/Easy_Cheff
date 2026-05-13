import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../backend/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, onSnapshot, Timestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../settings-folder/styles/changeName.styles';

// interfata pentru o schimbare de nume cu timestamp
interface NameChange {
  oldName: string;
  newName: string;
  timestamp: Timestamp;
}

// ecranul pentru schimbarea numelui utilizatorului cu istoric si sincronizare real-time
export default function ChangeNameScreen() {
  const [newName, setNewName] = useState('');
  const [nameHistory, setNameHistory] = useState<NameChange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // initializeaza datele la montarea componentei si seteaza listener real-time
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initializeData = async () => {
      try {
        const cleanup = await loadNameHistory();
        unsubscribe = cleanup;
      } catch (error) {
        console.error('Error initializing name history:', error);
      }
    };

    initializeData();

    // functia de cleanup pentru listener in timp real
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // incarca istoricul schimbarilor de nume din firebase cu listener in timp real
  const loadNameHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      
      // seteaza listener in timp real pentru istoricul numelor
      const unsubscribe = onSnapshot(userRef, (userDoc) => {
        try {
      if (userDoc.exists() && userDoc.data().nameHistory) {
        setNameHistory(userDoc.data().nameHistory);
      }
        } catch (error) {
          console.error('Error processing name history:', error);
        }
      }, (error) => {
        console.error('Error listening to name history:', error);
      });

      // returneaza functia de cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up name history listener:', error);
    }
  };

  // schimbare nume cu actualizare profil auth si firestore
  const handleChangeName = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to change your name');
      return;
    }

    if (!newName) {
      Alert.alert('Error', 'Please enter a new name');
      return;
    }

    setIsLoading(true);
    try {
      const oldName = user.displayName || 'Unknown';
      // actualizeaza profilul in firebase auth
      await updateProfile(user, { displayName: newName });
      // sincronizeaza cu firestore
      await setDoc(doc(db, 'users', user.uid), { displayName: newName }, { merge: true });
      
      // salveaza in istoricul numelor cu timestamp
      const nameChange: NameChange = {
        oldName,
        newName,
        timestamp: Timestamp.now()
      };

      await setDoc(doc(db, 'users', user.uid), {
        nameHistory: arrayUnion(nameChange)
      }, { merge: true });

      // actualizeaza starea locala pentru UI imediat
      setNameHistory(prev => [...prev, nameChange]);
      
      Alert.alert('Success', 'Name updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            setNewName('');
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error('Error changing name:', error);
      Alert.alert('Error', 'Failed to change name');
    } finally {
      setIsLoading(false);
    }
  };

  // sterge o intrare din istoricul schimbarilor de nume cu confirmare
  const handleDeleteHistory = async (change: NameChange) => {
    Alert.alert(
      'Delete Name Change History',
      'Are you sure you want to delete this name change history entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
              // sterge din firestore folosind arrayRemove
              await setDoc(doc(db, 'users', user.uid), {
                nameHistory: arrayRemove(change)
              }, { merge: true });
              // actualizeaza starea locala filtrand elementul sters
              setNameHistory(prev => prev.filter(h => h.timestamp.seconds !== change.timestamp.seconds || h.timestamp.nanoseconds !== change.timestamp.nanoseconds));
            } catch (error) {
              console.error('Error deleting name change history:', error);
              Alert.alert('Error', 'Failed to delete name change history');
            }
          }
        }
      ]
    );
  };

  // formateaza data pentru afisare din timestamp firebase
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Change Name',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.textDark },
          headerTitleStyle: { color: Colors.background },
        }}
      />
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* campul pentru introducerea numelui nou */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Edit Your Name: </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your new name"
                value={newName}
                onChangeText={setNewName}
                placeholderTextColor={Colors.primary}
                editable={!isLoading}
              />
            </View>

            {/* butonul pentru salvarea schimbarilor */}
            <TouchableOpacity 
              style={[styles.button, (!newName || isLoading) && styles.buttonDisabled]} 
              onPress={handleChangeName}
              disabled={!newName || isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Updating...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            {/* afiseaza istoricul schimbarilor de nume sortat cronologic */}
            {nameHistory.length > 0 && (
              <View style={styles.historyContainer}>
                <Text style={styles.historyTitle}>Name Change History</Text>
                {[...nameHistory]
                  .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds || b.timestamp.nanoseconds - a.timestamp.nanoseconds)
                  .map((change, index) => (
                    <View key={index} style={styles.historyItem}>
                      <View style={styles.historyContent}>
                        <Text style={styles.historyName}>
                          {change.oldName} → {change.newName}
                        </Text>
                        <Text style={styles.historyDate}>
                          {formatDate(change.timestamp)}
                        </Text>
                      </View>
                      {/* butonul pentru stergerea intrarii din istoric */}
                      <TouchableOpacity onPress={() => handleDeleteHistory(change)} style={styles.deleteIcon}>
                        <Ionicons name="trash-outline" size={20} color={Colors.error} />
                      </TouchableOpacity>
                      <Ionicons name="time-outline" size={20} color={Colors.half} />
                    </View>
                  ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
} 