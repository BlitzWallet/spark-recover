import { useMemo, useState } from "react";
import Camera from "../camera/cameraPage";
import DerivedRecovery from "./derivedRecovery";
import { useSpark } from "../../contexts/sparkContext";
import { sparkPaymenWrapper } from "../../functions/spark/payments";
import "./style.css";

function normalizeDestination(value) {
  return value
    .trim()
    .replace(/^(lightning|bitcoin):/i, "")
    .split("?")[0]
    .trim();
}

function getDestinationType(value) {
  const destination = normalizeDestination(value);
  if (/^lnbc(?:\d+[munp]?)?1[ac-hj-np-z02-9]+$/i.test(destination)) {
    return "lightning";
  }
  if (
    /^bc1[ac-hj-np-z02-9]{11,87}$/i.test(destination) ||
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(destination)
  ) {
    return "bitcoin";
  }
  return null;
}

function isZeroAmountInvoice(invoice) {
  return /^lnbc1/i.test(invoice);
}

function getInvoiceAmount(invoice) {
  const match = invoice.toLowerCase().match(/^lnbc(\d+)([munp]?)1/);
  if (!match) return null;

  const amount = Number(match[1]);
  const multiplier = {
    "": 100_000_000,
    m: 100_000,
    u: 100,
    n: 0.1,
    p: 0.0001,
  }[match[2]];
  const sats = amount * multiplier;
  return Number.isFinite(sats) && sats > 0 ? Math.ceil(sats) : null;
}

function formatSats(value) {
  return Number(value || 0).toLocaleString();
}

function formatTokenAmount(value, decimals = 0) {
  const raw = String(value ?? 0);
  const formatInteger = (integer) =>
    integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (!decimals) return formatInteger(raw);

  const padded = raw.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return `${formatInteger(whole)}${fraction ? `.${fraction}` : ""}`;
}

