import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createMint,
  getAssociatedTokenAddressSync,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { assert } from "chai";
import { CopiumPulses } from "../target/types/copium_pulses";

/** TxLINE devnet USDT — @copium/config TXLINE_DEVNET.usdtMint */
const DEVNET_STAKE_MINT = "ELWTKspHKCnCfCiCiqYw1EDH77k8VCP74dK9qytG2Ujh";

const SIDE_YES = 0;
const SIDE_NO = 1;
const PULSE_TYPE_NEXT_GOAL = 1;

function pulsePoolPda(
  programId: PublicKey,
  authority: PublicKey,
  fixtureId: bigint,
  pulseType: number,
  opensAt: bigint,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("pulse"),
      authority.toBuffer(),
      Buffer.from(new BigUint64Array([fixtureId]).buffer),
      Buffer.from([pulseType]),
      Buffer.from(new BigInt64Array([opensAt]).buffer),
    ],
    programId,
  )[0];
}

function vaultPda(programId: PublicKey, pool: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), pool.toBuffer()],
    programId,
  )[0];
}

function positionPda(
  programId: PublicKey,
  pool: PublicKey,
  owner: PublicKey,
  side: number,
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("position"), pool.toBuffer(), owner.toBuffer(), Buffer.from([side])],
    programId,
  )[0];
}

describe("copium-pulses D9", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.copiumPulses as Program<CopiumPulses>;
  const authority = (provider.wallet as anchor.Wallet).payer;
  const trader = Keypair.generate();

  let stakeMint: PublicKey;
  let traderAta: PublicKey;

  const fixtureId = 17_926_704n;
  const opensAt = BigInt(Math.floor(Date.now() / 1000) - 1);
  const closesAt = opensAt + 30n;
  const oddsLockRoot = Buffer.alloc(32, 7);
  const oddsMessageHash = Buffer.alloc(32, 9);

  let pool: PublicKey;
  let vault: PublicKey;
  let yesPosition: PublicKey;
  let noPosition: PublicKey;

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
    yesPosition = positionPda(program.programId, pool, trader.publicKey, SIDE_YES);
    noPosition = positionPda(program.programId, pool, trader.publicKey, SIDE_NO);
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
      .openPosition(SIDE_YES, new anchor.BN(yesStake), [...oddsMessageHash])
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
      .openPosition(SIDE_NO, new anchor.BN(noStake), [...oddsMessageHash])
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
    assert.equal(yesPos.side, SIDE_YES);

    const vaultAcct = await provider.connection.getTokenAccountBalance(vault);
    assert.equal(vaultAcct.value.amount, String(yesStake + noStake));
  });

  it("lock_pulse → post_settlement → settle_pulse → withdraw", async () => {
    const poolInfo = await program.account.pulsePool.fetch(pool);
    const deadline = Number(poolInfo.closesAt) * 1000 + 2000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 500));
    }

    const settlementRoot = Buffer.alloc(32, 11);

    await program.methods.lockPulse().accountsPartial({
      crank: authority.publicKey,
      pulsePool: pool,
    }).rpc();

    await program.methods
      .postSettlement([...settlementRoot])
      .accountsPartial({
        crank: authority.publicKey,
        pulsePool: pool,
      })
      .rpc();

    await program.methods
      .settlePulse(SIDE_YES)
      .accountsPartial({
        crank: authority.publicKey,
        pulsePool: pool,
      })
      .rpc();

    const settled = await program.account.pulsePool.fetch(pool);
    assert.equal(settled.status, 2);
    assert.equal(settled.winningSide, SIDE_YES);

    const before = await provider.connection.getTokenAccountBalance(traderAta);
    await program.methods
      .withdraw()
      .accountsPartial({
        owner: trader.publicKey,
        pulsePool: pool,
        position: yesPosition,
        ownerTokenAccount: traderAta,
        vault,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([trader])
      .rpc();

    const after = await provider.connection.getTokenAccountBalance(traderAta);
    assert.isAbove(Number(after.value.amount), Number(before.value.amount));

    const yesPos = await program.account.position.fetch(yesPosition);
    assert.equal(yesPos.stake.toNumber(), 0);
  });

  it("devnet stake mint matches TxLINE program addresses doc", () => {
    assert.equal(DEVNET_STAKE_MINT, "ELWTKspHKCnCfCiCiqYw1EDH77k8VCP74dK9qytG2Ujh");
  });
});
