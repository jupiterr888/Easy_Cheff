import React, { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuickNavSheet from '../../components/QuickNavSheet';
import Colors from '../../constants/Colors';

export default function AuthLayout() {
  const router = useRouter();
  const [showQuickNav, setShowQuickNav] = useState(false);

  const headerRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      
      
    </View>
  );

  return (
    <>
      <Stack>
        <Stack.Screen
          name="login"
          options={{
            title: 'Login',
            headerShown: true,
            headerStyle: { backgroundColor: Colors.textDark },
            headerTitleStyle: { color: Colors.background },
            headerRight,
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            title: 'Register',
            headerShown: true,
            headerStyle: { backgroundColor: Colors.textDark },
            headerTitleStyle: { color: Colors.background },
            headerRight,
          }}
        />
      </Stack>
      <QuickNavSheet
        visible={showQuickNav}
        onClose={() => setShowQuickNav(false)}
      />
    </>
  );
} 