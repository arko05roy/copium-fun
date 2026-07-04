import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { COPIUM_TAGLINE, SOLANA_DEVNET } from "@copium/config";

import { DuelBanner } from "../components/DuelBanner";
import { PulseCard, openPulsePickBlink } from "../components/PulseCard";
import { ReceiptShare } from "../components/ReceiptShare";
import {
  fetchOpenPulses,
  fetchRoomDuel,
  fetchWalletReceipts,
  joinRoom,
  joinRoomBlinkUrl,
  type DuelScore,
  type FeedPulse,
  type WalletReceipt,
} from "../lib/api";
import { getStoredRoomId, getStoredWallet, setStoredRoomId, setStoredWallet } from "../lib/wallet";

export function FeedScreen() {
  const [pulses, setPulses] = useState<FeedPulse[]>([]);
  const [receipts, setReceipts] = useState<WalletReceipt[]>([]);
  const [duel, setDuel] = useState<DuelScore | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [walletDraft, setWalletDraft] = useState("");
  const [roomDraft, setRoomDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [open, w, r] = await Promise.all([
        fetchOpenPulses(),
        getStoredWallet(),
        getStoredRoomId(),
      ]);
      setPulses(open);
      setWallet(w);
      setRoomId(r);
      if (w && r) {
        setDuel(await fetchRoomDuel(r, w));
      } else {
        setDuel(null);
      }
      if (w) {
        try {
          setReceipts(await fetchWalletReceipts(w));
        } catch {
          setReceipts([]);
        }
      } else {
        setReceipts([]);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "feed load failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  async function handleSaveWallet() {
    const trimmed = walletDraft.trim();
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
      setError("invalid devnet wallet");
      return;
    }
    await setStoredWallet(trimmed);
    setWallet(trimmed);
    setWalletDraft("");
    void load();
  }

  async function handleSaveRoom() {
    const trimmed = roomDraft.trim();
    if (!trimmed) return;
    await setStoredRoomId(trimmed);
    setRoomId(trimmed);
    setRoomDraft("");
    if (wallet) {
      try {
        const msg = await joinRoom(trimmed, wallet);
        setStatus(msg);
        void load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "join failed");
      }
    }
  }

  function handleSwipe(pulse: FeedPulse, side: "yes" | "no") {
    const url = openPulsePickBlink(pulse.id, side);
    setStatus(`Opening ${side.toUpperCase()} on devnet…`);
    void Linking.openURL(url);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor="#B8FF57"
        />
      }
    >
      <Text style={styles.kicker}>Track 3 · Match Feed · §17C</Text>
      <Text style={styles.title}>{COPIUM_TAGLINE}</Text>
      <Text style={styles.cluster}>{SOLANA_DEVNET.cluster} · live open pulses</Text>

      {!wallet ? (
        <View style={styles.setup}>
          <Text style={styles.setupLabel}>Devnet wallet (Phantom)</Text>
          <TextInput
            style={styles.input}
            placeholder="pubkey"
            placeholderTextColor="#5A7A68"
            autoCapitalize="none"
            autoCorrect={false}
            value={walletDraft}
            onChangeText={setWalletDraft}
          />
          <Pressable style={styles.btn} onPress={() => void handleSaveWallet()}>
            <Text style={styles.btnText}>Save wallet</Text>
          </Pressable>
        </View>
      ) : null}

      {wallet && !roomId ? (
        <View style={styles.setup}>
          <Text style={styles.setupLabel}>Room id or join Blink</Text>
          <TextInput
            style={styles.input}
            placeholder="uuid"
            placeholderTextColor="#5A7A68"
            autoCapitalize="none"
            value={roomDraft}
            onChangeText={setRoomDraft}
          />
          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={() => void handleSaveRoom()}>
              <Text style={styles.btnText}>Join room</Text>
            </Pressable>
            {roomDraft.trim() ? (
              <Pressable
                style={styles.btnOutline}
                onPress={() => {
                  void Linking.openURL(joinRoomBlinkUrl(roomDraft.trim()));
                  setStatus("Opening join-room Blink…");
                }}
              >
                <Text style={styles.btnOutlineText}>Blink</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {receipts.length > 0 ? (
        <View style={styles.receiptStack}>
          <Text style={styles.sectionLabel}>Your receipts</Text>
          {receipts.map((r) => (
            <ReceiptShare key={r.id} receipt={r} />
          ))}
        </View>
      ) : null}

      {duel ? <DuelBanner duel={duel} /> : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color="#B8FF57" style={{ marginTop: 40 }} />
      ) : pulses.length === 0 ? (
        <Text style={styles.empty}>No open pulses — run verify:d16 or orchestrator spawn.</Text>
      ) : (
        <View style={styles.stack}>
          {pulses.map((pulse) => (
            <PulseCard
              key={pulse.id}
              pulse={pulse}
              onSwipePick={(side) => handleSwipe(pulse, side)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const display = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#071510",
  },
  content: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 8,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: "#7CB892",
  },
  title: {
    fontFamily: display,
    fontSize: 26,
    color: "#F4FFF7",
    marginTop: 4,
  },
  cluster: {
    fontSize: 12,
    color: "#6E9080",
    marginBottom: 12,
  },
  setup: {
    gap: 8,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2A4D38",
  },
  setupLabel: {
    fontSize: 11,
    color: "#9BB8A8",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#2A4D38",
    padding: 10,
    color: "#F4FFF7",
    fontSize: 14,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  },
  btn: {
    alignSelf: "flex-start",
    backgroundColor: "#B8FF57",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#071510",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: "#B8FF57",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnOutlineText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B8FF57",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  receiptStack: {
    gap: 10,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: "#7CB892",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  stack: {
    gap: 16,
    marginTop: 8,
  },
  empty: {
    color: "#9BB8A8",
    fontSize: 14,
    marginTop: 24,
    lineHeight: 20,
  },
  error: {
    color: "#FF5C5C",
    fontSize: 13,
  },
  status: {
    color: "#B8FF57",
    fontSize: 12,
  },
});
