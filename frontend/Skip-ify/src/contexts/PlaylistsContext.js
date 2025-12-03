import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { useAuth, API_URL } from './AuthContext';

const PlaylistsContext = createContext();
export const usePlaylists = () => useContext(PlaylistsContext);

export const PlaylistsProvider = ({ children }) => {
  const { token, isOfflineMode } = useAuth();

  const [offlinePlaylists, setOfflinePlaylists] = useState([]);
  const [onlinePlaylists, setOnlinePlaylists] = useState([]);
  const [loading, setLoading] = useState(false);

  const STORAGE_KEY = 'skipify_playlists_offline';

  const loadOffline = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setOfflinePlaylists(JSON.parse(raw));
      else setOfflinePlaylists([]);
    } catch (error) {
      console.warn('loadOffline playlists failed', error);
      setOfflinePlaylists([]);
    }
  };

  const saveOffline = async (list) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
      console.warn('saveOffline playlists failed', error);
    }
  };

  const fetchOnlinePlaylists = async () => {
    if (!token) return setOnlinePlaylists([]);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_URL}/playlists/list`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Fehler beim Laden der Playlists (status=${res.status}) ${text}`);
      }
      const data = await res.json();
      setOnlinePlaylists(data.map(p => ({ ...p, isOnline: true })));
    } catch (error) {
      if (error.name === 'AbortError') console.warn('fetchOnlinePlaylists aborted');
      else console.error('fetchOnlinePlaylists error', error);
      setOnlinePlaylists([]);
    }
  };

  const initPlaylists = async () => {
    setLoading(true);
    await loadOffline();
    if (!isOfflineMode && token) await fetchOnlinePlaylists();
    setLoading(false);
  };

  const refreshPlaylists = async () => {
    setLoading(true);
    await loadOffline();
    if (!isOfflineMode && token) await fetchOnlinePlaylists();
    setLoading(false);
  };

  // Offline CRUD
  const createOfflinePlaylist = async (name, songs = []) => {
    const newP = { id: `local_${Date.now()}`, name, songs };
    const next = [newP, ...offlinePlaylists];
    setOfflinePlaylists(next);
    await saveOffline(next);
    return newP;
  };

  const deleteOfflinePlaylist = async (id) => {
    const next = offlinePlaylists.filter(p => p.id !== id);
    setOfflinePlaylists(next);
    await saveOffline(next);
  };

  // Online CRUD
  const createOnlinePlaylist = async (name, songs = []) => {
    if (!token) return Alert.alert('Fehler', 'Nicht angemeldet');
    try {
      const res = await fetch(`${API_URL}/playlists/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, songs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erstellen fehlgeschlagen');
      await fetchOnlinePlaylists();
      return data.playlist;
    } catch (error) {
      Alert.alert('Fehler', error.message || 'Erstellen fehlgeschlagen');
    }
  };

  const deleteOnlinePlaylist = async (id) => {
    if (!token) return;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_URL}/playlists/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Löschen fehlgeschlagen');
      }
      await fetchOnlinePlaylists();
      Alert.alert('Erfolg', 'Playlist gelöscht');
    } catch (error) {
      if (error.name === 'AbortError') Alert.alert('Fehler', 'Löschen abgebrochen (Timeout)');
      else Alert.alert('Fehler', error.message || 'Löschen fehlgeschlagen');
    }
  };

  const updateOnlinePlaylist = async (playlistId, updates = {}) => {
    if (!token) return Alert.alert('Fehler', 'Nicht angemeldet');
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Aktualisierung fehlgeschlagen');
      await fetchOnlinePlaylists();
      return true;
    } catch (error) {
      Alert.alert('Fehler', error.message || 'Aktualisierung fehlgeschlagen');
      return false;
    }
  };

  const addSongToPlaylist = async (playlistId, songId, isOnline) => {
    if (isOnline) {
      // find playlist, append song id
      const pl = onlinePlaylists.find(p => p.id === playlistId);
      if (!pl) return Alert.alert('Fehler', 'Playlist nicht gefunden');
      const songs = Array.isArray(pl.songs) ? pl.songs : [];
      if (songs.includes(songId)) return Alert.alert('Info', 'Song bereits in Playlist');
      const nextSongs = [...songs, songId];
      return updateOnlinePlaylist(playlistId, { songs: nextSongs });
    } else {
      const next = offlinePlaylists.map(p => p.id === playlistId ? { ...p, songs: Array.isArray(p.songs) ? [...p.songs, songId] : [songId] } : p);
      setOfflinePlaylists(next);
      await saveOffline(next);
      return true;
    }
  };

  useEffect(() => {
    // keep offline list in sync on changes
    saveOffline(offlinePlaylists);
  }, [offlinePlaylists]);

  return (
    <PlaylistsContext.Provider
      value={{
        offlinePlaylists,
        onlinePlaylists,
        loading,
        initPlaylists,
        refreshPlaylists,
        createOfflinePlaylist,
        deleteOfflinePlaylist,
        createOnlinePlaylist,
        deleteOnlinePlaylist,
        updateOnlinePlaylist,
        addSongToPlaylist,
      }}
    >
      {children}
    </PlaylistsContext.Provider>
  );
};

export default PlaylistsContext;
