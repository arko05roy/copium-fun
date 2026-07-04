import { SOLANA_DEVNET } from "@copium/config";
import { StyleSheet, Text, View } from "react-native";

export function DevnetBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {SOLANA_DEVNET.cluster} · no payment
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#2A4D38",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#9BB8A8",
    fontFamily: "Menlo",
  },
});
