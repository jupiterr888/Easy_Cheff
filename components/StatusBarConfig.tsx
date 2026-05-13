import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { useEffect } from 'react';

export default function StatusBarConfig() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setBackgroundColor('#000000');
      RNStatusBar.setBarStyle('light-content');
    }
  }, []);

  return <StatusBar style="light" />;
} 