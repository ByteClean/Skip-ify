// src/screens/LibraryScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useLibrary } from '../contexts/LibraryContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { usePlaylists } from '../contexts/PlaylistsContext';
import { COLORS } from '../theme/colors';
import { Upload, Trash2, RefreshCcw, Heart, PlusCircle } from 'lucide-react-native';

const SongItem = ({ song, onPlay, onDelete, onToggleFavorite, isFavorite, onAddToPlaylist, showFavorite }) => (
  <View style={styles.songItem}>
    <TouchableOpacity style={styles.info} onPress={() => onPlay(song)}>
      <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
      {song.artist && <Text style={styles.artist}>{song.artist}</Text>}
    </TouchableOpacity>
    <View style={styles.actions}>
      {showFavorite && (
        <TouchableOpacity onPress={() => onToggleFavorite(song)} style={{ marginRight: 10 }}>
          <Heart size={18} color={isFavorite ? 'red' : '#999'} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => onAddToPlaylist && onAddToPlaylist(song)} style={{ marginRight: 10 }}>
        <PlusCircle size={18} color="#4A5568" />
      </TouchableOpacity>
      {onDelete && (
        <TouchableOpacity onPress={() => onDelete(song)}>
          <Trash2 size={20} color="red" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function LibraryScreen({ navigation }) {
  const { localSongs, onlineSongs, loading, refreshLibrary, initLibrary, uploadLocalFile, uploadOnlineFile, deleteLocalSong, deleteOnlineSong, uploading } = useLibrary();
  const { offlinePlaylists, onlinePlaylists, addSongToPlaylist } = usePlaylists();
  const { isOfflineMode, user } = useAuth();

  const { offlineFavorites, onlineFavorites, markOffline, unmarkOffline, markOnline, unmarkOnline } = useFavorites();

  const handlePlay = (song) => navigation.navigate('Player', { song });
  const handleDelete = (song) => song.isOnline ? deleteOnlineSong(song.id) : deleteLocalSong(song);

  const isSongFavorite = (song) => {
    if (!song) return false;
    const id = song.id;
    if (isOfflineMode) return offlineFavorites.includes(id);
    // onlineFavorites contains song objects
    if (onlineFavorites.find(s => s.id === id)) return true;
    return offlineFavorites.includes(id);
  };

  const toggleFavorite = async (song) => {
    const id = song.id;
    if (isOfflineMode) {
      if (offlineFavorites.includes(id)) await unmarkOffline(id);
      else await markOffline(id);
      return;
    }
    // Online mode
    const isFav = onlineFavorites.find(s => s.id === id);
    if (isFav) {
      await unmarkOnline(id);
    } else {
      await markOnline(id);
    }
  };

  const handleAddToPlaylist = async (song) => {
    // Build options from playlists
    const buttons = [];
    // Only allow adding to online playlists if the song is an online song
    if (!isOfflineMode && song.isOnline) {
      onlinePlaylists.forEach(p => buttons.push({ text: `Online: ${p.name}`, onPress: async () => { await addSongToPlaylist(p.id, song.id, true); } }));
    }
    // Offline playlists always available
    offlinePlaylists.forEach(p => buttons.push({ text: `Offline: ${p.name}`, onPress: async () => { await addSongToPlaylist(p.id, song.id, false); } }));
    if (buttons.length === 0) return Alert.alert('Keine Playlists', 'Es sind keine Playlists verfügbar oder das Lied kann nicht zur Online-Playlist hinzugefügt werden.');
    buttons.push({ text: 'Abbrechen', style: 'cancel' });
    Alert.alert('Hinzufügen zu Playlist', 'Wähle eine Playlist:', buttons);
  };

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
        {!isOfflineMode && (
          <TouchableOpacity style={[styles.uploadOnlineButton, uploading ? { opacity: 0.7 } : null]} onPress={uploadOnlineFile} disabled={uploading}>
            {uploading ? <ActivityIndicator size="small" color="white" /> : <Upload size={18} color="white" />}
            <Text style={styles.uploadOnlineText}>{uploading ? 'Uploading...' : 'Upload Online'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isOfflineMode && onlineSongs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Online Songs</Text>
          {onlineSongs.map(song => (
            <SongItem key={song.id} song={song} onPlay={handlePlay} onDelete={handleDelete} onToggleFavorite={toggleFavorite} isFavorite={isSongFavorite(song)} onAddToPlaylist={handleAddToPlaylist} showFavorite={isOfflineMode || (!isOfflineMode && song.isOnline)} />
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
            <SongItem key={song.id} song={song} onPlay={handlePlay} onDelete={handleDelete} onToggleFavorite={toggleFavorite} isFavorite={isSongFavorite(song)} onAddToPlaylist={handleAddToPlaylist} showFavorite={isOfflineMode || (!isOfflineMode && song.isOnline)} />
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
  uploadOnlineButton: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  uploadOnlineText: { color: 'white', fontWeight: 'bold', marginLeft: 6 },
});
