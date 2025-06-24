import {
  createContext,
  useState,
  useContext,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  getSparkBalance,
  getSparkIdentityPubKey,
  getSparkTransactions,
  initializeSparkWallet,
} from "../functions/spark";

// Initiate context
const SparkWalletManager = createContext(null);

const SparkWalletProvider = ({ children, navigate }) => {
  const [mnemoinc, setMnemonic] = useState("");

  const startSparkConnectionRef = useRef(null);
  const updateSparkState = useRef(null);

  const [sparkInformation, setSparkInformation] = useState({
    balance: 0,
    transactions: [],
    identityPubKey: "",
    didConnect: null,
  });

  useEffect(() => {
    if (!mnemoinc) return;
    if (startSparkConnectionRef.current) return;
    startSparkConnectionRef.current = true;
    async function initWallet() {
      const response = await initializeSparkWallet(mnemoinc);
      if (response.isConnected) {
        const [balance, transactions, pubkey] = await Promise.all([
          getSparkBalance(),
          getSparkTransactions(),
          getSparkIdentityPubKey(),
        ]);
        setSparkInformation({
          balance: balance?.balance || 0,
          transactions: transactions?.transfers || [],
          identityPubKey: pubkey,
          didConnect: true,
        });
      }
    }
    initWallet();
  }, [mnemoinc]);

  useEffect(() => {
    if (!sparkInformation.didConnect) return;

    let intervalId;

    const updateSparkData = async () => {
      try {
        const [balance, transactions] = await Promise.all([
          getSparkBalance(),
          getSparkTransactions(),
        ]);
        setSparkInformation((prev) => ({
          ...prev,
          balance: balance?.balance || 0,
          transactions: transactions?.transfers || [],
        }));
      } catch (error) {
        console.error("Failed to update Spark data:", error);
      }
    };

    intervalId = setInterval(updateSparkData, 30 * 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [sparkInformation.didConnect]);

  const contextValue = useMemo(
    () => ({
      sparkInformation,
      setSparkInformation,
      mnemoinc,
      setMnemonic,
    }),
    [sparkInformation, setSparkInformation, mnemoinc, setMnemonic]
  );

  return (
    <SparkWalletManager.Provider value={contextValue}>
      {children}
    </SparkWalletManager.Provider>
  );
};

function useSpark() {
  const context = useContext(SparkWalletManager);
  if (!context) {
    throw new Error("useSparkWallet must be used within a SparkWalletProvider");
  }
  return context;
}

export { SparkWalletManager, SparkWalletProvider, useSpark };
