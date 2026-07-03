use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

use crate::OpenPosition;
use crate::error::CopiumError;
use crate::state::{PoolStatus, PositionSide};

pub fn handler(
    ctx: Context<OpenPosition>,
    side: u8,
    stake: u64,
    odds_message_hash: [u8; 32],
) -> Result<()> {
    require!(stake > 0, CopiumError::ZeroStake);
    require!(
        side == PositionSide::Yes as u8 || side == PositionSide::No as u8,
        CopiumError::InvalidSide,
    );

    let clock = Clock::get()?;
    let pool = &mut ctx.accounts.pulse_pool;
    require!(pool.status == PoolStatus::Open as u8, CopiumError::PoolNotOpen);
    require!(clock.unix_timestamp >= pool.opens_at, CopiumError::PoolNotYetOpen);
    require!(clock.unix_timestamp < pool.closes_at, CopiumError::PoolClosed);

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.owner_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        stake,
    )?;

    if side == PositionSide::Yes as u8 {
        pool.yes_total = pool
            .yes_total
            .checked_add(stake)
            .ok_or(ProgramError::ArithmeticOverflow)?;
    } else {
        pool.no_total = pool
            .no_total
            .checked_add(stake)
            .ok_or(ProgramError::ArithmeticOverflow)?;
    }

    let position = &mut ctx.accounts.position;
    if position.stake == 0 {
        position.pool = pool.key();
        position.owner = ctx.accounts.owner.key();
        position.side = side;
        position.bump = ctx.bumps.position;
    }
    position.stake = position
        .stake
        .checked_add(stake)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    position.odds_message_hash = odds_message_hash;

    Ok(())
}
