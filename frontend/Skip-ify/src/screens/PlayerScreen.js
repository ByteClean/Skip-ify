// src/screens/PlayerScreen.js (kurz)
import React from 'react';
import { View, Text } from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function PlayerScreen() {
  const { params } = useRoute();
  const song = params?.song;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Wiedergabe: {song?.title}</Text>
      <Text>{song?.isLocal ? 'Lokal' : 'Cloud'}</Text>
    </View>
  );
}