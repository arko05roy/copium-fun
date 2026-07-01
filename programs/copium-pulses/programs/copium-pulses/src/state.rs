use anchor_lang::prelude::*;

/// AGILE-PLAN §8.1 — account layouts (instructions land D9+).
#[allow(dead_code)]
#[account]
pub struct PulsePool {
    pub authority: Pubkey,
    pub fixture_id: u64,
    pub pulse_type: u8,
    pub opens_at: i64,
    pub closes_at: i64,
    pub yes_total: u64,
    pub no_total: u64,
    pub status: u8,
    pub winning_side: u8,
    pub odds_lock_root: [u8; 32],
    pub settlement_root: [u8; 32],
    pub bump: u8,
}

#[account]
pub struct Position {
    pub pool: Pubkey,
    pub owner: Pubkey,
    pub side: u8,
    pub stake: u64,
    pub odds_message_hash: [u8; 32],
    pub bump: u8,
}

#[account]
pub struct AgentAccount {
    pub authority: Pubkey,
    pub agent_wallet: Pubkey,
    pub agent_slug_hash: [u8; 8],
    pub total_pnl: i64,
    pub trade_count: u32,
    pub bump: u8,
}
