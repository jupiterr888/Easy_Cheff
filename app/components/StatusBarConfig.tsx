import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';

export function StatusBarConfig() {
  useEffect(() => {
    // seteaza culoarea barii de navigare
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#000000');
    }
  }, []);

  return (
    <View>
      <StatusBar style="light" backgroundColor="#000000" />
    </View>
  );
}     

export default StatusBarConfig;