"use client";

type BundleDownloadProps = {
  pulseId: string;
  bundle: Record<string, unknown>;
};

export function BundleDownload({ pulseId, bundle }: BundleDownloadProps) {
  function handleDownload() {
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `copium-proof-${pulseId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex min-h-11 items-center gap-2 rounded border border-[var(--proof-accent)] bg-[var(--proof-accent)]/10 px-5 py-2.5 font-mono text-sm font-medium text-[var(--proof-accent)] transition hover:bg-[var(--proof-accent)]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--proof-accent)]"
    >
      Download bundle JSON
    </button>
  );
}
