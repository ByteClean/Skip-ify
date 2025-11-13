// src/contexts/LibraryContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

const LibraryContext = createContext();

export const useLibrary = () => useContext(LibraryContext);

export const LibraryProvider = ({ children }) => {
  const [localSongs, setLocalSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const SKIPIFY_DIR = `${FileSystem.documentDirectory}Skip-ify/`;
  const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.wav', '.m4a'];

  const ensureSkipifyDir = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(SKIPIFY_DIR);
      if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(SKIPIFY_DIR, { intermediates: true });
    } catch (error) {
      console.error('Ordner erstellen fehlgeschlagen:', error);
    }
  };

  const requestPermission = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      return granted;
    } catch {
      setPermissionGranted(false);
      return false;
    }
  };

  const scanLocalMusic = async () => {
    if (!permissionGranted) {
      setLocalSongs([]);
      setLoading(false);
      return;
    }
    try {
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
    } catch (error) {
      console.error('Scan failed:', error);
      setLocalSongs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await ensureSkipifyDir();
      const granted = await requestPermission();
      if (granted) await scanLocalMusic();
      else setLoading(false);
    };
    init();
  }, []);

  const refreshLibrary = async () => {
    setLoading(true);
    await scanLocalMusic();
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
    } catch (error) {
      Alert.alert('Fehler', 'Datei konnte nicht hochgeladen werden');
    }
  };

  return (
    <LibraryContext.Provider
      value={{ localSongs, loading, permissionGranted, refreshLibrary, uploadLocalFile, requestPermission }}
    >
      {children}
    </LibraryContext.Provider>
  );
};
