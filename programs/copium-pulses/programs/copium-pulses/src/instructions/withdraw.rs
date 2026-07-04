use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

use crate::Withdraw;
use crate::error::CopiumError;
use crate::state::{PoolStatus, PositionSide, PULSE_POOL_SEED};

/// AGILE-PLAN §5.4 — room fee on parimutuel pool (matches @copium/pulse-engine).
const FEE_BPS: u64 = 200;

pub fn handler(ctx: Context<Withdraw>) -> Result<()> {
    let pool = &ctx.accounts.pulse_pool;
    require!(pool.status == PoolStatus::Settled as u8, CopiumError::PoolNotSettled);

    let position = &mut ctx.accounts.position;
    require!(position.stake > 0, CopiumError::NothingToWithdraw);
    require!(position.owner == ctx.accounts.owner.key(), CopiumError::InvalidSide);
    require!(position.pool == pool.key(), CopiumError::InvalidSide);

    let payout = payout_for(
        position.stake,
        position.side,
        pool.yes_total,
        pool.no_total,
        pool.winning_side,
    )?;

    if payout > 0 {
        let fixture_id = pool.fixture_id.to_le_bytes();
        let opens_at = pool.opens_at.to_le_bytes();
        let pulse_type = [pool.pulse_type];
        let bump = [pool.bump];
        let seeds = &[
            PULSE_POOL_SEED,
            pool.authority.as_ref(),
            fixture_id.as_ref(),
            pulse_type.as_ref(),
            opens_at.as_ref(),
            bump.as_ref(),
        ];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.owner_token_account.to_account_info(),
                    authority: ctx.accounts.pulse_pool.to_account_info(),
                },
                &[seeds],
            ),
            payout,
        )?;
    }

    position.stake = 0;
    Ok(())
}

fn payout_for(
    stake: u64,
    side: u8,
    yes_total: u64,
    no_total: u64,
    winning_side: u8,
) -> Result<u64> {
    if side != winning_side {
        return Ok(0);
    }

    let winner_total = if winning_side == PositionSide::Yes as u8 {
        yes_total
    } else {
        no_total
    };
    if winner_total == 0 {
        return Ok(0);
    }

    let pool = yes_total
        .checked_add(no_total)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    let prize = pool
        .checked_mul(10_000 - FEE_BPS)
        .ok_or(ProgramError::ArithmeticOverflow)?
        .checked_div(10_000)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    stake
        .checked_mul(prize)
        .ok_or(ProgramError::ArithmeticOverflow)?
        .checked_div(winner_total)
        .ok_or(ProgramError::ArithmeticOverflow)
        .map_err(Into::into)
}
