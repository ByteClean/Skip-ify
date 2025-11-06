// src/screens/auth/LoginScreen.js
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { COLORS } from '../../theme/colors';

export default function LoginScreen({ navigation, onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Fehler', 'Bitte alle Felder ausfüllen');
      return;
    }
    // TODO: API-Call
    onAuthSuccess(); // ← Wechsle zu AppTabs
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>E-Mail</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

      <Text style={styles.label}>Passwort</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Anmelden</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.secondary },
  label: { fontSize: 16, color: COLORS.text, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: COLORS.white, fontWeight: '600', fontSize: 16 },
});