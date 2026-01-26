/**
 * Wheel of Fortune - iOS App
 *
 * Main entry point with mode selection.
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KidModeApp } from './src/components/KidModeApp';
import { StandardModeApp } from './src/components/StandardModeApp';
import { GameMode } from './src/engine/types';

const MODE_STORAGE_KEY = 'wof_game_mode';

export default function App(): React.JSX.Element {
  const [gameMode, setGameMode] = useState<GameMode>('STANDARD');
  const [showModeSelector, setShowModeSelector] = useState(false);

  // Load saved mode (default to STANDARD)
  useEffect(() => {
    AsyncStorage.getItem(MODE_STORAGE_KEY).then((saved) => {
      if (saved === 'KID') {
        setGameMode('KID');
      } else {
        // Default to STANDARD, clear any other values
        setGameMode('STANDARD');
        AsyncStorage.setItem(MODE_STORAGE_KEY, 'STANDARD');
      }
    });
  }, []);

  // Save mode
  useEffect(() => {
    AsyncStorage.setItem(MODE_STORAGE_KEY, gameMode);
  }, [gameMode]);

  const handleModeChange = () => {
    // Toggle between modes for now
    setGameMode(prev => prev === 'STANDARD' ? 'KID' : 'STANDARD');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      {gameMode === 'KID' ? (
        <KidModeApp onModeChange={handleModeChange} />
      ) : (
        <StandardModeApp onModeChange={handleModeChange} />
      )}
    </GestureHandlerRootView>
  );
}
