import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { FeedPulse } from "../lib/api";
import { pulsePickBlinkUrl } from "../lib/api";

type PulseCardProps = {
  pulse: FeedPulse;
  onSwipePick: (side: "yes" | "no") => void;
};

function secondsLeft(closesAt: string): number {
  return Math.max(0, Math.floor((new Date(closesAt).getTime() - Date.now()) / 1000));
}

export function PulseCard({ pulse, onSwipePick }: PulseCardProps) {
  const [remaining, setRemaining] = useState(() => secondsLeft(pulse.closes_at));
  const pan = useRef(new Animated.ValueXY()).current;
  const tilt = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => setRemaining(secondsLeft(pulse.closes_at)), 500);
    return () => clearInterval(id);
  }, [pulse.closes_at]);

  const crowdYes = pulse.crowd_yes_pct ?? 50;
  const line = pulse.line_pct ?? 50;
  const gap = Math.abs(crowdYes - line);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 || Math.abs(g.dy) > 12,
        onPanResponderMove: (_, g) => {
          pan.setValue({ x: g.dx, y: g.dy * 0.25 });
          tilt.setValue(g.dx / 140);
        },
        onPanResponderRelease: (_, g) => {
          const side: "yes" | "no" | null =
            g.dx > 80 ? "yes" : g.dx < -80 ? "no" : null;
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          Animated.spring(tilt, { toValue: 0, useNativeDriver: false }).start();
          if (side) {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSwipePick(side);
          }
        },
      }),
    [onSwipePick, pan, tilt],
  );

  const rotate = tilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-6deg", "0deg", "6deg"],
  });

  return (
    <Animated.View
      style={[styles.card, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}
      {...responder.panHandlers}
    >
      <View style={styles.topRow}>
        <Text style={styles.countdown}>{remaining}s</Text>
        <Text style={styles.gap}>gap {gap.toFixed(0)}pp</Text>
      </View>

      <Text style={styles.question}>{pulse.question}</Text>

      <View style={styles.barTrack}>
        <View style={[styles.barCrowd, { width: `${crowdYes}%` }]} />
        <View style={[styles.barLine, { left: `${line}%` }]} />
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendYes}>Crowd {crowdYes.toFixed(0)}% YES</Text>
        <Text style={styles.legendLine}>Line {line.toFixed(0)}%</Text>
      </View>

      <View style={styles.swipeHints}>
        <Text style={styles.noHint}>← NO</Text>
        <Text style={styles.yesHint}>YES →</Text>
      </View>

      {pulse.onchain_pool_pubkey ? (
        <Text style={styles.pool} numberOfLines={1}>
          pool {pulse.onchain_pool_pubkey.slice(0, 8)}…
        </Text>
      ) : null}
    </Animated.View>
  );
}

export function openPulsePickBlink(pulseId: string, side: "yes" | "no"): string {
  return pulsePickBlinkUrl(pulseId, side);
}

const display = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#122018",
    borderColor: "#2A4D38",
    borderWidth: 1,
    borderRadius: 4,
    padding: 20,
    minHeight: 280,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countdown: {
    fontFamily: display,
    fontSize: 32,
    color: "#E8F5E9",
    fontVariant: ["tabular-nums"],
  },
  gap: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#7CB892",
  },
  question: {
    fontFamily: display,
    fontSize: 22,
    lineHeight: 28,
    color: "#F4FFF7",
  },
  barTrack: {
    height: 10,
    backgroundColor: "#0B1F14",
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  },
  barCrowd: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#B8FF57",
    opacity: 0.85,
  },
  barLine: {
    position: "absolute",
    top: -2,
    width: 2,
    height: 14,
    marginLeft: -1,
    backgroundColor: "#FFF8E7",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendYes: {
    fontSize: 12,
    color: "#B8FF57",
  },
  legendLine: {
    fontSize: 12,
    color: "#FFF8E7",
  },
  swipeHints: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  noHint: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF5C5C",
    letterSpacing: 1,
  },
  yesHint: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B8FF57",
    letterSpacing: 1,
  },
  pool: {
    fontSize: 10,
    color: "#5A7A68",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  },
});
