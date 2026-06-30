import { txlineApiOrigin, txlineGuestAuthUrl } from "./env.js";

export type GuestSession = {
  jwt: string;
  apiOrigin: string;
};

export async function startGuestSession(): Promise<GuestSession> {
  const apiOrigin = txlineApiOrigin();
  const url = txlineGuestAuthUrl();
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`guest auth failed ${res.status}: ${body}`);
  }
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("guest auth response missing token");
  return { jwt: data.token, apiOrigin };
}

export function txlineHeaders(jwt: string, apiToken: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${jwt}`,
    "X-Api-Token": apiToken,
  };
}