export default function WalletScreen({ currentState, isTransitioning }) {
  const { sparkInformation } = useSpark();
  const [destinationInput, setDestinationInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [quote, setQuote] = useState(null);
  const [stage, setStage] = useState("form");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const isActive = currentState === "wallet" && !isTransitioning;

  const destination = normalizeDestination(destinationInput);
  const destinationType = getDestinationType(destination);
  const zeroAmountInvoice =
    destinationType === "lightning" && isZeroAmountInvoice(destination);
  const encodedInvoiceAmount =
    destinationType === "lightning" ? getInvoiceAmount(destination) : null;
  const enteredAmount = Number(amountInput);
  const amountSats =
    destinationType === "bitcoin" || zeroAmountInvoice ? enteredAmount : 0;
  const tokenBalances = useMemo(() => {
    if (!(sparkInformation.tokenBalances instanceof Map)) return [];
    return Array.from(sparkInformation.tokenBalances.entries());
  }, [sparkInformation.tokenBalances]);

  const clearQuote = () => {
    setQuote(null);
    setStage("form");
  };

  const resetWithdrawal = () => {
    setDestinationInput("");
    setAmountInput("");
    setQuote(null);
    setError("");
    setStage("form");
  };

  const reviewWithdrawal = async () => {
    setError("");
    if (!destinationType) {
      setError("Paste a Lightning invoice or a mainnet Bitcoin address.");
      return;
    }
    if (
      (destinationType === "bitcoin" || zeroAmountInvoice) &&
      (!Number.isInteger(enteredAmount) || enteredAmount <= 0)
    ) {
      setError("Enter a whole number of sats to withdraw.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await sparkPaymenWrapper({
        getFee: true,
        address: destination,
        paymentType: destinationType,
        amountSats,
        usingZeroAmountInvoice: zeroAmountInvoice,
        sparkInformation,
      });

      if (!response.didWork) {
        throw new Error(response.error || "Unable to prepare this withdrawal.");
      }

      const amountToCheck = zeroAmountInvoice
        ? amountSats
        : destinationType === "bitcoin"
          ? amountSats
          : encodedInvoiceAmount;
      if (
        amountToCheck !== null &&
        amountToCheck !== undefined &&
        sparkInformation.balance < amountToCheck + response.fee
      ) {
        throw new Error(
          "Your available Bitcoin balance does not cover this withdrawal and its fee.",
        );
      }

      setQuote(response);
      setStage("review");
    } catch (reviewError) {
      setError(reviewError.message || "Unable to prepare this withdrawal.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmWithdrawal = async () => {
    if (!quote || !destinationType) return;

    try {
      setError("");
      setIsLoading(true);
      const response = await sparkPaymenWrapper({
        address: destination,
        paymentType: destinationType,
        amountSats,
        fee: quote.fee,
        userBalance: sparkInformation.balance,
        sparkInformation,
        feeQuote: quote.feeQuote,
        usingZeroAmountInvoice: zeroAmountInvoice,
      });

      if (!response.didWork) {
        throw new Error(
          response.error || "The withdrawal could not be submitted.",
        );
      }
      setStage("success");
    } catch (withdrawalError) {
      setError(
        withdrawalError.message || "The withdrawal could not be submitted.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const scanDestination = (value) => {
    if (!getDestinationType(value)) return false;
    setDestinationInput(value);
    setError("");
    clearQuote();
    return true;
  };

  if (useCamera) {
    return (
      <Camera
        mode="destination"
        title="Scan withdrawal destination"
        description="Scan a Lightning invoice or a Bitcoin address QR to continue."
        onScan={scanDestination}
        onClose={() => setUseCamera(false)}
      />
    );
  }

  return (
    <section
      className="screenContainerStyles walletContainer"
      aria-hidden={!isActive}
      style={{
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none",
        zIndex: currentState === "wallet" ? 2 : 1,
      }}
    >
      <main className="recoveryPage">
        <div className="recoveryMain walletContent">
          <h1>Your available funds.</h1>
          <p className="walletLead">
            View your main wallet balance, find funds in Blitz derived wallets,
            and move them to your main seed before withdrawing Bitcoin.
          </p>

          <section className="bitcoinBalance" aria-label="Bitcoin balance">
            <div className="assetIdentity">
              <span className="bitcoinDot" aria-hidden="true">
                ₿
              </span>
              <div>
                <p>Bitcoin</p>
                <span>Available balance</span>
              </div>
            </div>
            <strong>
              {formatSats(sparkInformation.balance)} <span>sats</span>
            </strong>
          </section>

          {tokenBalances.length > 0 && (
            <section className="tokenBalances" aria-labelledby="tokens-title">
              <div className="tokenHeading">
                <div>
                  <p className="sectionEyebrow">Other assets</p>
                  <h2 id="tokens-title">Tokens</h2>
                </div>
                <span>{tokenBalances.length}</span>
              </div>
              <div className="tokenList">
                {tokenBalances.map(([tokenId, token]) => {
                  const metadata = token.tokenMetadata || {};
                  const name =
                    metadata.tokenName || metadata.tokenTicker || "Token";
                  const ticker = metadata.tokenTicker || "";
                  const amount =
                    token.availableToSendBalance ?? token.ownedBalance ?? 0;
                  return (
                    <div className="tokenRow" key={tokenId}>
                      <div>
                        <strong>{name}</strong>
                        <span>{ticker || "Spark token"}</span>
                      </div>
                      <p>
                        {formatTokenAmount(amount, metadata.decimals)} {ticker}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="tokenNote">
                Token balances are visible here, but this recovery tool does not
                offer token conversion or Bitcoin/Lightning token withdrawals.
              </p>
            </section>
          )}

          <DerivedRecovery key={sparkInformation.recoveryId} />

          <section className="withdrawalPanel" aria-labelledby="withdraw-title">
            {stage === "success" ? (
              <div className="withdrawalSuccess" role="status">
                <span className="successMark" aria-hidden="true">
                  ✓
                </span>
                <p className="sectionEyebrow">Withdrawal submitted</p>
                <h2>Your funds are on the way.</h2>
                <p>
                  {destinationType === "bitcoin"
                    ? "The on-chain withdrawal has been started. Bitcoin confirmations can take time."
                    : "The Lightning payment has been submitted and will complete as the destination processes it."}
                </p>
                <button
                  className="recoveryButton"
                  type="button"
                  onClick={resetWithdrawal}
                >
                  Make another withdrawal
                </button>
              </div>
            ) : stage === "review" && quote ? (
              <div className="withdrawalReview">
                <p className="sectionEyebrow">Review withdrawal</p>
                <h2 id="withdraw-title">Check the details.</h2>
                <p className="reviewIntro">
                  {destinationType === "bitcoin"
                    ? "Bitcoin transactions cannot be reversed once broadcast."
                    : "Confirm the invoice and amount before sending."}
                </p>
                <dl className="reviewList">
                  <div>
                    <dt>Method</dt>
                    <dd>
                      {destinationType === "bitcoin"
                        ? "Bitcoin on-chain"
                        : "Lightning"}
                    </dd>
                  </div>
                  <div className="reviewDestination">
                    <dt>Destination</dt>
                    <dd>{destination}</dd>
                  </div>
                  <div>
                    <dt>Amount</dt>
                    <dd>
                      {destinationType === "lightning" && !zeroAmountInvoice
                        ? encodedInvoiceAmount
                          ? `${formatSats(encodedInvoiceAmount)} sats`
                          : "Set by invoice"
                        : `${formatSats(amountSats)} sats`}
                    </dd>
                  </div>
                  <div>
                    <dt>Estimated fee</dt>
                    <dd>{formatSats(quote.fee)} sats</dd>
                  </div>
                  {destinationType === "bitcoin" && (
                    <div>
                      <dt>Recipient receives</dt>
                      <dd>
                        {formatSats(Math.max(amountSats - quote.fee, 0))} sats
                      </dd>
                    </div>
                  )}
                </dl>
                {error && (
                  <p className="withdrawalError" role="alert">
                    {error}
                  </p>
                )}
                <div className="reviewActions">
                  <button
                    className="recoveryButtonSecondary"
                    type="button"
                    onClick={clearQuote}
                    disabled={isLoading}
                  >
                    Edit
                  </button>
                  <button
                    className="recoveryButton"
                    type="button"
                    onClick={confirmWithdrawal}
                    disabled={isLoading}
                  >
                    {isLoading ? "Submitting…" : "Confirm withdrawal"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="withdrawalForm">
                <div>
                  <p className="sectionEyebrow">Withdraw Bitcoin</p>
                  <h2 id="withdraw-title">Move your Bitcoin out.</h2>
                  <p className="withdrawalLead">
                    Paste or scan a Lightning invoice or a Bitcoin address.
                    We’ll identify the route automatically.
                  </p>
                </div>

                <label className="withdrawalField">
                  <span>Destination</span>
                  <textarea
                    value={destinationInput}
                    rows={3}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="Lightning invoice or Bitcoin address"
                    onChange={(event) => {
                      setDestinationInput(event.target.value);
                      setError("");
                      clearQuote();
                    }}
                  />
                </label>
                <div className="destinationMeta">
                  {destinationInput ? (
                    destinationType ? (
                      <span className={`destinationType ${destinationType}`}>
                        {destinationType === "lightning"
                          ? "Lightning detected"
                          : "Bitcoin detected"}
                      </span>
                    ) : (
                      <span className="destinationInvalid">
                        Paste a Lightning invoice or mainnet Bitcoin address
                      </span>
                    )
                  ) : (
                    <span>
                      We support Lightning and Bitcoin on-chain withdrawals.
                    </span>
                  )}
                  <button
                    className="recoveryButtonText"
                    type="button"
                    onClick={() => setUseCamera(true)}
                  >
                    Scan QR
                  </button>
                </div>

                {(destinationType === "bitcoin" || zeroAmountInvoice) && (
                  <label className="withdrawalField amountField">
                    <span>Amount in sats</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      value={amountInput}
                      placeholder="0"
                      onChange={(event) => {
                        setAmountInput(event.target.value);
                        setError("");
                        clearQuote();
                      }}
                    />
                    {zeroAmountInvoice && (
                      <small>This invoice lets you choose the amount.</small>
                    )}
                  </label>
                )}

                {destinationType === "lightning" && !zeroAmountInvoice && (
                  <p className="invoiceAmountNote">
                    The amount is included in this Lightning invoice.
                    {encodedInvoiceAmount
                      ? ` ${formatSats(encodedInvoiceAmount)} sats requested.`
                      : ""}
                  </p>
                )}

                {error && (
                  <p className="withdrawalError" role="alert">
                    {error}
                  </p>
                )}
                <button
                  className="recoveryButton withdrawalAction"
                  type="button"
                  onClick={reviewWithdrawal}
                  disabled={isLoading}
                >
                  {isLoading ? "Preparing…" : "Review withdrawal"}
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </section>
  );
}
