import { HDKey } from "@scure/bip32";
import { entropyToMnemonic, mnemonicToSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { SparkWallet } from "@buildonspark/spark-sdk";

export const RECOVERY_SPACES = {
  // Display account 1 for Blitz's first derived account at path index 4.
  accounts: { label: "Accounts", start: 1, end: 996, offset: 3 },
  savings: { label: "Savings", start: 1, end: 1, offset: 199999 },
  pools: { label: "Pools", start: 1, end: 99999, offset: 99999 },
  gifts: { label: "Gifts", start: 1, end: 98999, offset: 1000 },
  children: { label: "Child accounts", start: 1, end: 2147183647, offset: 299999 },
};

export async function scanUntilGap({ start, end, visit, shouldStop = () => false, onAdvance = () => {} }) {
  let next = start;
  let empty = 0;
  while (next <= end && !shouldStop()) {
    const found = await visit(next);
    if (shouldStop()) break;
    next += 1;
    onAdvance(next);
    empty = found ? 0 : empty + 1;
    if (empty >= 15) break;
  }
  return next;
}

function deriveFromRoot(root, space, index, variant = "current") {
  const config = RECOVERY_SPACES[space];
  if (!config || !Number.isInteger(index) || index < config.start || index > config.end) {
    throw new Error("Invalid recovery index.");
  }
  const pathIndex = config.offset + index;
  const path = space === "gifts" && variant !== "current"
    ? `m/44'/0'/0'/0/${variant === "legacy-offset" ? pathIndex : index}`
    : `m/8797555'/${pathIndex}'/0'`;
  const child = root.derive(path);
  return entropyToMnemonic(child.privateKey.slice(0, 16), wordlist);
}

export async function createRecoveryDeriver(mnemonic) {
  const seed = await mnemonicToSeed(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  return (space, index, variant = "current") => deriveFromRoot(root, space, index, variant);
}

export async function deriveRecoveryMnemonic(mnemonic, space, index, variant = "current") {
  const derive = await createRecoveryDeriver(mnemonic);
  return derive(space, index, variant);
}

export async function openRecoveryWallet(mnemonic) {
  const { wallet } = await SparkWallet.initialize({
    mnemonicOrSeed: mnemonic,
    options: { network: "MAINNET" },
  });
  if (!wallet) throw new Error("The derived wallet could not be opened.");
  return wallet;
}

export function spendableTokens(tokenBalances) {
  if (!(tokenBalances instanceof Map)) return [];
  return [...tokenBalances.entries()]
    .map(([identifier, token]) => ({
      identifier,
      amount: BigInt(token.availableToSendBalance ?? 0),
      owned: BigInt(token.ownedBalance ?? token.availableToSendBalance ?? 0),
      metadata: token.tokenMetadata || {},
    }))
    .filter((token) => token.amount > 0n || token.owned > 0n);
}
