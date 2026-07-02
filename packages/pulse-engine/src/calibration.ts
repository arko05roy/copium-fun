/** AGILE-PLAN §5.4 — room fee on parimutuel pool. */
export const FEE_BPS = 200;

/** AGILE-PLAN §1.2 — Pulse trading window. */
export const PULSE_WINDOW_SEC = 90;

/** AGILE-PLAN §10.2 — Officer Copium fades when gap exceeds this. */
export const CERTIFIED_GAP_PP = 20;

/** BRAND-DOC §11 — PROPHETIC receipt when crowd YES was contrarian-low at pick. */
export const PROPHETIC_CROWD_MAX = 25;

/** BRAND-DOC §11 — BASED when pick aligned with the line within this band. */
export const BASED_GAP_MAX = 5;

/** AGILE-PLAN §7.2 / detect.ts — odds_move detector threshold. */
export const ODDS_MOVE_THRESHOLD_PP = 5;

/** First third of Pulse window counts as early pick for PROPHETIC label. */
export const PROPHETIC_EARLY_SEC = PULSE_WINDOW_SEC / 3;
