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
      const res = await fetch(`${API_URL}/songs/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Fehler beim Laden der Online-Songs');
      setOnlineSongs(data.map(song => ({ ...song, isOnline: true })));
    } catch (error) {
      console.error(error);
      setOnlineSongs([]);
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
      const res = await fetch(`${API_URL}/songs/${songId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Online-Löschen fehlgeschlagen');
      setOnlineSongs(s => s.filter(sg => sg.id !== songId));
      Alert.alert('Gelöscht', 'Online-Song entfernt');
    } catch (error) {
      Alert.alert('Fehler', error.message);
    }
  };

  return (
    <LibraryContext.Provider
      value={{
        localSongs,
        onlineSongs,
        loading,
        permissionGranted,
        initLibrary,
        refreshLibrary,
        uploadLocalFile,
        deleteLocalSong,
        deleteOnlineSong,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};
