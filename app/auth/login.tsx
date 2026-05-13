import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../backend/firebase';
import { FirebaseError } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './styles/login.styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const router = useRouter();

  // trimite email de resetare parola cu validare
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    Alert.alert(
      'Reset Password',
      `A password reset email will be sent to ${email}. Do you want to continue?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, email);
              Alert.alert(
                'Password Reset Email Sent',
                'Please check your email for instructions to reset your password.',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              console.error('Error sending password reset email:', error);
              if (error.code === 'auth/user-not-found') {
                Alert.alert('Error', 'No account found with this email address');
              } else if (error.code === 'auth/invalid-email') {
                Alert.alert('Error', 'Please enter a valid email address');
              } else {
                Alert.alert('Error', 'Failed to send password reset email. Please try again.');
              }
            }
          }
        }
      ]
    );
  };

  // autentificare cu firebase si gestionare sesiune
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // incearca autentificarea cu firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (user) {
        // salveaza preferinta de pastrare logat si datele utilizatorului
        await AsyncStorage.setItem('keepLoggedIn', JSON.stringify(keepLoggedIn));
        await AsyncStorage.setItem('userData', JSON.stringify({
          email: user.email,
          uid: user.uid,
          lastLogin: new Date().toISOString()
        }));
        
        // daca keepLoggedIn este false, seteaza timeout pentru delogare automat
        if (!keepLoggedIn) {
          const signOutTimeout = setTimeout(async () => {
            try {
              await auth.signOut();
              await AsyncStorage.removeItem('firebase:authUser:');
              await AsyncStorage.removeItem('userData');
              router.replace('/auth/login');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          }, 24 * 60 * 60 * 1000); // 24 ore
          
          // salveaza id-ul timeout-ului pentru a-l putea sterge daca e nevoie
          await AsyncStorage.setItem('signOutTimeout', signOutTimeout.toString());
        }
        
        // login reusit
        router.replace('/(tabs)');
      }
    } catch (error) {
      let errorMessage = 'Failed to login. Please try again.';
      
      if (error instanceof FirebaseError) {
        // gestioneaza erorile specifice firebase auth
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address format';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/logo ok.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
                <TouchableOpacity 
                  style={styles.forgotPasswordLink}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.keepLoggedInContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setKeepLoggedIn(!keepLoggedIn)}
                >
                  <View style={[styles.checkboxInner, keepLoggedIn && styles.checkboxChecked]} />
                </TouchableOpacity>
                <Text style={styles.keepLoggedInText}>Keep me logged in</Text>
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textLight} />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => router.push('/auth/register')}
              >
                <Text style={styles.registerButtonText}>Don't have an account? Register</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
}

