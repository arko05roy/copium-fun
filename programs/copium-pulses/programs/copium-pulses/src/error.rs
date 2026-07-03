use anchor_lang::prelude::*;

#[error_code]
pub enum CopiumError {
    #[msg("pool is not open for positions")]
    PoolNotOpen,
    #[msg("pool trading window has closed")]
    PoolClosed,
    #[msg("pool has not opened yet")]
    PoolNotYetOpen,
    #[msg("invalid position side")]
    InvalidSide,
    #[msg("stake must be greater than zero")]
    ZeroStake,
    #[msg("closes_at must be after opens_at")]
    InvalidWindow,
}
