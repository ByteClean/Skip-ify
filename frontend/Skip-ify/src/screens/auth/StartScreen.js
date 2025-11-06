// src/screens/auth/StartScreen.js
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../../theme/colors';

export default function StartScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')} // Optional: füge Logo hinzu
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Skip-ify</Text>
      <Text style={styles.subtitle}>Deine Musik. Überall. Kostenlos.</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Anmelden</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.outlineButton]}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.outlineButtonText}>Noch kein Konto? Registrieren</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() => navigation.replace('AppTabs')} // Gehe direkt in App
      >
        <Text style={styles.linkText}>Ohne Konto fortfahren</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: COLORS.primary,
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  outlineButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    marginTop: 20,
  },
  linkText: {
    color: COLORS.accent,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});