// src/screens/LibraryScreen.js (und die anderen)
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bibliothek (in Arbeit)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: COLORS.text },
});