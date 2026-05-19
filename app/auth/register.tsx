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
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../backend/firebase';
import { FirebaseError } from 'firebase/app';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './styles/register.styles';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../backend/firebase';
import { createAdminRequest } from '../../services/adminService';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [applyForAdmin, setApplyForAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validatePassword = (pass: string) => {
    const minLength = 8;
    const maxLength = 20;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const isLongEnough = pass.length >= minLength;
    const isShortEnough = pass.length <= maxLength;
    const hasNoSpaces = !/\s/.test(pass);

    const errors = [];
    if (!isLongEnough) errors.push(`At least ${minLength} characters`);
    if (!isShortEnough) errors.push(`No more than ${maxLength} characters`);
    if (!hasNoSpaces) errors.push('no spaces allowed');
    if (!hasUpperCase) errors.push('one uppercase letter');
    if (!hasLowerCase) errors.push('one lowercase letter');
    if (!hasNumbers) errors.push('one number');
    if (!hasSpecialChar) errors.push('one special character');

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // valideaza parola
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert(
        'Password Requirements',
        `Your password must contain:\n${passwordValidation.errors.map(err => `• ${err}`).join('\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // creeaza utilizatorul cu firebase auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // actualizeaza profilul utilizatorului cu numele
      await updateProfile(user, {
        displayName: name
      });
      // sincronizeaza cu firestore
      await setDoc(doc(db, 'users', user.uid), { 
        displayName: name,
        isAdmin: false 
      }, { merge: true });

      // Dacă userul a aplicat pentru admin, creează o cerere
      if (applyForAdmin) {
        try {
          await createAdminRequest(user.uid, name, email);
        } catch (error) {
          console.error('Error creating admin request:', error);
          // Nu-i arăta eroarea, doar log-o - contul a fost creat oricum
        }
      }

      Alert.alert(
        'Success',
        applyForAdmin 
          ? 'Account created successfully! Your admin request has been submitted and is pending review.'
          : 'Account created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)')
          }
        ]
      );
    } catch (error) {
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error instanceof FirebaseError) {
        // gestioneaza erorile specifice firebase auth
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address format';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection';
            break;
          default:
            errorMessage = error.message;
        }
      }
      
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea} edges={[ "left", "right"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <Image
                source={require('@/assets/images/logo ok.png')}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join EasyChef to start cooking</Text>

              {/* formularul de register */}
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={Colors.muted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={Colors.muted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor={Colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!loading}
                  />
                  <Text style={styles.passwordRequirements}>
                    Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={Colors.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    editable={!loading}
                  />
                </View>

                {/* Checkbox pentru aplicare admin */}
                <TouchableOpacity 
                  style={styles.adminApplyContainer}
                  onPress={() => setApplyForAdmin(!applyForAdmin)}
                  disabled={loading}
                >
                  <View style={[styles.adminCheckbox, applyForAdmin && styles.adminCheckboxChecked]}>
                    {applyForAdmin && (
                      <Ionicons name="checkmark" size={16} color={Colors.background} />
                    )}
                  </View>
                  <Text style={styles.adminApplyLabel}>Apply for admin account</Text>
                </TouchableOpacity>

                {/* butonul de register cu loading state */}
                <TouchableOpacity
                  style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.textLight} />
                  ) : (
                    <Text style={styles.registerButtonText}>Create Account</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('../auth/login')}>
                    <Text style={styles.loginLink}>Log In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
}

