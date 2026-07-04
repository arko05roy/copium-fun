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
    #[msg("pool trading window has not closed yet")]
    PoolNotYetClosed,
    #[msg("pool is not locked")]
    PoolNotLocked,
    #[msg("pool is not settled")]
    PoolNotSettled,
    #[msg("settlement root must be non-zero")]
    InvalidSettlementRoot,
    #[msg("settlement root already posted")]
    SettlementAlreadyPosted,
    #[msg("settlement root not posted yet")]
    SettlementNotPosted,
    #[msg("invalid winning side")]
    InvalidWinningSide,
    #[msg("position already withdrawn")]
    NothingToWithdraw,
}
