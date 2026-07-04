use anchor_lang::prelude::*;

use crate::SettlePulse;
use crate::error::CopiumError;
use crate::state::{PoolStatus, PositionSide};

pub fn handler(ctx: Context<SettlePulse>, winning_side: u8) -> Result<()> {
    require!(
        winning_side == PositionSide::Yes as u8 || winning_side == PositionSide::No as u8,
        CopiumError::InvalidWinningSide,
    );

    let pool = &mut ctx.accounts.pulse_pool;
    require!(pool.status == PoolStatus::Locked as u8, CopiumError::PoolNotLocked);
    require!(
        pool.settlement_root != [0u8; 32],
        CopiumError::SettlementNotPosted,
    );

    pool.winning_side = winning_side;
    pool.status = PoolStatus::Settled as u8;
    Ok(())
}
