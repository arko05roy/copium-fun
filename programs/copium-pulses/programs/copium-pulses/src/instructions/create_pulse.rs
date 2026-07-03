use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::error::CopiumError;
use crate::state::{PoolStatus, PulsePool, PULSE_POOL_SEED, VAULT_SEED};

#[derive(Accounts)]
#[instruction(fixture_id: u64, pulse_type: u8, opens_at: i64, closes_at: i64)]
pub struct CreatePulse<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = PulsePool::LEN,
        seeds = [
            PULSE_POOL_SEED,
            authority.key().as_ref(),
            &fixture_id.to_le_bytes(),
            &[pulse_type],
            &opens_at.to_le_bytes(),
        ],
        bump,
    )]
    pub pulse_pool: Account<'info, PulsePool>,

    pub stake_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        seeds = [VAULT_SEED, pulse_pool.key().as_ref()],
        bump,
        token::mint = stake_mint,
        token::authority = pulse_pool,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

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
