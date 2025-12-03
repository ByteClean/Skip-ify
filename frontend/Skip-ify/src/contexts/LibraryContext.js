// src/contexts/LibraryContext.js
import React, { createContext, useContext, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { useAuth, API_URL } from './AuthContext';

const LibraryContext = createContext();
export const useLibrary = () => useContext(LibraryContext);

export const LibraryProvider = ({ children }) => {
  const { token, isOfflineMode } = useAuth();

  const [localSongs, setLocalSongs] = useState([]);
  const [onlineSongs, setOnlineSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const SKIPIFY_DIR = `${FileSystem.documentDirectory}Skip-ify/`;
  const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.wav', '.m4a'];

  const ensureSkipifyDir = async () => {
    const dirInfo = await FileSystem.getInfoAsync(SKIPIFY_DIR);
    if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(SKIPIFY_DIR, { intermediates: true });
  };

  const requestPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    const granted = status === 'granted';
    setPermissionGranted(granted);
    return granted;
  };

  const scanLocalMusic = async () => {
    if (!permissionGranted) return;
    const assets = await MediaLibrary.getAssetsAsync({ mediaType: 'audio', first: 1000 });
    const deviceSongs = assets.assets
      .filter(asset => SUPPORTED_EXTENSIONS.some(ext => asset.filename.toLowerCase().endsWith(ext)))
      .map(asset => ({ id: `device_${asset.id}`, title: asset.filename.replace(/\.[^/.]+$/, ''), uri: asset.uri }));

    await ensureSkipifyDir();
    const skipifyFiles = await FileSystem.readDirectoryAsync(SKIPIFY_DIR);
    const skipifySongs = skipifyFiles
      .filter(file => SUPPORTED_EXTENSIONS.some(ext => file.toLowerCase().endsWith(ext)))
      .map(file => ({ id: `skipify_${file}`, title: file.replace(/\.[^/.]+$/, ''), uri: SKIPIFY_DIR + file }));

    setLocalSongs([...deviceSongs, ...skipifySongs]);
  };

  const fetchOnlineSongs = async () => {
    if (!token) {
      setOnlineSongs([]);
      return;
    }
    try {
      // Use AbortController to avoid hanging fetch requests
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_URL}/songs/list`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      // Helpful debug information when things go wrong
      if (!res) throw new Error('Keine Antwort vom Server');
      // If response not OK provide status + body for easier debugging
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Fehler beim Laden der Online-Songs (status=${res.status}) ${text}`);
      }
      const data = await res.json();
      setOnlineSongs(data.map(song => ({ ...song, isOnline: true })));
    } catch (error) {
      // If aborted or other network errors, clear online list and log
      if (error.name === 'AbortError') console.warn('fetchOnlineSongs aborted due to timeout');
      else console.error('fetchOnlineSongs error:', error);
      setOnlineSongs([]);
    }
  };

  const uploadOnlineFile = async () => {
    if (!token) {
      Alert.alert('Fehler', 'Nicht angemeldet');
      return;
    }
    try {
      setUploading(true);
      const result = await DocumentPicker.getDocumentAsync({ type: ['audio/*'], copyToCacheDirectory: false });
      // Handle different result shapes across SDKs
      const file = result.assets?.[0] || (result.type === 'success' ? result : null);
      if (!file) return;

      let uri = file.uri || file.uri;
      const name = file.name || file.uri.split('/').pop();
      const mimeType = file.mimeType || file.type || 'audio/mpeg';

      // On Android DocumentPicker can return content:// URIs — copy to cache for upload
      if (uri && uri.startsWith('content://')) {
        try {
          const dest = FileSystem.cacheDirectory + name;
          await FileSystem.copyAsync({ from: uri, to: dest });
          uri = dest;
        } catch (e) {
          console.warn('Failed to copy content URI to cache before upload', e);
        }
      }

      const form = new FormData();
      form.append('file', {
        uri,
        name,
        type: mimeType,
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      console.log('uploadOnlineFile', { API_URL, uri, name, mimeType, token: !!token });
      const res = await fetch(`${API_URL}/songs/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Upload fehlgeschlagen (status=${res.status}) ${text}`);
      }

      const data = await res.json().catch(() => ({}));
      Alert.alert('Erfolg', data.message || 'Upload erfolgreich');
      // Refresh online songs after successful upload
      await fetchOnlineSongs();
    } catch (error) {
      if (error.name === 'AbortError') Alert.alert('Fehler', 'Upload abgebrochen (Timeout)');
      else {
        console.error('uploadOnlineFile error:', error);
        Alert.alert('Fehler', error.message || 'Upload fehlgeschlagen');
      }
    }
    finally {
      setUploading(false);
    }
  };

  const initLibrary = async () => {
    setLoading(true);
    await ensureSkipifyDir();
    const granted = await requestPermission();
    if (granted) await scanLocalMusic();
    if (!isOfflineMode && token) await fetchOnlineSongs();
    setLoading(false);
  };

  const refreshLibrary = async () => {
    setLoading(true);
    if (permissionGranted) await scanLocalMusic();
    if (!isOfflineMode && token) await fetchOnlineSongs();
    setLoading(false);
  };

  const uploadLocalFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['audio/*'], copyToCacheDirectory: false });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      const targetPath = SKIPIFY_DIR + file.name;
      await FileSystem.copyAsync({ from: file.uri, to: targetPath });
      Alert.alert('Erfolg', `${file.name} wurde hochgeladen!`);
      await scanLocalMusic();
    } catch {
      Alert.alert('Fehler', 'Datei konnte nicht hochgeladen werden');
    }
  };

  const deleteLocalSong = async (song) => {
    try {
      await FileSystem.deleteAsync(song.uri, { idempotent: true });
      setLocalSongs(s => s.filter(sg => sg.id !== song.id));
      Alert.alert('Gelöscht', `${song.title} wurde entfernt`);
    } catch {
      Alert.alert('Fehler', 'Löschen fehlgeschlagen');
    }
  };

  const deleteOnlineSong = async (songId) => {
    if (!token) return;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_URL}/songs/${songId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Online-Löschen fehlgeschlagen');
      }
      setOnlineSongs(s => s.filter(sg => sg.id !== songId));
      Alert.alert('Gelöscht', 'Online-Song entfernt');
    } catch (error) {
      if (error.name === 'AbortError') Alert.alert('Fehler', 'Löschen abgebrochen (Timeout)');
      else Alert.alert('Fehler', error.message || 'Löschen fehlgeschlagen');
    }
  };

  return (
    <LibraryContext.Provider
      value={{
        localSongs,
        onlineSongs,
        loading,
        uploading,
        permissionGranted,
        initLibrary,
        refreshLibrary,
        uploadLocalFile,
        uploadOnlineFile,
        deleteLocalSong,
        deleteOnlineSong,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};
