import { initializeKeypair, createNewMint, createTokenAccount, mintTokens, approveDelegate, transferTokens, revokeDelegate, burnTokens  } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import * as token from '@solana/spl-token'



async function main() {
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

    const tokenAccount = await createTokenAccount(
        connection,
        user,
        mint,
        user.publicKey
    )

    await mintTokens(
        connection,
        user,
        mint,
        tokenAccount.address,
        user,
        100 * 10 ** mintInfo.decimals
    )

    const receiver = web3.Keypair.generate().publicKey
    const receiverTokenAccount = await createTokenAccount(
        connection,
        user,
        mint,
        receiver
    )

    const delegate = web3.Keypair.generate();
    await approveDelegate(
        connection,
        user,
        tokenAccount.address,
        delegate.publicKey,
        user.publicKey,
        50 * 10 ** mintInfo.decimals
    )

    await transferTokens(
        connection,
        user,
        tokenAccount.address,
        receiverTokenAccount.address,
        delegate,
        50 * 10 ** mintInfo.decimals
    )

    await revokeDelegate(
        connection,
        user,
        tokenAccount.address,
        user.publicKey,
    )

    await burnTokens(
        connection,
        user,
        tokenAccount.address,
        mint, user,
        25 * 10 ** mintInfo.decimals
    )
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })

