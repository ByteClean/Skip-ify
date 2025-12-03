import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useAuth, API_URL } from './AuthContext';

const FavoritesContext = createContext();
export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({ children }) => {
  const { token, isOfflineMode } = useAuth();

  const [offlineFavorites, setOfflineFavorites] = useState([]); // array of song ids
  const [onlineFavorites, setOnlineFavorites] = useState([]); // array of song objects
  const [loading, setLoading] = useState(false);

  const STORAGE_KEY = 'skipify_favorites_offline';

  const loadOffline = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setOfflineFavorites(JSON.parse(raw));
      else setOfflineFavorites([]);
    } catch (error) {
      console.warn('loadOffline favorites failed', error);
      setOfflineFavorites([]);
    }
  };

  const saveOffline = async (list) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
      console.warn('saveOffline favorites failed', error);
    }
  };

  const fetchOnlineFavorites = async () => {
    if (!token) return setOnlineFavorites([]);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_URL}/favorites/list`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Fehler beim Laden der Favoriten (status=${res.status}) ${text}`);
      }
      const data = await res.json();
      setOnlineFavorites(data.map(s => ({ ...s, isOnline: true })));
    } catch (error) {
      if (error.name === 'AbortError') console.warn('fetchOnlineFavorites aborted');
      else console.error('fetchOnlineFavorites error', error);
      setOnlineFavorites([]);
    }
  };

  const initFavorites = async () => {
    setLoading(true);
    await loadOffline();
    if (!isOfflineMode && token) await fetchOnlineFavorites();
    setLoading(false);
  };

  const refreshFavorites = async () => {
    setLoading(true);
    await loadOffline();
    if (!isOfflineMode && token) await fetchOnlineFavorites();
    setLoading(false);
  };

  const markOffline = async (songId) => {
    if (offlineFavorites.includes(songId)) return;
    const next = [songId, ...offlineFavorites];
    setOfflineFavorites(next);
    await saveOffline(next);
  };

  const unmarkOffline = async (songId) => {
    const next = offlineFavorites.filter(id => id !== songId);
    setOfflineFavorites(next);
    await saveOffline(next);
  };

  const markOnline = async (songId) => {
    if (!token) return Alert.alert('Fehler', 'Nicht angemeldet');
    try {
      const res = await fetch(`${API_URL}/favorites/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ song_id: songId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Markieren fehlgeschlagen');
      await fetchOnlineFavorites();
    } catch (error) {
      Alert.alert('Fehler', error.message || 'Markieren fehlgeschlagen');
    }
  };

  const unmarkOnline = async (songId) => {
    if (!token) return Alert.alert('Fehler', 'Nicht angemeldet');
    try {
      const res = await fetch(`${API_URL}/favorites/unmark`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ song_id: songId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Entfernen fehlgeschlagen');
      await fetchOnlineFavorites();
    } catch (error) {
      Alert.alert('Fehler', error.message || 'Entfernen fehlgeschlagen');
    }
  };

  useEffect(() => {
    saveOffline(offlineFavorites);
  }, [offlineFavorites]);

  return (
    <FavoritesContext.Provider
      value={{
        offlineFavorites,
        onlineFavorites,
        loading,
        initFavorites,
        refreshFavorites,
        markOffline,
        unmarkOffline,
        markOnline,
        unmarkOnline,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;
