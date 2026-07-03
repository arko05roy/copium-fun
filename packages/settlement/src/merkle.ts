export type ProofNodeWire = {
  hash: string | number[] | Uint8Array;
  isRightSibling: boolean;
};

/** TxLINE API returns 32-byte roots as number[] — normalize for anchor. */
export function toBytes32(value: string | number[] | Uint8Array): number[] {
  const bytes = Array.isArray(value)
    ? Uint8Array.from(value)
    : value instanceof Uint8Array
      ? value
      : value.startsWith("0x")
        ? Buffer.from(value.slice(2), "hex")
        : Buffer.from(value, "base64");

  if (bytes.length !== 32) {
    throw new Error(`expected 32-byte root, got ${bytes.length}`);
  }
  return Array.from(bytes);
}

export function toProofNodes(nodes: ProofNodeWire[]) {
  return nodes.map((node) => ({
    hash: toBytes32(node.hash),
    isRightSibling: node.isRightSibling,
  }));
}
