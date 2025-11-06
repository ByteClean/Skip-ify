// src/screens/ProfileScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ← HINZUGEFÜGT

export default function ProfileScreen() {
  const { user, logout, isOfflineMode } = useAuth();

  const handleLeaveOffline = async () => {
    Alert.alert(
      'Offline-Modus verlassen',
      'Möchtest du zurück zum Startbildschirm?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Verlassen',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('offlineMode');
              await logout(); // Nutzt erweiterte logout-Funktion
            } catch (error) {
              console.error('Leave offline failed:', error);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchtest du dich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.name || 'Gast'}</Text>

        <Text style={styles.label}>E-Mail</Text>
        <Text style={styles.value}>{user?.email || 'offline@skipify.com'}</Text>

        <Text style={styles.label}>Modus</Text>
        <Text style={styles.value}>
          {isOfflineMode ? 'Offline (lokal)' : 'Online'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={isOfflineMode ? handleLeaveOffline : handleLogout}
      >
        <Text style={styles.logoutText}>
          {isOfflineMode ? 'Offline-Modus verlassen' : 'Abmelden'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});