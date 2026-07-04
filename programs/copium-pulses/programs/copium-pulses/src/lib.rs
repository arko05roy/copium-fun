use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

declare_id!("GqXTpX5Z2YVSi4R96W61znGaCoN8Mf6N2pet77EWa8Mr");

#[program]
pub mod copium_pulses {
    use super::*;

    pub fn create_pulse(
        ctx: Context<CreatePulse>,
        fixture_id: u64,
        pulse_type: u8,
        opens_at: i64,
        closes_at: i64,
        odds_lock_root: [u8; 32],
    ) -> Result<()> {
        instructions::create_pulse::handler(
            ctx,
            fixture_id,
            pulse_type,
            opens_at,
            closes_at,
            odds_lock_root,
        )
    }

    pub fn open_position(
        ctx: Context<OpenPosition>,
        side: u8,
        stake: u64,
        odds_message_hash: [u8; 32],
    ) -> Result<()> {
        instructions::open_position::handler(ctx, side, stake, odds_message_hash)
    }

    pub fn lock_pulse(ctx: Context<LockPulse>) -> Result<()> {
        instructions::lock_pulse::handler(ctx)
    }

    pub fn post_settlement(
        ctx: Context<PostSettlement>,
        settlement_root: [u8; 32],
    ) -> Result<()> {
        instructions::post_settlement::handler(ctx, settlement_root)
    }

    pub fn settle_pulse(ctx: Context<SettlePulse>, winning_side: u8) -> Result<()> {
        instructions::settle_pulse::handler(ctx, winning_side)
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        instructions::withdraw::handler(ctx)
    }
}

use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::error::CopiumError;
use crate::state::{Position, PulsePool, PULSE_POOL_SEED, POSITION_SEED, VAULT_SEED};

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

#[derive(Accounts)]
pub struct LockPulse<'info> {
    pub crank: Signer<'info>,

    #[account(mut)]
    pub pulse_pool: Account<'info, PulsePool>,
}

#[derive(Accounts)]
pub struct PostSettlement<'info> {
    pub crank: Signer<'info>,

    #[account(mut)]
    pub pulse_pool: Account<'info, PulsePool>,
}

#[derive(Accounts)]
pub struct SettlePulse<'info> {
    pub crank: Signer<'info>,

    #[account(mut)]
    pub pulse_pool: Account<'info, PulsePool>,
}

#[derive(Accounts)]
#[instruction(side: u8, stake: u64, odds_message_hash: [u8; 32])]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub pulse_pool: Account<'info, PulsePool>,

    #[account(
        init_if_needed,
        payer = owner,
        space = Position::LEN,
        seeds = [
            POSITION_SEED,
            pulse_pool.key().as_ref(),
            owner.key().as_ref(),
            &[side],
        ],
        bump,
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        constraint = owner_token_account.mint == pulse_pool.stake_mint @ CopiumError::InvalidSide,
        constraint = owner_token_account.owner == owner.key() @ CopiumError::InvalidSide,
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [VAULT_SEED, pulse_pool.key().as_ref()],
        bump = pulse_pool.vault_bump,
        constraint = vault.mint == pulse_pool.stake_mint @ CopiumError::InvalidSide,
        constraint = vault.owner == pulse_pool.key() @ CopiumError::InvalidSide,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub pulse_pool: Account<'info, PulsePool>,

    #[account(
        mut,
        seeds = [
            POSITION_SEED,
            pulse_pool.key().as_ref(),
            owner.key().as_ref(),
            &[position.side],
        ],
        bump = position.bump,
        constraint = position.pool == pulse_pool.key() @ CopiumError::InvalidSide,
        constraint = position.owner == owner.key() @ CopiumError::InvalidSide,
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        constraint = owner_token_account.mint == pulse_pool.stake_mint @ CopiumError::InvalidSide,
        constraint = owner_token_account.owner == owner.key() @ CopiumError::InvalidSide,
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [VAULT_SEED, pulse_pool.key().as_ref()],
        bump = pulse_pool.vault_bump,
        constraint = vault.mint == pulse_pool.stake_mint @ CopiumError::InvalidSide,
        constraint = vault.owner == pulse_pool.key() @ CopiumError::InvalidSide,
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
