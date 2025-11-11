// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_URL_DEV, API_URL_PROD } from '@env';
import Constants from 'expo-constants';

export const API_URL = __DEV__
  ? API_URL_DEV || 'http://10.0.2.2:5000'
  : API_URL_PROD || 'https://your-api.com';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Load auth state on startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        const [savedToken, savedUser, offline] = await Promise.all([
          AsyncStorage.getItem('token').catch(() => null),
          AsyncStorage.getItem('user').catch(() => null),
          AsyncStorage.getItem('offlineMode').catch(() => null),
        ]);

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
        if (offline === 'true') {
          setIsOfflineMode(true);
          setUser({ id: 'offline', name: 'Gast', email: 'offline@skipify.com' });
        }
      } catch (error) {
        console.warn('Auth load failed:', error);
        setIsOfflineMode(true);
        setUser({ id: 'offline', name: 'Gast', email: 'offline@skipify.com' });
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(() => {
      console.warn('Auth loading timeout → Offline-Modus');
      setIsOfflineMode(true);
      setUser({ id: 'offline', name: 'Gast', email: 'offline@skipify.com' });
      setLoading(false);
    }, 3000);

    initAuth().then(() => clearTimeout(timeout));
  }, []);

  // Register function
  const register = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registrierung fehlgeschlagen');
      }

      Alert.alert('Erfolg', 'Konto erstellt! Du kannst dich jetzt anmelden.');
      return { success: true };
    } catch (error) {
      Alert.alert('Fehler', error.message);
      return { success: false, error: error.message };
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login fehlgeschlagen');
      }

      const { access_token, user } = data;
      await Promise.all([
        AsyncStorage.setItem('token', access_token),
        AsyncStorage.setItem('user', JSON.stringify(user)),
        AsyncStorage.setItem('offlineMode', 'false'),
      ]);

      setToken(access_token);
      setUser(user);
      setIsOfflineMode(false);

      return { success: true };
    } catch (error) {
      Alert.alert('Fehler', error.message);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('offlineMode'), // WICHTIG: Immer entfernen!
      ]);
      setToken(null);
      setUser(null);
      setIsOfflineMode(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Offline mode
  const enterOfflineMode = async () => {
  try {
    await AsyncStorage.setItem('offlineMode', 'true');
    setIsOfflineMode(true);
    setUser({ id: 'offline', name: 'Gast', email: 'offline@skipify.com' });
    setToken(null); // Sicherstellen: kein Token im Offline-Modus
  } catch (error) {
    console.error('Failed to enter offline mode:', error);
  }
};

  const value = {
    user,
    token,
    isOfflineMode,
    loading,
    register,
    login,
    logout,
    enterOfflineMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};