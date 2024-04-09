import * as web3 from "@solana/web3.js"
import * as token from '@solana/spl-token'
import * as fs from "fs"
import dotenv from "dotenv"
dotenv.config()

export async function initializeKeypair(
  connection: web3.Connection
): Promise<web3.Keypair> {
  let keypair: web3.Keypair

  if (!process.env.PRIVATE_KEY) {
    console.log("Creating .env file")
    keypair = web3.Keypair.generate()
    fs.writeFileSync(".env", `PRIVATE_KEY=[${keypair.secretKey.toString()}]`)
  } else {
    const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[]
    const secretKey = Uint8Array.from(secret)
    keypair = web3.Keypair.fromSecretKey(secretKey)
  }

  console.log("PublicKey:", keypair.publicKey.toBase58())
  await airdropSolIfNeeded(keypair, connection)
  return keypair
}

export async function airdropSolIfNeeded(
  signer: web3.Keypair,
  connection: web3.Connection
) {
  const balance = await connection.getBalance(signer.publicKey)
  console.log("Current balance is", balance / web3.LAMPORTS_PER_SOL)

  if (balance < web3.LAMPORTS_PER_SOL) {
    console.log("Airdropping 1 SOL...")
    const airdropSignature = await connection.requestAirdrop(
      signer.publicKey,
      web3.LAMPORTS_PER_SOL
    )

    const latestBlockHash = await connection.getLatestBlockhash()

    await connection.confirmTransaction(
      {
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSignature,
      },
      "finalized"
    )

    const newBalance = await connection.getBalance(signer.publicKey)
    console.log("New balance is", newBalance / web3.LAMPORTS_PER_SOL)
  }
}

export async function createNewMint(
    connection: web3.Connection,
    payer: web3.Keypair,
    mintAuthority: web3.PublicKey,
    freezeAuthority: web3.PublicKey,
    decimals: number
): Promise<web3.PublicKey> {

  const tokenMint = await token.createMint(
      connection,
      payer,
      mintAuthority,
      freezeAuthority,
      decimals
  );

  console.log(
      `Token Mint: https://explorer.solana.com/address/${tokenMint}?cluster=devnet`
  );

  return tokenMint;
}

export async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)

  const mint = await createNewMint(
      connection,
      user,
      user.publicKey,
      user.publicKey,
      2
  )

  const mintInfo = await token.getMint(connection, mint);
}

export async function createTokenAccount(
    connection: web3.Connection,
    payer: web3.Keypair,
    mint: web3.PublicKey,
    owner: web3.PublicKey
) {
  const tokenAccount = await token.getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      owner
  )

  console.log(
      `Token Account: https://explorer.solana.com/address/${tokenAccount.address}?cluster=devnet`
  )

  return tokenAccount
}

export async function approveDelegate(
    connection: web3.Connection,
    payer: web3.Keypair,
    account: web3.PublicKey,
    delegate: web3.PublicKey,
    owner: web3.Signer | web3.PublicKey,
    amount: number
) {
  const transactionSignature = await token.approve(
      connection,
      payer,
      account,
      delegate,
      owner,
      amount
  )

  console.log(
      `Approve Delegate Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

export async function transferTokens(
    connection: web3.Connection,
    payer: web3.Keypair,
    source: web3.PublicKey,
    destination: web3.PublicKey,
    owner: web3.Keypair,
    amount: number
) {
  const transactionSignature = await token.transfer(
      connection,
      payer,
      source,
      destination,
      owner,
      amount
  )

  console.log(
      `Transfer Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

export async function revokeDelegate(
    connection: web3.Connection,
    payer: web3.Keypair,
    account: web3.PublicKey,
    owner: web3.Signer | web3.PublicKey,
) {
  const transactionSignature = await token.revoke(
      connection,
      payer,
      account,
      owner,
  )

  console.log(
      `Revote Delegate Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

export async function burnTokens(
    connection: web3.Connection,
    payer: web3.Keypair,
    account: web3.PublicKey,
    mint: web3.PublicKey,
    owner: web3.Keypair,
    amount: number
) {
  const transactionSignature = await token.burn(
      connection,
      payer,
      account,
      mint,
      owner,
      amount
  )

  console.log(
      `Burn Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

export async function mintTokens(
    connection: web3.Connection,
    payer: web3.Keypair,
    mint: web3.PublicKey,
    destination: web3.PublicKey,
    authority: web3.Keypair,
    amount: number
) {
  const transactionSignature = await token.mintTo(
      connection,
      payer,
      mint,
      destination,
      authority,
      amount
  )

  console.log(
      `Mint Token Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}
