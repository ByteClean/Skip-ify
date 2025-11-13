// src/screens/LibraryScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLibrary } from '../contexts/LibraryContext';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../theme/colors';
import { Upload, Trash2, RefreshCcw } from 'lucide-react-native';

const SongItem = ({ song, onPlay, onDelete }) => (
  <TouchableOpacity style={styles.songItem} onPress={() => onPlay(song)}>
    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
      {song.artist && <Text style={styles.artist}>{song.artist}</Text>}
    </View>
    <View style={styles.actions}>
      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(song)}>
          <Trash2 size={20} color="red" />
        </TouchableOpacity>
      )}
    </View>
  </TouchableOpacity>
);

export default function LibraryScreen({ navigation }) {
  const { localSongs, onlineSongs, loading, refreshLibrary, initLibrary, uploadLocalFile, deleteLocalSong, deleteOnlineSong } = useLibrary();
  const { isOfflineMode, user } = useAuth();

  const handlePlay = (song) => navigation.navigate('Player', { song });
  const handleDelete = (song) => song.isOnline ? deleteOnlineSong(song.id) : deleteLocalSong(song);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Lade Musik...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: 40, paddingBottom: 20 }}>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.initButton} onPress={initLibrary}>
          <Text style={styles.initText}>Library laden</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshLibrary}>
          <RefreshCcw size={20} color="white" />
          <Text style={styles.refreshText}>Aktualisieren</Text>
        </TouchableOpacity>
      </View>

      {!isOfflineMode && onlineSongs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Online Songs</Text>
          {onlineSongs.map(song => (
            <SongItem key={song.id} song={song} onPlay={handlePlay} onDelete={handleDelete} />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lokale Songs</Text>
        {localSongs.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.empty}>Keine Songs gefunden</Text>
            <TouchableOpacity style={styles.uploadBigButton} onPress={uploadLocalFile}>
              <Upload size={40} color={COLORS.primary} />
              <Text style={styles.uploadBigText}>Musik hochladen</Text>
            </TouchableOpacity>
          </View>
        ) : (
          localSongs.map(song => (
            <SongItem key={song.id} song={song} onPlay={handlePlay} onDelete={handleDelete} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginLeft: 20, marginBottom: 10 },
  songItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, elevation: 1 },
  info: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  artist: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  actions: { marginLeft: 10 },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.textSecondary },
  empty: { fontSize: 18, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  uploadBigButton: { backgroundColor: '#f0f8ff', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed' },
  uploadBigText: { marginTop: 10, color: COLORS.primary, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  initButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 10 },
  initText: { color: 'white', fontWeight: 'bold' },
  refreshButton: { backgroundColor: COLORS.secondary, padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  refreshText: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
});
