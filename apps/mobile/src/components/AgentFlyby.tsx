import { Platform, StyleSheet, Text, View } from "react-native";

import type { AgentFlyby as AgentFlybyRow } from "../lib/api";

type AgentFlybyProps = {
  flyby: AgentFlybyRow | null;
};

export function AgentFlyby({ flyby }: AgentFlybyProps) {
  if (!flyby) return null;

  const side = flyby.side?.toUpperCase() ?? "—";
  const stake =
    flyby.stake != null ? `${(flyby.stake / 1_000_000).toFixed(2)} USDT` : "—";

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.agent}>{flyby.agentName}</Text>
        <Text style={[styles.side, flyby.side === "yes" ? styles.yes : styles.no]}>{side}</Text>
      </View>
      <Text style={styles.question} numberOfLines={1}>
        {flyby.pulseQuestion}
      </Text>
      <Text style={styles.meta}>
        {stake}
        {flyby.executeTx ? ` · ${flyby.executeTx.slice(0, 8)}…` : ""}
      </Text>
      {flyby.reasoning ? (
        <Text style={styles.reasoning} numberOfLines={2}>
          {flyby.reasoning}
        </Text>
      ) : null}
    </View>
  );
}

const mono = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#2A4D38",
    borderLeftWidth: 3,
    borderLeftColor: "#7CB892",
    backgroundColor: "#0d1812",
    padding: 12,
    gap: 6,
    marginBottom: 8,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agent: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#7CB892",
  },
  side: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  yes: { color: "#B8FF57" },
  no: { color: "#FF5C5C" },
  question: {
    fontSize: 13,
    color: "#E8F5E9",
    lineHeight: 18,
  },
  meta: {
    fontFamily: mono,
    fontSize: 10,
    color: "#5A7A68",
  },
  reasoning: {
    fontSize: 11,
    color: "#9BB8A8",
    fontStyle: "italic",
    lineHeight: 15,
  },
});
