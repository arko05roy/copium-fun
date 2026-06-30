import { StyleSheet, Text, View } from "react-native";

import { COPIUM_TAGLINE, SOLANA_DEVNET } from "@copium/config";

export function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>copium.fun · {SOLANA_DEVNET.cluster}</Text>
      <Text style={styles.title}>{COPIUM_TAGLINE}</Text>
      <Text style={styles.subtitle}>
        Track 3 Feed shell — Pulse cards land in EPIC H.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  kicker: {
    color: "#888",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
  },
});
