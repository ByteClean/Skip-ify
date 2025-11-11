// src/config/api.js
import Constants from 'expo-constants';

const { manifest, manifest2 } = Constants;

// Fallback für Expo Go
const getHost = () => {
  if (__DEV__) {
    // Entwicklung: IP aus .env oder manifest
    const devUrl = process.env.API_URL_DEV;
    if (devUrl) return devUrl;

    const debuggerHost = manifest?.debuggerHost || manifest2?.extra?.debuggerHost;
    if (debuggerHost) {
      const ip = debuggerHost.split(':').shift();
      return `http://${ip}:5000`;
    }
    return 'http://localhost:5000';
  } else {
    return process.env.API_URL_PROD || 'https://your-api.com';
  }
};

export const API_URL = getHost();