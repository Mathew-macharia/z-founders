import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Alert } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import socketService from './src/services/socket';

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();

    // Global socket listener
    const unsubscribe = socketService.on('notification', (data) => {
      // Show in-app notification/alert
      // In a real app, use a Toast component. For now, Alert is fine.
      Alert.alert(
        '🔔 New Notification',
        data.message || 'You have a new interaction!',
        [{ text: 'OK' }]
      );
    });

    return () => {
      unsubscribe();
      socketService.disconnect();
    };
  }, [initializeAuth]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
