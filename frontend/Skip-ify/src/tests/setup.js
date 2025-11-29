/**
 * Test Setup für React Native Tests
 */

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    manifest: {
      debuggerHost: 'localhost:19000',
    },
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: { song: { id: 'test', title: 'Test Song', uri: 'file://test.mp3' } },
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: jest.fn(() => ({
      loadAsync: jest.fn(() => Promise.resolve()),
      playAsync: jest.fn(() => Promise.resolve()),
      pauseAsync: jest.fn(() => Promise.resolve()),
      unloadAsync: jest.fn(() => Promise.resolve()),
      setOnPlaybackStatusUpdate: jest.fn(),
      getStatusAsync: jest.fn(() => Promise.resolve({
        isLoaded: true,
        isPlaying: false,
        positionMillis: 0,
        durationMillis: 180000,
      })),
      setPositionAsync: jest.fn(() => Promise.resolve()),
    })),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  StyleSheet: { create: jest.fn(s => s) },
  Dimensions: { get: jest.fn(() => ({ width: 375, height: 667 })) },
  ActivityIndicator: 'ActivityIndicator',
  TouchableOpacity: 'TouchableOpacity',
  Platform: { OS: 'ios', select: jest.fn(obj => obj.ios) },
  DevSettings: { addMenuItems: jest.fn() },
}));

global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

process.env.API_URL = 'http://localhost:5000';
