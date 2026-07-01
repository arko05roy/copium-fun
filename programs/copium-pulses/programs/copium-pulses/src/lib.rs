use anchor_lang::prelude::*;

pub mod state;

declare_id!("GqXTpX5Z2YVSi4R96W61znGaCoN8Mf6N2pet77EWa8Mr");

#[program]
pub mod copium_pulses {
    use super::*;

    /// D1 scaffold — D9 adds create_pulse / open_position / settle crank.
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("copium-pulses devnet scaffold");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
