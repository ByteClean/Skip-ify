// src/contexts/LibraryContext.js
javascript// src/contexts/LibraryContext.js → ERWEITERT
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';

const LibraryContext = createContext();

export const useLibrary = () => useContext(LibraryContext);

export const LibraryProvider = ({ children }) => {
  const [localSongs, setLocalSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const SKIPIFY_DIR = `${FileSystem.documentDirectory}Skip-ify/`;
  const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.wav', '.m4a'];

  // Ordner erstellen
  const ensureSkipifyDir = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(SKIPIFY_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(SKIPIFY_DIR, { intermediates: true });
        console.log('Skip-ify Ordner erstellt:', SKIPIFY_DIR);
      }
    } catch (error) {
      console.error('Ordner erstellen fehlgeschlagen:', error);
    }
  };

  // Berechtigungen
  const requestPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    const granted = status === 'granted';
    setPermissionGranted(granted);
    return granted;
  };

  // Datei hochladen (lokal)
  const uploadLocalFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/flac', 'audio/wav', 'audio/mp4'],
        copyToCacheDirectory: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const fileName = file.name;
      const targetPath = SKIPIFY_DIR + fileName;

      // Kopiere in Skip-ify Ordner
      await FileSystem.copyAsync({
        from: file.uri,
        to: targetPath,
      });

      Alert.alert('Erfolg', `${fileName} wurde in Skip-ify hochgeladen!`);

      // Neu scannen
      await scanLocalMusic();
    } catch (error) {
      Alert.alert('Fehler', 'Datei konnte nicht hochgeladen werden');
      console.error(error);
    }
  };

  // Lokale Musik scannen (Gerät + Skip-ify Ordner)
  const scanLocalMusic = async () => {
    if (!permissionGranted) {
      setLocalSongs([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Gerätespeicher
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 1000,
      });

      const deviceSongs = assets.assets
        .filter(asset => {
          const ext = asset.filename.toLowerCase();
          return SUPPORTED_EXTENSIONS.some(suffix => ext.endsWith(suffix));
        })
        .map(asset => ({
          id: `device_${asset.id}`,
          title: asset.filename.replace(/\.[^/.]+$/, ''),
          artist: 'Lokaler Künstler',
          album: 'Gerätespeicher',
          duration: asset.duration,
          uri: asset.uri,
          isLocal: true,
          source: 'device',
        }));

      // 2. Skip-ify Ordner
      await ensureSkipifyDir();
      const skipifyFiles = await FileSystem.readDirectoryAsync(SKIPIFY_DIR);
      const skipifySongs = [];

      for (const fileName of skipifyFiles) {
        if (SUPPORTED_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext))) {
          const uri = SKIPIFY_DIR + fileName;
          const info = await FileSystem.getInfoAsync(uri);
          if (info.exists) {
            skipifySongs.push({
              id: `skipify_${fileName}`,
              title: fileName.replace(/\.[^/.]+$/, ''),
              artist: 'Skip-ify Upload',
              album: 'Lokale Uploads',
              duration: 0,
              uri,
              isLocal: true,
              source: 'skipify',
            });
          }
        }
      }

      // Kombiniere
      setLocalSongs([...deviceSongs, ...skipifySongs]);
    } catch (error) {
      console.error('Scan failed:', error);
      setLocalSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // Init
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await ensureSkipifyDir();
      const granted = await requestPermission();
      if (granted) {
        await scanLocalMusic();
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const refreshLibrary = async () => {
    setLoading(true);
    await scanLocalMusic();
  };

  const value = {
    localSongs,
    loading,
    permissionGranted,
    refreshLibrary,
    requestPermission,
    uploadLocalFile, // ← NEU
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};