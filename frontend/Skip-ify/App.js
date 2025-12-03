// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppTabs from './src/navigation/AppTabs';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS } from './src/theme/colors';
import { LibraryProvider } from './src/contexts/LibraryContext';
import { PlaylistsProvider } from './src/contexts/PlaylistsContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';

const LoadingScreen = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={COLORS.primary || 'blue'} />
    <Text style={styles.text}>Lade Skip-ify...</Text>
  </View>
);

const AppContent = () => {
  const authContext = useAuth();

  // Schutz: Falls useAuth() noch nicht initialisiert ist
  if (!authContext) return <LoadingScreen />;

  const { user, loading } = authContext;

  if (loading) return <LoadingScreen />;

  return user ? <AppTabs /> : <AuthNavigator />;
};

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <PlaylistsProvider>
          <LibraryProvider>
            <NavigationContainer>
              <AppContent />
            </NavigationContainer>
          </LibraryProvider>
        </PlaylistsProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background || '#fff',
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    color: COLORS.text || '#000',
    fontWeight: '600',
  },
});
