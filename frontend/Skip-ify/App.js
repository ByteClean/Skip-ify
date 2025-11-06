// App.js
import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from './src/theme/colors';

import AuthNavigator from './src/navigation/AuthNavigator';
import AppTabs from './src/navigation/AppTabs';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
  };

  useEffect(() => {
    // Simuliere Auth-Check (später AsyncStorage oder API)
    setTimeout(() => setIsLoggedIn(false), 1000);
  }, []);

  if (isLoggedIn === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.secondary,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <AppTabs />
      ) : (
        <AuthNavigator onAuthSuccess={handleAuthSuccess} />
      )}
    </NavigationContainer>
  );
}