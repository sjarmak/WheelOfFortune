/**
 * Wheel of Fortune - iOS App
 *
 * Main entry point.
 */

import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StandardModeApp } from "./src/components/StandardModeApp";

export default function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <StandardModeApp />
    </GestureHandlerRootView>
  );
}
