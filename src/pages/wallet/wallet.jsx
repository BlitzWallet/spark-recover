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
      alert("Insufficent balance");
      return;
    }
    try {
      setError("");
      setIsLoading(true);

      const response = await sparkPaymenWrapper({
        address,
        paymentType: isLightningPayment ? "lightning" : "bitcoin",
        amountSats: Math.round(
          Number(bitcoinAmountInputSats) + invoiceInformation.fee
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

  return (
    <div
      style={{
        opacity: currentState === "wallet" && !isTransitioning ? 1 : 0,
        zIndex: currentState === "wallet" ? 2 : 1,
      }}
      className="screenContainerStyles walletContainer"
    >
      <h1>{sparkInformation.balance} sats</h1>
      <div
        onClick={() => {
          setAddress("");
          setInvoiceInformation({});
          setBitcoinAmountInputSats("");
          setIsLightningPayment((prev) => !prev);
        }}
        style={{ backgroundColor: Colors.light.backgroundOffset }}
        className="switchContainer"
      >
        <div
          style={{
            backgroundColor: Colors.dark.text,
            left: isLightningPayment ? "3px" : "100px",
          }}
          className="optionSlider"
        />
        <p>Bolt11</p>
        <p>Bitcoin</p>
      </div>
      {!!Object.keys(invoiceInformation).length && (
        <p>Fee: {invoiceInformation.fee}</p>
      )}
      <p style={{ color: Colors.constants.cancelRed }} className="errorText">
        {error ? `Error: ${error}` : ""}
      </p>
      <textarea
        placeholder={isLightningPayment ? "lnbc15u1p3xn..." : "bc1p2tj3jnhz..."}
        onChange={(event) => setAddress(event.target.value)}
        value={address}
        name=""
        id=""
      ></textarea>
      {!isLightningPayment && (
        <div className="sendContainer">
          <p>Send Amount (sats)</p>
          <input
            value={bitcoinAmountInputSats}
            onChange={(event) => setBitcoinAmountInputSats(event.target.value)}
            placeholder="0"
            type="number"
            name=""
            id=""
          />
        </div>
      )}

      <button
        onClick={() => {
          if (Object.keys(invoiceInformation).length) {
            sendPayment();
          } else {
            getSparkQuote();
          }
        }}
      >
        {isLoading ? (
          <ActivityIndicator height={"20px"} width={"20px"} />
        ) : Object.keys(invoiceInformation).length ? (
          "Send payment"
        ) : (
          "Get payment quote"
        )}
      </button>
      <p className="transactionContainerText">Transactions</p>
      <div className="transactionsContainer">
        {sparkInformation.transactions.map((item) => (
          <TransactionElement item={item} />
        ))}
      </div>
    </div>
  );
}
