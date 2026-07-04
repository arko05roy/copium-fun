import { SOLANA_DEVNET, TXLINE_DEVNET } from "@copium/config";
import { CrankStatus } from "./crank-status";

type ProofNode = {
  hash: string | number[];
  isRightSibling: boolean;
};

type TruthJson = {
  pulseId?: string;
  pulseType?: string;
  fixtureId?: number;
  winningSide?: "yes" | "no";
  goalsAtOpen?: Record<string, number>;
  goalsAtClose?: Record<string, number>;
  validation?: {
    ts?: number;
    statToProve?: { key: number; value: number; period: number };
    statToProve2?: { key: number; value: number; period: number };
    eventStatRoot?: number[];
    summary?: {
      fixtureId: number;
      updateStats?: {
        updateCount: number;
        minTimestamp: number;
        maxTimestamp: number;
      };
      eventStatsSubTreeRoot?: number[];
    };
    statProof?: ProofNode[];
    statProof2?: ProofNode[];
    subTreeProof?: ProofNode[];
    mainTreeProof?: ProofNode[];
  };
  validateResult?: {
    valid?: boolean;
    epochDay?: number;
    dailyScoresPda?: string;
    targetTs?: number;
    method?: string;
  };
  settledAt?: string;
};

type SettlementJson = {
  settlementRootHex?: string;
  validateMethod?: string;
  dailyScoresPda?: string;
};

type PulseRow = {
  id: string;
  fixture_id: number | null;
  pulse_type: string;
  question: string;
  opens_at: string;
  closes_at: string;
  line_pct: number | null;
  status: string | null;
  onchain_pool_pubkey: string | null;
  odds_message_id: string | null;
  odds_proof: unknown;
  settlement_root: string | null;
  winning_side: string | null;
};

type ProofSheetProps = {
  pulse: PulseRow;
  truth: TruthJson | null;
  settlement: SettlementJson | null;
  verifyTx: string | null;
  proofReady: boolean;
};

function bytesToHex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function formatHash(hash: string | number[]): string {
  if (typeof hash === "string") {
    return hash.startsWith("0x") ? hash.slice(2) : hash;
  }
  return bytesToHex(hash);
}

function formatSettlementRoot(
  dbRoot: string | null | undefined,
  hex?: string | null,
): string {
  if (hex) return hex;
  if (!dbRoot) return "—";
  if (dbRoot.startsWith("\\x")) return dbRoot.slice(2);
  return dbRoot;
}

function solscanAccount(pubkey: string): string {
  return `https://solscan.io/account/${pubkey}?cluster=${SOLANA_DEVNET.cluster}`;
}

function solscanTx(signature: string): string {
  return `https://solscan.io/tx/${signature}?cluster=${SOLANA_DEVNET.cluster}`;
}

