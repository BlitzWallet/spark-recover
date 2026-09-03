import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  getSparkBalance,
  getSparkIdentityPubKey,
  getSparkTransactions,
  initializeSparkWallet,
} from "../functions/spark";

const SparkWalletManager = createContext(null);

const emptySparkInformation = {
  balance: 0,
  satsBalance: { available: 0, owned: 0, incoming: 0 },
  tokenBalances: new Map(),
  transactions: [],
  identityPubKey: "",
  didConnect: null,
  connectionError: false,
};

const SparkWalletProvider = ({ children }) => {
  const [sparkInformation, setSparkInformation] = useState(emptySparkInformation);
  const isInitializingRef = useRef(false);

  const restoreWallet = useCallback(async (mnemonic) => {
    if (!mnemonic || isInitializingRef.current) return false;
    isInitializingRef.current = true;
    setSparkInformation((current) => ({
      ...current,
      connectionError: false,
      didConnect: null,
    }));

    const response = await initializeSparkWallet(mnemonic);
    if (!response?.isConnected) {
      isInitializingRef.current = false;
      setSparkInformation((current) => ({
        ...current,
        connectionError: true,
        didConnect: false,
      }));
      return false;
    }

    try {
      const [balanceResult, transactionsResult, identityPubKey] = await Promise.all([
        getSparkBalance(),
        getSparkTransactions(),
        getSparkIdentityPubKey(),
      ]);
      setSparkInformation({
        balance: balanceResult?.balance ?? 0,
        satsBalance:
          balanceResult?.satsBalance ?? { available: 0, owned: 0, incoming: 0 },
        tokenBalances: balanceResult?.tokenBalances ?? new Map(),
        transactions: transactionsResult?.transfers ?? [],
        identityPubKey: identityPubKey ?? "",
        didConnect: true,
        connectionError: false,
      });
      return true;
    } catch {
      isInitializingRef.current = false;
      setSparkInformation((current) => ({
        ...current,
        connectionError: true,
        didConnect: false,
      }));
      return false;
    }
  }, []);

  useEffect(() => {
    if (!sparkInformation.didConnect) return undefined;

    const updateSparkData = async () => {
      const [balanceResult, transactionsResult] = await Promise.all([
        getSparkBalance(),
        getSparkTransactions(),
      ]);

      if (!balanceResult?.didWork) return;
      setSparkInformation((current) => ({
        ...current,
        balance: balanceResult.balance ?? current.balance,
        satsBalance: balanceResult.satsBalance ?? current.satsBalance,
        tokenBalances: balanceResult.tokenBalances ?? current.tokenBalances,
        transactions: transactionsResult?.transfers ?? current.transactions,
      }));
    };

    const intervalId = window.setInterval(updateSparkData, 30_000);
    return () => window.clearInterval(intervalId);
  }, [sparkInformation.didConnect]);

  const contextValue = useMemo(
    () => ({
      sparkInformation,
      restoreWallet,
    }),
    [restoreWallet, sparkInformation]
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
    throw new Error("useSpark must be used within a SparkWalletProvider");
  }
  return context;
}

export { SparkWalletManager, SparkWalletProvider, useSpark };
