// src/screens/auth/StartScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../theme/colors';

export default function StartScreen({ navigation, onAuthSuccess }) {
  const { enterOfflineMode } = useAuth();

  const handleOffline = async () => {
    try {
      await enterOfflineMode(); // Setzt offlineMode + user
      onAuthSuccess(); // Wechselt zu AppTabs
    } catch (error) {
      console.error('Offline mode failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Willkommen bei Skip-ify</Text>
      <Text style={styles.subtitle}>Deine Musik, überall.</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Anmelden</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.registerButton]}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.buttonText}>Registrieren</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.offlineButton}
        onPress={handleOffline}
      >
        <Text style={styles.offlineText}>Ohne Konto fortfahren (Offline)</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Offline-Modus: Nur lokale Musik & Bibliothek
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: COLORS.primary,
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  registerButton: {
    backgroundColor: COLORS.accent,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  offlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  offlineText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  hint: {
    marginTop: 30,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});