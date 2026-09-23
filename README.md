# Blitz Recover

A minimal, open-source recovery interface for Blitz Wallet.\*
Hosted at [recover.blitzwalletapp.com](https://recover.blitzwalletapp.com), it helps you regain access to your funds if Blitz mobile or Blitz web becomes unavailable.

> Self-custodial. Stateless. Open source.

\* Blitz Wallet is built on Spark, so this tool can also recover other Spark wallets that use the standard Spark SDK key derivation. See [Using with other Spark wallets](#using-with-other-spark-wallets).

## Features

- Stateless: your seed phrase is held in memory only and is never written to storage or sent to any server run by this project
- Recovers your main Blitz Wallet balance and transaction history
- Recovers Blitz derived accounts: accounts, savings, pools, gifts, and child accounts
- Send funds out over Spark, Lightning, or on-chain Bitcoin
- QR code scanning for destination addresses (requires camera permission)
- Runs in any modern browser, no backend
- Run your own instance

## How to Use It

Visit [recover.blitzwalletapp.com](https://recover.blitzwalletapp.com), or run it locally (see below).

1. Enter your Blitz Wallet seed phrase.
2. View your available balance and transaction history.
3. Optionally scan for Blitz derived accounts (savings, pools, gifts, and so on).
4. Send your funds to a new wallet of your choice.

## Using with Other Spark Wallets

Because Blitz is built on Spark, this tool also works with other Spark wallets, with limits:

- It opens the Spark SDK's default mainnet account (`m/8797555'`, account 1). Wallets that use a different account number, derivation path, or custom signer will not show up.
- The derived-account scan follows Blitz's own paths and will find nothing for other wallets.

## Trust Model

Please understand what this tool can and cannot guarantee:

- **Your keys stay with you.** The seed phrase never leaves your browser. All signing happens locally.
- **Spark operators are still involved.** Spark is not a trustless system. Checking your balance and sending funds requires talking to the Spark Operators and the Spark Service Provider (currently run by Lightspark, Flashnet and Breez). Spark relies on at least one operator acting honestly.

## Verifying the Code

The source in this repository is fully readable, but the hosted site does not publish reproducible builds or build hashes. You cannot prove the hosted version matches this code. For maximum assurance, build and run it yourself:

```bash
git clone https://github.com/BlakeKaufman/spark-recover.git
```

```bash
cd spark-recover
```

```bash
npm ci
```

```bash
npm run dev
```

`npm ci` installs the exact dependency versions pinned in `package-lock.json`. To build static files you can serve yourself, run `npm run build` and serve the `dist/` folder.

## Running in GitHub Codespaces

1. Open the repository on GitHub.
2. Click **Code**, select the **Codespaces** tab, then **Create codespace on main**.
3. Once the environment is ready, run:

```bash
npm ci
```

```bash
npm run dev
```

## Contributions

Pull requests are welcome. If you have improvements to suggest, open an issue or PR.

## License

Released under the Apache 2.0 license. See [LICENSE](LICENSE) for details.
