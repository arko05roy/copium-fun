import type { WalletSession } from "@solana/client";
import { getTransactionDecoder } from "@solana/transactions";

type WalletTx = Parameters<NonNullable<WalletSession["sendTransaction"]>>[0];

/** Decode a Blink/Actions base64 wire tx and sign+send via Wallet Standard session. */
export async function signAndSendActionTx(
  wallet: WalletSession,
  transactionBase64: string,
): Promise<string> {
  const sendTx = wallet.sendTransaction;
  if (!sendTx) throw new Error("wallet cannot send devnet tx");

  // ponytail: decoded wire tx lacks kit brand tags; wallet handles it at runtime
  const unsigned = getTransactionDecoder().decode(
    Buffer.from(transactionBase64, "base64"),
  ) as WalletTx;

  if (wallet.signTransaction) {
    const signed = await wallet.signTransaction(unsigned);
    return sendTx(signed);
  }

  return sendTx(unsigned);
}
