use anchor_lang::prelude::*;

use crate::LockPulse;
use crate::error::CopiumError;
use crate::state::PoolStatus;

pub fn handler(ctx: Context<LockPulse>) -> Result<()> {
    let clock = Clock::get()?;
    let pool = &mut ctx.accounts.pulse_pool;
    require!(pool.status == PoolStatus::Open as u8, CopiumError::PoolNotOpen);
    require!(clock.unix_timestamp >= pool.closes_at, CopiumError::PoolNotYetClosed);

    pool.status = PoolStatus::Locked as u8;
    Ok(())
}
