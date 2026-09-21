import { useEffect, useRef, useState } from "react";
import { useSpark } from "../../contexts/sparkContext";
import {
  RECOVERY_SPACES,
  createRecoveryDeriver,
  openRecoveryWallet,
  scanUntilGap,
  spendableTokens,
} from "../../functions/recovery/derivedWallets";

const categories = ["accounts", "savings", "pools", "gifts", "children"];
const formatSats = (value) => Number(value || 0).toLocaleString();
const resultLabel = (item) => {
  const feature = `${RECOVERY_SPACES[item.category].label} #${item.index}`;
  const origin =
    item.source === "main" ? "main seed" : `Account #${item.source}`;
  const legacy = item.variant === "current" ? "" : " · older gift";
  return `${feature} from ${origin}${legacy}`;
};

export default function DerivedRecovery() {
  const { getRecoveryMnemonic, getMainSparkAddress, refreshWallet } =
    useSpark();
  const [category, setCategory] = useState("accounts");
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [scannedCategory, setScannedCategory] = useState(null);
  const [canContinue, setCanContinue] = useState(false);
  const [review, setReview] = useState(null);
  const wallets = useRef(new Map());
  const accountSeeds = useRef(new Map());
  const nextIndices = useRef(new Map());
  const scanRun = useRef(0);
  useEffect(
    () => () => {
      scanRun.current += 1;
    },
    [],
  );

  const stopScan = () => {
    scanRun.current += 1;
    setBusy(false);
    setCanContinue(true);
    setProgress(
      "Scan stopped. Continue to resume from the last completed number.",
    );
  };
  const scan = async (continuePrevious = false) => {
    const mainSeed = getRecoveryMnemonic();
    if (!mainSeed) {
      setError("Restore the main wallet again to scan these paths.");
      return;
    }
    // Savings is a single path off the main seed; no account sweep needed.
    const scanAccounts = category !== "savings";
    const run = ++scanRun.current;
    setError("");
    setProgress("");
    setBusy(true);
    setScannedCategory(category);
    let scanned = 0;
    let found = 0;
    if (!continuePrevious || scannedCategory !== category) {
      nextIndices.current.clear();
      accountSeeds.current.clear();
      setResults((current) =>
        current.filter(
          (item) =>
            item.category !== category &&
            (!scanAccounts || item.category !== "accounts"),
        ),
      );
    }

    const moreToScan = () => {
      if (
        scanAccounts &&
        (nextIndices.current.get("main:accounts") ??
          RECOVERY_SPACES.accounts.start) <= RECOVERY_SPACES.accounts.end
      )
        return true;
      if (category === "accounts") return false;
      const sources = scanAccounts
        ? ["main", ...accountSeeds.current.keys()]
        : ["main"];
      return sources.some(
        (sourceKey) =>
          (nextIndices.current.get(`${sourceKey}:${category}`) ??
            RECOVERY_SPACES[category].start) <= RECOVERY_SPACES[category].end,
      );
    };

    const scanSpace = async (sourceKey, sourceSeed, space) => {
      const config = RECOVERY_SPACES[space];
      const derive = await createRecoveryDeriver(sourceSeed);
      const variants =
        space === "gifts"
          ? ["current", "legacy", "legacy-offset"]
          : ["current"];
      const cursorKey = `${sourceKey}:${space}`;
      await scanUntilGap({
        start: nextIndices.current.get(cursorKey) ?? config.start,
        end: config.end,
        shouldStop: () => run !== scanRun.current,
        onAdvance: (next) => nextIndices.current.set(cursorKey, next),
        visit: async (index) => {
          let foundAtIndex = false;
          for (const variant of variants) {
            if (run !== scanRun.current) return false;
            setProgress(`${scanned} wallets checked`);
            const derivedSeed = derive(space, index, variant);
            if (space === "accounts")
              accountSeeds.current.set(String(index), derivedSeed);
            const wallet = await openRecoveryWallet(derivedSeed);
            const balance = await wallet.getBalance();
            if (run !== scanRun.current) return false;
            scanned += 1;
            const sats = Number(
              balance.balance ?? balance.satsBalance?.available ?? 0,
            );
            const ownedSats = Number(balance.satsBalance?.owned ?? sats);
            const tokens = spendableTokens(balance.tokenBalances);
            const key = `${sourceKey}:${space}:${index}:${variant}`;
            if (sats > 0 || ownedSats > 0 || tokens.length > 0) {
              foundAtIndex = true;
              found += 1;
              wallets.current.set(key, wallet);
              setResults((current) => [
                ...current.filter((item) => item.key !== key),
                {
                  key,
                  source: sourceKey,
                  category: space,
                  index,
                  sats,
                  ownedSats,
                  tokens,
                  variant,
                },
              ]);
            } else {
              wallets.current.delete(key);
            }
          }
          return foundAtIndex;
        },
      });
    };

    try {
      if (scanAccounts) await scanSpace("main", mainSeed, "accounts");
      if (category !== "accounts" && run === scanRun.current) {
        await scanSpace("main", mainSeed, category);
        for (const [accountNumber, accountSeed] of accountSeeds.current) {
          if (run !== scanRun.current) break;
          await scanSpace(accountNumber, accountSeed, category);
        }
      }
      if (run === scanRun.current) {
        const more = moreToScan();
        setCanContinue(more);
        if (!scanAccounts && found === 0) {
          setProgress("No funds found in savings.");
          return;
        }
        setProgress(
          `Checked ${scanned} wallet${scanned === 1 ? "" : "s"}. ${more ? "Continue scanning to search beyond the empty gaps." : "Reached the end of these paths."}`,
        );
      }
    } catch (scanError) {
      if (run === scanRun.current) {
        setCanContinue(moreToScan());
        setError(
          `Scan stopped after ${scanned} wallets: ${scanError.message || "Unable to load a wallet."} No later indices were checked.`,
        );
      }
    } finally {
      if (run === scanRun.current) setBusy(false);
    }
  };

  const moveFunds = async () => {
    if (!review) return;
    setBusy(true);
    setError("");
    try {
      const wallet = wallets.current.get(review.key);
      if (!wallet)
        throw new Error("Scan this wallet again before moving funds.");
      const destination = await getMainSparkAddress();
      const currentBalance = await wallet.getBalance();
      if (review.tokenIdentifier) {
        const token = spendableTokens(currentBalance.tokenBalances).find(
          (item) => item.identifier === review.tokenIdentifier,
        );
        if (!token || token.amount <= 0n)
          throw new Error("This token no longer has a spendable balance.");
        await wallet.transferTokens({
          tokenIdentifier: token.identifier,
          tokenAmount: token.amount,
          receiverSparkAddress: destination,
        });
      } else {
        const available = Number(
          currentBalance.balance ?? currentBalance.satsBalance?.available ?? 0,
        );
        if (!Number.isSafeInteger(available) || available <= 0)
          throw new Error("No spendable Bitcoin remains here.");
        const estimate = await wallet.getSwapFeeEstimate(available);
        const fee = Number(estimate?.feeEstimate?.originalValue);
        if (!Number.isSafeInteger(fee) || fee < 0 || available <= fee)
          throw new Error("The balance does not cover the Spark transfer fee.");
        await wallet.transfer({
          receiverSparkAddress: destination.toLowerCase(),
          amountSats: available - fee,
        });
      }
      const updated = await wallet.getBalance();
      const sats = Number(
        updated.balance ?? updated.satsBalance?.available ?? 0,
      );
      const ownedSats = Number(updated.satsBalance?.owned ?? sats);
      const tokens = spendableTokens(updated.tokenBalances);
      setResults((current) =>
        current.map((item) =>
          item.key === review.key ? { ...item, sats, ownedSats, tokens } : item,
        ),
      );
      await refreshWallet();
      setProgress(
        "Transfer submitted to the main seed wallet. Its balance may take a moment to update.",
      );
      setReview(null);
    } catch (transferError) {
      setError(transferError.message || "The transfer could not be submitted.");
    } finally {
      setBusy(false);
    }
  };

  const visible = results.filter((item) => item.category === category);
  return (
    <section className="derivedPanel" aria-labelledby="derived-title">
      <p className="sectionEyebrow">Blitz features</p>
      <h2 id="derived-title">Recover other wallet funds.</h2>
      <p className="withdrawalLead">
        Find funds in Blitz accounts, savings, pools, gifts, and child accounts.
        Funds found here can be moved into your main seed wallet.
      </p>
      <div
        className="derivedCategories"
        role="group"
        aria-label="Wallet section"
      >
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            className={category === name ? "active" : ""}
            onClick={() => {
              setCategory(name);
              setError("");
            }}
            disabled={busy}
          >
            {RECOVERY_SPACES[name].label}
          </button>
        ))}
      </div>
      <p className="derivedHint">
        Each path pauses after 15 consecutive empty numbers. Continue scan to
        check beyond a gap.
      </p>
      {error && (
        <p className="withdrawalError" role="alert">
          {error}
        </p>
      )}
      <div className="derivedActions">
        <button
          className="recoveryButton"
          type="button"
          onClick={() => scan(false)}
          disabled={busy}
        >
          {busy
            ? "Scanning…"
            : `Scan ${RECOVERY_SPACES[category].label.toLowerCase()}`}
        </button>
        {!busy && scannedCategory === category && canContinue && (
          <button
            className="recoveryButtonSecondary"
            type="button"
            onClick={() => scan(true)}
          >
            Continue scan
          </button>
        )}
        {busy && !review && (
          <button
            className="recoveryButtonSecondary"
            type="button"
            onClick={stopScan}
          >
            Stop scan
          </button>
        )}
      </div>
      {progress && (
        <p className="derivedProgress" role="status">
          {progress}
        </p>
      )}
      {visible.length > 0 && (
        <div className="derivedResults">
          <h3>Found funds</h3>
          {visible.map((item) => (
            <div className="derivedResult" key={item.key}>
              <div className="derivedResultHead">
                <strong>{resultLabel(item)}</strong>
                <span>{formatSats(item.sats)} sats available</span>
              </div>
              {item.ownedSats > item.sats && (
                <p className="derivedHint">
                  {formatSats(item.ownedSats - item.sats)} sats are not yet
                  spendable.
                </p>
              )}
              {item.sats > 0 && (
                <button
                  type="button"
                  className="recoveryButtonText"
                  onClick={() =>
                    setReview({
                      key: item.key,
                      label: resultLabel(item),
                      amount: `${formatSats(item.sats)} sats`,
                    })
                  }
                  disabled={busy}
                >
                  Move Bitcoin to main wallet
                </button>
              )}
              {item.tokens.map((token) => (
                <div className="derivedToken" key={token.identifier}>
                  <span>
                    {token.metadata.tokenName ||
                      token.metadata.tokenTicker ||
                      "Token"}
                    : {token.amount.toString()} base units available
                    {token.owned > token.amount
                      ? ` (${(token.owned - token.amount).toString()} pending)`
                      : ""}
                  </span>
                  {token.amount > 0n && (
                    <button
                      type="button"
                      className="recoveryButtonText"
                      onClick={() =>
                        setReview({
                          key: item.key,
                          label: resultLabel(item),
                          amount: `${token.amount.toString()} ${token.metadata.tokenTicker || "token base units"}`,
                          tokenIdentifier: token.identifier,
                        })
                      }
                      disabled={busy}
                    >
                      Move token
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {review && (
        <div
          className="derivedReview"
          role="dialog"
          aria-modal="true"
          aria-label="Review transfer"
        >
          <p className="sectionEyebrow">Review transfer</p>
          <h3>Move funds to your main wallet?</h3>
          {error && (
            <p className="withdrawalError" role="alert">
              {error}
            </p>
          )}
          <div className="reviewActions">
            <button
              className="recoveryButtonSecondary"
              type="button"
              onClick={() => setReview(null)}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              className="recoveryButton"
              type="button"
              onClick={moveFunds}
              disabled={busy}
            >
              {busy ? "Submitting…" : "Confirm transfer"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
