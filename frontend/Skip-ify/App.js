// App.js
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppTabs';
import { COLORS } from './src/theme/colors';
import { View, ActivityIndicator } from 'react-native';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = loading

  // TODO: Später AsyncStorage oder API prüfen
  useEffect(() => {
    setTimeout(() => setIsLoggedIn(false), 1000); // Simuliere Ladezeit
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.secondary }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}