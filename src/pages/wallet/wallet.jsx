import { useState } from "react";
import { Colors } from "../../constants/theme";
import { useSpark } from "../../contexts/sparkContext";
import "./style.css";
import ActivityIndicator from "../../components/spinner/spinner";
import { sparkPaymenWrapper } from "../../functions/spark/payments";

export default function WalletScreen({
  currentState,
  handleStateChange,
  isTransitioning,
}) {
  const { sparkInformation } = useSpark();
  const [error, setError] = useState("");
  const [isLightningPayment, setIsLightningPayment] = useState(true);
  const [invoiceInformation, setInvoiceInformation] = useState({});
  const [paymentInformation, setSetPaymentInformation] = useState({});
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
        amountSats: bitcoinAmountInputSats,
        sparkInformation,
      });
      if (response.didWork) {
        setInvoiceInformation({
          fee: response.fee,
        });
      } else throw new Error(response.error);
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  const sendPayment = async () => {
    try {
      setError("");
      setIsLoading(true);
      const response = await sparkPaymenWrapper({
        address,
        paymentType: isLightningPayment ? "lightning" : "bitcoin",
        amountSats: bitcoinAmountInputSats,
        sparkInformation,
      });
      if (response.didWork) {
        setSetPaymentInformation(...response.response);
      } else throw new Error(response.error);
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  console.log(Object.keys(invoiceInformation).length);
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
        onClick={() => setIsLightningPayment((prev) => !prev)}
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
        name=""
        id=""
      ></textarea>

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
    </div>
  );
}
