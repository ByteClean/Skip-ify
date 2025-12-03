// src/screens/LibraryScreen.js (und die anderen)
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme/colors';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { useLibrary } from '../contexts/LibraryContext';

export default function FavoritesScreen() {
  const { offlineFavorites, onlineFavorites, loading, initFavorites, refreshFavorites, unmarkOffline, unmarkOnline } = useFavorites();
  const { isOfflineMode } = useAuth();
  const { localSongs, onlineSongs } = useLibrary();

  useEffect(() => { initFavorites(); }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Lade Favoriten...</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {!isOfflineMode && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Online Favoriten</Text>
          {onlineFavorites.length === 0 ? (
              <Text style={styles.empty}>Keine Online-Favoriten</Text>
            ) : (
              onlineFavorites.map(s => (
                <View key={s.id} style={styles.item}>
                  <Text style={styles.itemText}>{s.title}</Text>
                  <TouchableOpacity onPress={() => { unmarkOnline(s.id); refreshFavorites(); }}><Text style={{ color: 'red' }}>Entfernen</Text></TouchableOpacity>
                </View>
              ))
            )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Favoriten</Text>
        {offlineFavorites.length === 0 ? (
          <Text style={styles.empty}>Keine Offline-Favoriten</Text>
        ) : (
          offlineFavorites.map(id => {
            const local = localSongs.find(s => s.id === id);
            const online = onlineSongs.find(s => s.id === id);
            const title = local?.title || online?.title || id;
            return (
              <View key={id} style={styles.item}>
                <Text style={styles.itemText}>{title}</Text>
                <TouchableOpacity onPress={() => { unmarkOffline(id); refreshFavorites(); }}><Text style={{ color: 'red' }}>Entfernen</Text></TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={refreshFavorites}><Text style={styles.buttonText}>Aktualisieren</Text></TouchableOpacity>
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
});