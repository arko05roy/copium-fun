import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  POSITION_SIDE,
  pulsePoolPda,
  positionPda,
  TXLINE_DEVNET,
  vaultPda,
} from "@copium/pulses-client";
import {
  createAssociatedTokenAccountInstruction,
  createMint,
  getAssociatedTokenAddressSync,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { assert } from "chai";
import { CopiumPulses } from "../target/types/copium_pulses";

const PULSE_TYPE_NEXT_GOAL = 1;

describe("copium-pulses D9", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.copiumPulses as Program<CopiumPulses>;
  const authority = (provider.wallet as anchor.Wallet).payer;
  const trader = Keypair.generate();

  let stakeMint: anchor.web3.PublicKey;
  let traderAta: anchor.web3.PublicKey;

  const fixtureId = 17_926_704n;
  const opensAt = BigInt(Math.floor(Date.now() / 1000) - 10);
  const closesAt = opensAt + 90n;
  const oddsLockRoot = Buffer.alloc(32, 7);
  const oddsMessageHash = Buffer.alloc(32, 9);

  let pool: anchor.web3.PublicKey;
  let vault: anchor.web3.PublicKey;
  let yesPosition: anchor.web3.PublicKey;
  let noPosition: anchor.web3.PublicKey;

  before(async () => {
    stakeMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6,
    );

    traderAta = getAssociatedTokenAddressSync(stakeMint, trader.publicKey);

    const setup = new anchor.web3.Transaction();
    setup.add(
      SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: trader.publicKey,
        lamports: 2e9,
      }),
      createAssociatedTokenAccountInstruction(
        authority.publicKey,
        traderAta,
        trader.publicKey,
        stakeMint,
      ),
    );
    await provider.sendAndConfirm(setup);

    await mintTo(
      provider.connection,
      authority,
      stakeMint,
      traderAta,
      authority,
      5_000_000,
    );

    pool = pulsePoolPda(
      program.programId,
      authority.publicKey,
      fixtureId,
      PULSE_TYPE_NEXT_GOAL,
      opensAt,
    );
    vault = vaultPda(program.programId, pool);
    yesPosition = positionPda(
      program.programId,
      pool,
      trader.publicKey,
      POSITION_SIDE.yes,
    );
    noPosition = positionPda(
      program.programId,
      pool,
      trader.publicKey,
      POSITION_SIDE.no,
    );
  });

  it("create_pulse opens pool + vault", async () => {
    await program.methods
      .createPulse(
        new anchor.BN(fixtureId.toString()),
        PULSE_TYPE_NEXT_GOAL,
        new anchor.BN(opensAt.toString()),
        new anchor.BN(closesAt.toString()),
        [...oddsLockRoot],
      )
      .accountsPartial({
        authority: authority.publicKey,
        pulsePool: pool,
        stakeMint,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const account = await program.account.pulsePool.fetch(pool);
    assert.equal(account.fixtureId.toString(), fixtureId.toString());
    assert.equal(account.pulseType, PULSE_TYPE_NEXT_GOAL);
    assert.equal(account.status, 0);
    assert.equal(account.yesTotal.toString(), "0");
    assert.equal(account.noTotal.toString(), "0");
    assert.deepEqual([...account.oddsLockRoot], [...oddsLockRoot]);
    assert.equal(account.stakeMint.toBase58(), stakeMint.toBase58());

    const vaultAcct = await provider.connection.getTokenAccountBalance(vault);
    assert.equal(vaultAcct.value.uiAmount, 0);
  });

  it("open_position YES + NO updates pool totals", async () => {
    const yesStake = 1_000_000;
    const noStake = 500_000;

    await program.methods
      .openPosition(POSITION_SIDE.yes, new anchor.BN(yesStake), [...oddsMessageHash])
      .accountsPartial({
        owner: trader.publicKey,
        pulsePool: pool,
        position: yesPosition,
        ownerTokenAccount: traderAta,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([trader])
      .rpc();

    await program.methods
      .openPosition(POSITION_SIDE.no, new anchor.BN(noStake), [...oddsMessageHash])
      .accountsPartial({
        owner: trader.publicKey,
        pulsePool: pool,
        position: noPosition,
        ownerTokenAccount: traderAta,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([trader])
      .rpc();

    const account = await program.account.pulsePool.fetch(pool);
    assert.equal(account.yesTotal.toNumber(), yesStake);
    assert.equal(account.noTotal.toNumber(), noStake);

    const yesPos = await program.account.position.fetch(yesPosition);
    assert.equal(yesPos.stake.toNumber(), yesStake);
    assert.equal(yesPos.side, POSITION_SIDE.yes);

    const vaultAcct = await provider.connection.getTokenAccountBalance(vault);
    assert.equal(vaultAcct.value.amount, String(yesStake + noStake));
  });

  it("devnet stake mint matches @copium/config", () => {
    assert.equal(
      TXLINE_DEVNET.usdtMint,
      "ELWTKspHKCnCfCiCiqYw1EDH77k8VCP74dK9qytG2Ujh",
    );
  });
});
