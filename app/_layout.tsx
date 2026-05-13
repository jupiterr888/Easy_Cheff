import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from './context/AuthContext';
import QuickNavSheet from '../components/QuickNavSheet';
import StatusBarConfig from '../components/StatusBarConfig';
import MealPlanProvider from './context/MealPlanContext';

import { useColorScheme } from '@/components/useColorScheme';

console.log('[RootLayout] App starting...');

export {
  // prinde orice erori aruncate de componenta layout
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // asigura ca reincarcarea pe /modal pastreaza un buton inapoi
  initialRouteName: '/auth/login',
};

// previne splash screen-ul sa se ascunda automat inainte ca asset-urile sa se incarce complet
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error('[RootLayout] Font loading error:', error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      console.log('[RootLayout] Fonts loaded, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    console.log('[RootLayout] Waiting for fonts to load...');
    return null;
  }

  console.log('[RootLayout] Fonts loaded, rendering AuthProvider');

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showQuickNav, setShowQuickNav] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // user e logat, navigheaza la tabs
      router.replace('/(tabs)');
    } else {
      // user nu e logat, navigheaza la login
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  const defaultScreenOptions = {
    headerShown: false, // ascunde toate header-urile implicit
    contentStyle: { backgroundColor: '#000000' }
  };

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBarConfig />
      <MealPlanProvider>
        <Stack 
          screenOptions={{
            ...defaultScreenOptions,
            headerStyle: {
              backgroundColor: '#000000',
            },
            contentStyle: { 
              backgroundColor: '#000000'
            }
          }}
        >
            <Stack.Screen 
              name="auth" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="pantry-folder" 
              options={{ 
                headerShown: false 
              }} 
            />
            <Stack.Screen 
              name="recipes-folder" 
              options={{ 
                headerShown: false 
              }} 
            />
            <Stack.Screen 
              name="meal-planner" 
              options={{ 
                headerShown: false 
              }} 
            />
          </Stack>
          <QuickNavSheet
            visible={showQuickNav}
            onClose={() => setShowQuickNav(false)}
          />
        </MealPlanProvider>
      </ThemeProvider>
  );
}
