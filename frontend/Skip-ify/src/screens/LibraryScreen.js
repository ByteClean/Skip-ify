// src/screens/LibraryScreen.js → Upload-Button
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLibrary } from '../contexts/LibraryContext';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../theme/colors';
import { Upload, Download, Music } from 'lucide-react-native';

const SongItem = ({ song, onPlay }) => {
  const isLocal = song.isLocal;
  const source = song.source;

  return (
    <TouchableOpacity style={styles.songItem} onPress={() => onPlay(song)}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.artist}>{song.artist} • {song.album}</Text>
      </View>
      {source === 'skipify' ? (
        <Upload size={20} color={COLORS.accent} />
      ) : source === 'device' ? (
        <Download size={20} color={COLORS.primary} />
      ) : (
        <Music size={20} color={COLORS.textSecondary} />
      )}
    </TouchableOpacity>
  );
};

export default function LibraryScreen({ navigation }) {
  const { localSongs, loading, permissionGranted, refreshLibrary, uploadLocalFile } = useLibrary();

  const handlePlay = (song) => {
    navigation.navigate('Player', { song });
  };

  const handleUpload = async () => {
    await uploadLocalFile();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Lade lokale Musik...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Deine Bibliothek</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleUpload} style={styles.uploadButton}>
            <Upload size={20} color={COLORS.primary} />
            <Text style={styles.uploadText}>Hochladen</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={refreshLibrary}>
            <Text style={styles.refresh}>Aktualisieren</Text>
          </TouchableOpacity>
        </View>
      </View>

      {localSongs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Keine Songs gefunden</Text>
          <TouchableOpacity style={styles.uploadBigButton} onPress={handleUpload}>
            <Upload size={40} color={COLORS.primary} />
            <Text style={styles.uploadBigText}>Musik hochladen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={localSongs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <SongItem song={item} onPlay={handlePlay} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  uploadText: { color: COLORS.primary, fontSize: 14 },
  refresh: { color: COLORS.primary, fontSize: 16 },
  songItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
  },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  artist: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, color: COLORS.textSecondary },
  empty: { fontSize: 18, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  uploadBigButton: {
    backgroundColor: '#f0f8ff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  uploadBigText: { marginTop: 10, color: COLORS.primary, fontWeight: '600' },
});