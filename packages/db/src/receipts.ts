import { createDbClient } from "./client.js";
import type { PulseRow } from "./pulses.js";

export type ReceiptRow = {
  id: string;
  user_id: string | null;
  pulse_id: string | null;
  label: string | null;
  og_image_url: string | null;
  created_at: string | null;
};

export type ReceiptWithPulse = ReceiptRow & {
  pulse: Pick<
    PulseRow,
    "id" | "question" | "line_pct" | "crowd_yes_pct" | "winning_side" | "status"
  > | null;
  side: "yes" | "no" | null;
  result: string | null;
};

function receiptsTable() {
  return createDbClient().from("receipts") as unknown as {
    insert: (row: {
      user_id: string;
      pulse_id: string;
      label: string;
      og_image_url?: string | null;
    }) => {
      select: (cols: string) => {
        single: () => Promise<{ data: ReceiptRow | null; error: { message: string } | null }>;
      };
    };
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        single: () => Promise<{ data: ReceiptRow | null; error: { message: string } | null }>;
        order: (
          col2: string,
          opts: { ascending: boolean },
        ) => {
          limit: (n: number) => Promise<{
            data: ReceiptRow[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
}

function positionsForReceipt() {
  return createDbClient().from("positions") as unknown as {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        eq: (
          col2: string,
          val2: string,
        ) => {
          single: () => Promise<{
            data: { side: "yes" | "no" | null; result: string | null } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
}

export async function getReceipt(receiptId: string): Promise<ReceiptRow | null> {
  const { data, error } = await receiptsTable()
    .select("id, user_id, pulse_id, label, og_image_url, created_at")
    .eq("id", receiptId)
    .single();
  if (error) return null;
  return data;
}

export async function getReceiptForPulseUser(
  pulseId: string,
  userId: string,
): Promise<ReceiptRow | null> {
  const { data, error } = await (createDbClient().from("receipts") as unknown as {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        eq: (col2: string, val2: string) => {
          single: () => Promise<{ data: ReceiptRow | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .select("id, user_id, pulse_id, label, og_image_url, created_at")
    .eq("pulse_id", pulseId)
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function updateReceiptOgUrl(receiptId: string, ogImageUrl: string): Promise<void> {
  const { error } = await (createDbClient().from("receipts") as unknown as {
    update: (patch: { og_image_url: string }) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  })
    .update({ og_image_url: ogImageUrl })
    .eq("id", receiptId);
  if (error) throw new Error(error.message);
}

export async function insertReceipt(input: {
  userId: string;
  pulseId: string;
  label: string;
  ogImageUrl?: string | null;
}): Promise<ReceiptRow> {
  const { data, error } = await receiptsTable()
    .insert({
      user_id: input.userId,
      pulse_id: input.pulseId,
      label: input.label,
      og_image_url: input.ogImageUrl ?? null,
    })
    .select("id, user_id, pulse_id, label, og_image_url, created_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "receipt insert failed");
  return data;
}

export async function listReceiptsForUser(userId: string, limit = 10): Promise<ReceiptRow[]> {
  const { data, error } = await receiptsTable()
    .select("id, user_id, pulse_id, label, og_image_url, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCrowdPosition(
  pulseId: string,
  userId: string,
): Promise<{ side: "yes" | "no" | null; result: string | null } | null> {
  const { data, error } = await positionsForReceipt()
    .select("side, result")
    .eq("pulse_id", pulseId)
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return data;
}

export async function listPositionsForPulse(pulseId: string): Promise<
  {
    id: string;
    user_id: string | null;
    side: "yes" | "no" | null;
    result: string | null;
    created_at: string | null;
  }[]
> {
  const { data, error } = await (createDbClient().from("positions") as unknown as {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => Promise<{
        data: {
          id: string;
          user_id: string | null;
          side: "yes" | "no" | null;
          result: string | null;
          created_at: string | null;
        }[] | null;
        error: { message: string } | null;
      }>;
    };
  })
    .select("id, user_id, side, result, created_at")
    .eq("pulse_id", pulseId);
  if (error) throw new Error(error.message);
  return data ?? [];
}
