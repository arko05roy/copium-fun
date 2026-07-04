import { Share, StyleSheet, Text, View, Pressable } from "react-native";

import type { WalletReceipt } from "../lib/api";
import { webApiBase } from "../lib/api";

type ReceiptShareProps = {
  receipt: WalletReceipt;
};

export function ReceiptShare({ receipt }: ReceiptShareProps) {
  const base = webApiBase();
  const url = `${base}/r/${receipt.id}`;
  const label = receipt.label ?? "RECEIPT";
  const accent =
    label === "CERTIFIED"
      ? "#FF5C5C"
      : label === "PROPHETIC"
        ? "#FFD166"
        : "#B8FF57";

  async function handleShare() {
    const side = receipt.side?.toUpperCase() ?? "—";
    const message =
      label === "CERTIFIED"
        ? `Swiped ${side}. ${label} copium. ${url}`
        : label === "PROPHETIC"
          ? `PROPHETIC ${side}. ${url}`
          : `${label} · ${side}. ${url}`;
    await Share.share({ message, url });
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: accent }]}>{label}</Text>
        <Text style={styles.result}>{receipt.result ?? "—"}</Text>
      </View>
      <Text style={styles.question} numberOfLines={2}>
        {receipt.question}
      </Text>
      <Text style={styles.meta}>
        {receipt.side?.toUpperCase() ?? "—"} · settled {receipt.winning_side?.toUpperCase() ?? "—"}
      </Text>
      <Pressable style={[styles.btn, { borderColor: accent }]} onPress={() => void handleShare()}>
        <Text style={[styles.btnText, { color: accent }]}>Share receipt</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#2A4D38",
    backgroundColor: "#122018",
    padding: 16,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
  result: {
    fontSize: 11,
    color: "#9BB8A8",
    textTransform: "uppercase",
  },
  question: {
    fontSize: 16,
    lineHeight: 22,
    color: "#F4FFF7",
    fontFamily: "Georgia",
  },
  meta: {
    fontSize: 11,
    color: "#6E9080",
    letterSpacing: 1,
  },
  btn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  btnText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
