import { useState } from "react";
import { Colors } from "../../constants/theme";
import { useSpark } from "../../contexts/sparkContext";
import "./style.css";
import ActivityIndicator from "../../components/spinner/spinner";
import { sparkPaymenWrapper } from "../../functions/spark/payments";
import TransactionElement from "../../components/transaction/txElement";

export default function WalletScreen({
  currentState,
  handleStateChange,
  isTransitioning,
}) {
  const { sparkInformation } = useSpark();
  const [error, setError] = useState("");
  const [isLightningPayment, setIsLightningPayment] = useState(true);
  const [invoiceInformation, setInvoiceInformation] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [bitcoinAmountInputSats, setBitcoinAmountInputSats] = useState("");
  const [address, setAddress] = useState("");

  const hasQuote = !!Object.keys(invoiceInformation).length;

  const getSparkQuote = async () => {
    try {
      setError("");
      setIsLoading(true);
      const response = await sparkPaymenWrapper({
        getFee: true,
        address,
        paymentType: isLightningPayment ? "lightning" : "bitcoin",
        amountSats: Number(bitcoinAmountInputSats),
        sparkInformation,
      });
      if (response.didWork) {
        setInvoiceInformation(response);
      } else throw new Error(response.error);
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendPayment = async () => {
    if (
      sparkInformation.balance <
      Number(bitcoinAmountInputSats) + invoiceInformation.fee
    ) {
      alert("Insufficient balance");
      return;
    }
    try {
      setError("");
      setIsLoading(true);

      const response = await sparkPaymenWrapper({
        address,
        paymentType: isLightningPayment ? "lightning" : "bitcoin",
        amountSats: Math.round(
          Number(bitcoinAmountInputSats) + invoiceInformation.fee,
        ),
        fee: invoiceInformation.fee,
        userBalance: sparkInformation.balance,
        sparkInformation,
        feeQuote: sparkInformation.feeQuote,
      });
      if (response.didWork) {
        alert("Payment successful");
      } else throw new Error(response.error);
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setInvoiceInformation({});
      setAddress("");
      setBitcoinAmountInputSats("");
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAddress("");
    setInvoiceInformation({});
    setBitcoinAmountInputSats("");
    setError("");
  };

  const formatBalance = (sats) => {
    return Number(sats).toLocaleString();
  };

  return (
    <div
      style={{
        opacity: currentState === "wallet" && !isTransitioning ? 1 : 0,
        zIndex: currentState === "wallet" ? 2 : 1,
      }}
      className="screenContainerStyles walletContainer"
    >
      {/* Balance Section */}
      <div className="balanceSection">
        <p className="balanceLabel">Balance</p>
        <h1 className="balanceAmount">
          {formatBalance(sparkInformation.balance)}
          <span className="balanceUnit"> sats</span>
        </h1>
      </div>

      {/* Send Payment Section */}
      <div className="sendSection">
        <h2 className="sectionTitle">Send Payment</h2>

        {/* Payment Type Tabs */}
        <div className="paymentTabs">
          <button
            type="button"
            className={`paymentTab ${isLightningPayment ? "active" : ""}`}
            onClick={() => {
              if (!isLightningPayment) {
                resetForm();
                setIsLightningPayment(true);
              }
            }}
          >
            Lightning
          </button>
          <button
            type="button"
            className={`paymentTab ${!isLightningPayment ? "active" : ""}`}
            onClick={() => {
              if (isLightningPayment) {
                resetForm();
                setIsLightningPayment(false);
              }
            }}
          >
            Bitcoin
          </button>
        </div>

        {/* Input Fields */}
        <div className="inputGroup">
          <label className="inputLabel">
            {isLightningPayment ? "Lightning Invoice" : "Bitcoin Address"}
          </label>
          <textarea
            className="addressInput"
            placeholder={
              isLightningPayment ? "lnbc15u1p3xn..." : "bc1p2tj3jnhz..."
            }
            onChange={(event) => setAddress(event.target.value)}
            value={address}
            rows={3}
          />
        </div>

        {!isLightningPayment && (
          <div className="inputGroup">
            <label className="inputLabel">Amount (sats)</label>
            <input
              className="amountInput"
              value={bitcoinAmountInputSats}
              onChange={(event) =>
                setBitcoinAmountInputSats(event.target.value)
              }
              placeholder="0"
              type="number"
            />
          </div>
        )}

        {/* Fee Display */}
        {hasQuote && (
          <div className="feeDisplay">
            <span className="feeLabel">Network Fee</span>
            <span className="feeAmount">
              {invoiceInformation.fee.toLocaleString()} sats
            </span>
          </div>
        )}

        {/* Error Display */}
        {error && <p className="errorText">{error}</p>}

        {/* Action Button */}
        <button
          className="sendButton"
          onClick={() => {
            if (hasQuote) {
              sendPayment();
            } else {
              getSparkQuote();
            }
          }}
          disabled={isLoading || !address}
        >
          {isLoading ? (
            <ActivityIndicator height={"20px"} width={"20px"} />
          ) : hasQuote ? (
            "Confirm & Send"
          ) : (
            "Review Payment"
          )}
        </button>

        {hasQuote && (
          <button className="cancelButton" onClick={resetForm} type="button">
            Cancel
          </button>
        )}
      </div>

      {/* Transactions Section */}
      <div className="transactionsSection">
        <h2 className="sectionTitle">Recent Transactions</h2>
        <div className="transactionsContainer">
          {sparkInformation.transactions.length === 0 ? (
            <p className="emptyState">No transactions yet</p>
          ) : (
            sparkInformation.transactions.map((item) => (
              <TransactionElement key={item.id} item={item} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
