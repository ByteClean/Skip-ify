// src/screens/PlayerScreen.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

// ⚠️ If Slider doesn’t work on your system, install:
// npm install @react-native-community/slider
import Slider from '@react-native-community/slider';

export default function PlayerScreen() {
  const { params } = useRoute();
  const song = params?.song;

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const soundRef = useRef(null);

  useEffect(() => {
    let soundObject;

    const loadSound = async () => {
      if (!song?.uri) return;
      setLoading(true);

      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
        });

        soundObject = new Audio.Sound();
        soundRef.current = soundObject;

        soundObject.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

        await soundObject.loadAsync(
          { uri: song.uri },
          { shouldPlay: false }
        );

        const status = await soundObject.getStatusAsync();
        setDuration(status.durationMillis || 0);
      } catch (error) {
        console.error('Audio-Fehler:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSound();

    return () => {
      if (soundObject) soundObject.unloadAsync();
    };
  }, [song]);

  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) return;

    if (!isSeeking) setPosition(status.positionMillis || 0);
    setDuration(status.durationMillis || 0);

    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  };

  const togglePlayback = async () => {
    const s = soundRef.current;
    if (!s) return;
    const status = await s.getStatusAsync();

    if (status.isPlaying) {
      await s.pauseAsync();
      setIsPlaying(false);
    } else {
      await s.playAsync();
      setIsPlaying(true);
    }
  };

  const handleSeek = async (value) => {
    const s = soundRef.current;
    if (!s) return;
    setIsSeeking(true);
    await s.setPositionAsync(value);
    setIsSeeking(false);
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (!song) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Kein Song ausgewählt.</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>
        {song.title || 'Unbekannter Titel'}
      </Text>
      <Text style={{ marginBottom: 30 }}>
        {song.isLocal ? 'Lokal gespeichert' : 'Cloud'}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <>
          {/* Seekbar */}
          <Slider
            style={{ width: '90%', height: 40 }}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingStart={() => setIsSeeking(true)}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#007AFF"
          />

          {/* Time Display */}
          <View
            style={{
              width: '90%',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text>{formatTime(position)}</Text>
            <Text>{formatTime(duration)}</Text>
          </View>

          {/* Play/Pause */}
          <TouchableOpacity
            onPress={togglePlayback}
            style={{
              backgroundColor: '#007AFF',
              padding: 15,
              borderRadius: 50,
              marginTop: 40,
            }}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              color="#fff"
              size={28}
            />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
