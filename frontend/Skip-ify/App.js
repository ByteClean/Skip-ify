// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppTabs from './src/navigation/AppTabs';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS } from './src/theme/colors';

const LoadingScreen = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.text}>Lade Skip-ify...</Text>
  </View>
);

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return user ? <AppTabs /> : <AuthNavigator />;
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '600',
  },
});