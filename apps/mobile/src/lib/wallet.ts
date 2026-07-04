import * as SecureStore from "expo-secure-store";

const WALLET_KEY = "copium_wallet_pubkey";
const ROOM_KEY = "copium_active_room_id";

export async function getStoredWallet(): Promise<string | null> {
  return SecureStore.getItemAsync(WALLET_KEY);
}

export async function setStoredWallet(pubkey: string): Promise<void> {
  await SecureStore.setItemAsync(WALLET_KEY, pubkey.trim());
}

export async function getStoredRoomId(): Promise<string | null> {
  return SecureStore.getItemAsync(ROOM_KEY);
}

export async function setStoredRoomId(roomId: string): Promise<void> {
  await SecureStore.setItemAsync(ROOM_KEY, roomId.trim());
}
