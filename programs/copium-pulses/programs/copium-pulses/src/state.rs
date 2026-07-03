use anchor_lang::prelude::*;

pub const PULSE_POOL_SEED: &[u8] = b"pulse";
pub const POSITION_SEED: &[u8] = b"position";
pub const VAULT_SEED: &[u8] = b"vault";

#[derive(Clone, Copy, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
#[repr(u8)]
pub enum PoolStatus {
    Open = 0,
    Locked = 1,
    Settled = 2,
    Cancelled = 3,
}

#[derive(Clone, Copy, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
#[repr(u8)]
pub enum PositionSide {
    Yes = 0,
    No = 1,
}

/// AGILE-PLAN §8.1 — binary YES/NO pool for one Pulse window.
#[account]
pub struct PulsePool {
    pub authority: Pubkey,
    pub stake_mint: Pubkey,
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
    pub vault_bump: u8,
}

impl PulsePool {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1 + 8 + 8 + 8 + 8 + 1 + 1 + 32 + 32 + 1 + 1;
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

impl Position {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 8 + 32 + 1;
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

impl AgentAccount {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 4 + 1;
}
