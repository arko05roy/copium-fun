use anchor_lang::prelude::*;

use crate::CreatePulse;
use crate::error::CopiumError;
use crate::state::PoolStatus;

pub fn handler(
    ctx: Context<CreatePulse>,
    fixture_id: u64,
    pulse_type: u8,
    opens_at: i64,
    closes_at: i64,
    odds_lock_root: [u8; 32],
) -> Result<()> {
    require!(closes_at > opens_at, CopiumError::InvalidWindow);

    let pool = &mut ctx.accounts.pulse_pool;
    pool.authority = ctx.accounts.authority.key();
    pool.stake_mint = ctx.accounts.stake_mint.key();
    pool.fixture_id = fixture_id;
    pool.pulse_type = pulse_type;
    pool.opens_at = opens_at;
    pool.closes_at = closes_at;
    pool.yes_total = 0;
    pool.no_total = 0;
    pool.status = PoolStatus::Open as u8;
    pool.winning_side = 0;
    pool.odds_lock_root = odds_lock_root;
    pool.settlement_root = [0u8; 32];
    pool.bump = ctx.bumps.pulse_pool;
    pool.vault_bump = ctx.bumps.vault;

    Ok(())
}
