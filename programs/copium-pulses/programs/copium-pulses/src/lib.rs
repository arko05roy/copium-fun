use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

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
}
