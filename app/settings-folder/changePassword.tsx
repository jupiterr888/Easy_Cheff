import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../backend/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../settings-folder/styles/changePassword.styles';

// ecranul pentru schimbarea parolei cu validare si resetare
export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // trimite email de resetare parola
  const handleForgotPassword = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert('Error', 'You must be logged in to reset your password');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email for instructions to reset your password.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      Alert.alert('Error', 'Failed to send password reset email. Please try again.');
    }
  };

  // valideaza parola conform cerintelor de securitate
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

  // schimbare parola cu reautentificare si validare
  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert('Error', 'You must be logged in to change your password');
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    // valideaza parola
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      Alert.alert(
        'Password Requirements',
        `Your password must contain:\n${passwordValidation.errors.map(err => `• ${err}`).join('\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      // mai intai reautentifica utilizatorul
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      
      // apoi actualizeaza parola
      await updatePassword(user, newPassword);
      
      // goleste formularul
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      Alert.alert('Success', 'Password updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Current password is incorrect');
      } else if (error.code === 'auth/invalid-credential') {
        Alert.alert('Error', 'Current password is incorrect');
      } else if (error.code === 'auth/requires-recent-login') {
        Alert.alert('Error', 'Please log out and log in again before changing your password');
      } else {
        Alert.alert('Error', 'Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Change Password',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.textDark },
          headerTitleStyle: { color: Colors.background },
        }}
      />
      <SafeAreaView style={styles.container} edges={["left","right"]}>
        <View style={styles.content}>
          {/* campul pentru parola curenta */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Password: </Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your current password"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOldPassword}
                placeholderTextColor={Colors.primary}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowOldPassword(!showOldPassword)}
              >
                <Ionicons 
                  name={showOldPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color={Colors.primaryDark} 
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.forgotPasswordLink}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>
          </View>

          {/* campul pentru parola noua */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password: </Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholderTextColor={Colors.primary}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color={Colors.primaryDark} 
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.passwordRequirements}>
              Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character
            </Text>
          </View>

          {/* campul pentru confirmarea parolei noi */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password: </Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor={Colors.primary}
                editable={!isLoading}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color={Colors.primaryDark} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* butonul pentru salvarea schimbarilor */}
          <TouchableOpacity 
            style={[
              styles.button, 
              (!oldPassword || !newPassword || !confirmPassword || isLoading) && styles.buttonDisabled
            ]} 
            onPress={handleChangePassword}
            disabled={!oldPassword || !newPassword || !confirmPassword || isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Updating...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <SafeAreaView style={{ backgroundColor: Colors.bar }} edges={["bottom"]} />
    </>
  );
} 