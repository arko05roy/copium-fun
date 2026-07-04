use anchor_lang::prelude::*;

use crate::PostSettlement;
use crate::error::CopiumError;
use crate::state::PoolStatus;

pub fn handler(ctx: Context<PostSettlement>, settlement_root: [u8; 32]) -> Result<()> {
    require!(
        settlement_root != [0u8; 32],
        CopiumError::InvalidSettlementRoot,
    );

    let pool = &mut ctx.accounts.pulse_pool;
    require!(pool.status == PoolStatus::Locked as u8, CopiumError::PoolNotLocked);
    require!(
        pool.settlement_root == [0u8; 32],
        CopiumError::SettlementAlreadyPosted,
    );

    pool.settlement_root = settlement_root;
    Ok(())
}