function MerklePath({ title, nodes }: { title: string; nodes: ProofNode[] }) {
  if (!nodes.length) return null;
  return (
    <section className="space-y-2">
      <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--proof-muted)]">
        {title}
      </h3>
      <ol className="border border-[var(--proof-border)] font-mono text-xs">
        {nodes.map((node, index) => (
          <li
            key={`${title}-${index}`}
            className="grid grid-cols-[2rem_1fr_auto] gap-3 border-b border-[var(--proof-border)] px-3 py-2 last:border-b-0"
          >
            <span className="text-[var(--proof-muted)]">{index}</span>
            <span className="break-all text-[var(--proof-fg)]">{formatHash(node.hash)}</span>
            <span className="text-[var(--proof-muted)]">
              {node.isRightSibling ? "right" : "left"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Field({
  label,
  value,
  mono = true,
  href,
}: {
  label: string;
  value: string;
  mono?: boolean;
  href?: string;
}) {
  return (
    <div className="grid gap-1 border-b border-[var(--proof-border)] py-3 sm:grid-cols-[11rem_1fr]">
      <dt className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--proof-muted)]">
        {label}
      </dt>
      <dd className={`text-sm text-[var(--proof-fg)] break-all ${mono ? "font-mono" : ""}`}>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[var(--proof-accent)]/40 underline-offset-4 hover:text-[var(--proof-accent)]"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export function ProofSheet({
  pulse,
  truth,
  settlement,
  verifyTx,
  proofReady,
}: ProofSheetProps) {
  const validation = truth?.validation;
  const validateResult = truth?.validateResult;
  const subtreeRoot = validation?.summary?.eventStatsSubTreeRoot;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--proof-muted)]">
          Settlement pipeline
        </p>
        <CrankStatus
          pulse={pulse}
          proofReady={proofReady}
          validateValid={validateResult?.valid ?? null}
          verifyTx={verifyTx}
        />
      </section>

      <section>
        <dl>
          <Field label="Pulse ID" value={pulse.id} />
          <Field label="Fixture" value={String(pulse.fixture_id ?? "—")} />
          <Field label="Type" value={pulse.pulse_type} />
          <Field label="Opens" value={pulse.opens_at} />
          <Field label="Closes" value={pulse.closes_at} />
          <Field
            label="Line at open"
            value={pulse.line_pct != null ? `${pulse.line_pct}%` : "—"}
            mono={false}
          />
          <Field
            label="Winning side"
            value={
              pulse.winning_side
                ? pulse.winning_side.toUpperCase()
                : truth?.winningSide?.toUpperCase() ?? "—"
            }
            mono={false}
          />
          <Field
            label="Settlement root"
            value={formatSettlementRoot(pulse.settlement_root, settlement?.settlementRootHex)}
          />
          {pulse.onchain_pool_pubkey ? (
            <Field
              label="Pool PDA"
              value={pulse.onchain_pool_pubkey}
              href={solscanAccount(pulse.onchain_pool_pubkey)}
            />
          ) : null}
          {pulse.odds_message_id ? (
            <Field label="Odds messageId" value={pulse.odds_message_id} />
          ) : null}
          {verifyTx ? (
            <Field label="Verify tx" value={verifyTx} href={solscanTx(verifyTx)} />
          ) : null}
        </dl>
      </section>

      {validateResult ? (
        <section className="space-y-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--proof-muted)]">
            txoracle validate_stat
          </h2>
          <dl className="border border-[var(--proof-border)] px-4">
            <Field label="Program" value={TXLINE_DEVNET.programId} href={solscanAccount(TXLINE_DEVNET.programId)} />
            <Field
              label="Result"
              value={validateResult.valid ? "valid" : "invalid"}
              mono={false}
            />
            <Field label="Method" value={validateResult.method ?? "—"} mono={false} />
            <Field
              label="Daily scores PDA"
              value={validateResult.dailyScoresPda ?? settlement?.dailyScoresPda ?? "—"}
              href={
                validateResult.dailyScoresPda
                  ? solscanAccount(validateResult.dailyScoresPda)
                  : undefined
              }
            />
            <Field
              label="Target timestamp"
              value={
                validateResult.targetTs != null
                  ? new Date(validateResult.targetTs * 1000).toISOString()
                  : "—"
              }
            />
            <Field
              label="Epoch day"
              value={validateResult.epochDay != null ? String(validateResult.epochDay) : "—"}
            />
            {validation?.statToProve ? (
              <Field
                label="Stat proved"
                value={`key ${validation.statToProve.key} · value ${validation.statToProve.value} · period ${validation.statToProve.period}`}
                mono={false}
              />
            ) : null}
            {truth?.settledAt ? <Field label="Settled at" value={truth.settledAt} /> : null}
          </dl>
        </section>
      ) : null}

      {truth?.goalsAtOpen && truth.goalsAtClose ? (
        <section className="space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--proof-muted)]">
            Score window
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <pre className="overflow-x-auto border border-[var(--proof-border)] p-4 font-mono text-xs text-[var(--proof-fg)]">
              {JSON.stringify(truth.goalsAtOpen, null, 2)}
            </pre>
            <pre className="overflow-x-auto border border-[var(--proof-border)] p-4 font-mono text-xs text-[var(--proof-fg)]">
              {JSON.stringify(truth.goalsAtClose, null, 2)}
            </pre>
          </div>
          <p className="font-mono text-xs text-[var(--proof-muted)]">left = at open · right = at close</p>
        </section>
      ) : null}

      {subtreeRoot ? (
        <section className="space-y-2">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--proof-muted)]">
            Event stats subtree root
          </h2>
          <p className="break-all border border-[var(--proof-border)] p-4 font-mono text-xs text-[var(--proof-fg)]">
            {bytesToHex(subtreeRoot)}
          </p>
        </section>
      ) : null}

      {validation ? (
        <section className="space-y-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--proof-muted)]">
            Merkle paths (TxLINE stat-validation)
          </h2>
          <MerklePath title="stat proof" nodes={validation.statProof ?? []} />
          {validation.statProof2?.length ? (
            <MerklePath title="stat proof 2" nodes={validation.statProof2} />
          ) : null}
          <MerklePath title="subtree proof" nodes={validation.subTreeProof ?? []} />
          <MerklePath title="main tree proof" nodes={validation.mainTreeProof ?? []} />
        </section>
      ) : null}

      {pulse.odds_proof ? (
        <section className="space-y-2">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--proof-muted)]">
            Odds lock proof
          </h2>
          <pre className="max-h-72 overflow-auto border border-[var(--proof-border)] p-4 font-mono text-xs text-[var(--proof-fg)]">
            {JSON.stringify(pulse.odds_proof, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
