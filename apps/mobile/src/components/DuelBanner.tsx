import { StyleSheet, Text, View } from "react-native";

import type { DuelScore } from "../lib/api";

type DuelBannerProps = {
  duel: DuelScore;
};

export function DuelBanner({ duel }: DuelBannerProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.kicker}>{duel.roomSlug}</Text>
      <View style={styles.scoreRow}>
        <View style={styles.side}>
          <Text style={styles.label}>You</Text>
          <Text style={styles.scoreYou}>{duel.you}</Text>
        </View>
        <Text style={styles.dash}>—</Text>
        <View style={styles.side}>
          <Text style={styles.label}>Them</Text>
          <Text style={styles.scoreThem}>{duel.them}</Text>
        </View>
      </View>
      <Text style={styles.meta}>{duel.memberCount} in room · match H2H</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderColor: "#FF5C5C",
    borderLeftWidth: 3,
    paddingLeft: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 6,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#7CB892",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
  },
  side: {
    gap: 2,
  },
  label: {
    fontSize: 11,
    color: "#9BB8A8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scoreYou: {
    fontSize: 36,
    fontWeight: "700",
    color: "#B8FF57",
    fontVariant: ["tabular-nums"],
  },
  scoreThem: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FF5C5C",
    fontVariant: ["tabular-nums"],
  },
  dash: {
    fontSize: 28,
    color: "#3D5C4A",
    paddingBottom: 4,
  },
  meta: {
    fontSize: 11,
    color: "#6E9080",
  },
});
