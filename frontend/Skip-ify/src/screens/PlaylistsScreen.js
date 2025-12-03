// src/screens/LibraryScreen.js (und die anderen)
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { COLORS } from '../theme/colors';
import { usePlaylists } from '../contexts/PlaylistsContext';
import { useAuth } from '../contexts/AuthContext';

export default function PlaylistsScreen() {
  const { offlinePlaylists, onlinePlaylists, loading, initPlaylists, refreshPlaylists, createOfflinePlaylist, createOnlinePlaylist, deleteOfflinePlaylist, deleteOnlinePlaylist } = usePlaylists();
  const { isOfflineMode } = useAuth();

  useEffect(() => { initPlaylists(); }, []);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    if (isOfflineMode) {
      await createOfflinePlaylist(newName.trim());
    } else {
      await createOnlinePlaylist(newName.trim());
    }
    setNewName('');
    await refreshPlaylists();
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Lade Playlists...</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {!isOfflineMode && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Online Playlists</Text>
          {onlinePlaylists.length === 0 ? (
            <Text style={styles.empty}>Keine Online-Playlists</Text>
          ) : (
            onlinePlaylists.map(p => (
              <View key={p.id} style={styles.item}>
                <Text style={styles.itemText}>{p.name}</Text>
                <TouchableOpacity onPress={() => { deleteOnlinePlaylist(p.id); refreshPlaylists(); }}><Text style={{ color: 'red' }}>Löschen</Text></TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Playlists</Text>
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <TextInput style={styles.input} placeholder="Neue Playlist" value={newName} onChangeText={setNewName} />
          <TouchableOpacity style={styles.createButton} onPress={handleCreate}><Text style={styles.buttonText}>Erstellen</Text></TouchableOpacity>
        </View>
        {offlinePlaylists.length === 0 ? (
          <View style={styles.center}><Text style={styles.empty}>Keine Offline-Playlists</Text></View>
        ) : (
          offlinePlaylists.map(p => (
            <View key={p.id} style={styles.item}>
              <Text style={styles.itemText}>{p.name}</Text>
              <TouchableOpacity onPress={() => { deleteOfflinePlaylist(p.id); refreshPlaylists(); }}><Text style={{ color: 'red' }}>Löschen</Text></TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={refreshPlaylists}><Text style={styles.buttonText}>Aktualisieren</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  item: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8 },
  itemText: { color: COLORS.text },
  empty: { color: COLORS.textLight },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: COLORS.textLight },
  buttonRow: { marginTop: 10, alignItems: 'center' },
  button: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '600' },
  input: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 12, borderRadius: 8, marginRight: 8 },
  createButton: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 8, justifyContent: 'center' },
});