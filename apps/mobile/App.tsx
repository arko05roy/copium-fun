import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

import { COPIUM_TAGLINE, SOLANA_DEVNET } from "@copium/config";

import { FeedScreen } from "./src/screens/FeedScreen";

export default function App() {
  return (
    <View style={styles.root}>
      <FeedScreen />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
});
