import { Platform, StyleSheet, Text, View } from "react-native";

import type { FeedContext } from "../lib/api";

type LiveHeaderProps = {
  context: FeedContext | null;
};

export function LiveHeader({ context }: LiveHeaderProps) {
  const score = context?.score ?? "0-0";
  const minute = context?.minute != null ? `${context.minute}'` : context?.phase ?? "—";
  const gap = context?.copiumGap ?? 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.minute}>{minute}</Text>
      </View>
      <View style={styles.gapRow}>
        <Text style={styles.gapLabel}>copium gap</Text>
        <Text style={styles.gapValue}>{gap.toFixed(0)}pp</Text>
        {context?.linePct != null ? (
          <Text style={styles.line}>line {context.linePct.toFixed(0)}%</Text>
        ) : null}
      </View>
    </View>
  );
}

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });
const display = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: "#2A4D38",
    backgroundColor: "#0B1F14",
    padding: 14,
    gap: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  score: {
    fontFamily: display,
    fontSize: 28,
    color: "#F4FFF7",
    fontVariant: ["tabular-nums"],
  },
  minute: {
    fontFamily: mono,
    fontSize: 13,
    color: "#B8FF57",
    letterSpacing: 1,
  },
  gapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gapLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#7CB892",
  },
  gapValue: {
    fontFamily: mono,
    fontSize: 14,
    color: "#FFD166",
    fontWeight: "600",
  },
  line: {
    marginLeft: "auto",
    fontSize: 11,
    color: "#9BB8A8",
  },
});
