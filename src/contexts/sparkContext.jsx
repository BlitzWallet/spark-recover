import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  getSparkBalance,
  getSparkIdentityPubKey,
  getSparkTransactions,
  getSparkAddress,
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
  recoveryId: 0,
};

const SparkWalletProvider = ({ children }) => {
  const [sparkInformation, setSparkInformation] = useState(emptySparkInformation);
  const isInitializingRef = useRef(false);
  const mnemonicRef = useRef(null);
  const recoveryIdRef = useRef(0);

  const getRecoveryMnemonic = useCallback(() => mnemonicRef.current, []);
  const getMainSparkAddress = useCallback(async () => {
    const result = await getSparkAddress();
    if (!result.didWork || !result.response) throw new Error("Unable to load the main wallet address.");
    return result.response;
  }, []);

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
      mnemonicRef.current = null;
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
      recoveryIdRef.current += 1;
      setSparkInformation({
        balance: balanceResult?.balance ?? 0,
        satsBalance:
          balanceResult?.satsBalance ?? { available: 0, owned: 0, incoming: 0 },
        tokenBalances: balanceResult?.tokenBalances ?? new Map(),
        transactions: transactionsResult?.transfers ?? [],
        identityPubKey: identityPubKey ?? "",
        didConnect: true,
        connectionError: false,
        recoveryId: recoveryIdRef.current,
      });
      mnemonicRef.current = mnemonic;
      isInitializingRef.current = false;
      return true;
    } catch {
      mnemonicRef.current = null;
      isInitializingRef.current = false;
      setSparkInformation((current) => ({
        ...current,
        connectionError: true,
        didConnect: false,
      }));
      return false;
    }
  }, []);

  const refreshWallet = useCallback(async () => {
    const [balanceResult, transactionsResult] = await Promise.all([
      getSparkBalance(), getSparkTransactions(),
    ]);
    if (!balanceResult?.didWork) return;
    setSparkInformation((current) => ({
      ...current,
      balance: balanceResult.balance ?? current.balance,
      satsBalance: balanceResult.satsBalance ?? current.satsBalance,
      tokenBalances: balanceResult.tokenBalances ?? current.tokenBalances,
      transactions: transactionsResult?.transfers ?? current.transactions,
    }));
  }, []);

  useEffect(() => {
    if (!sparkInformation.didConnect) return undefined;

    const intervalId = window.setInterval(refreshWallet, 30_000);
    return () => window.clearInterval(intervalId);
  }, [sparkInformation.didConnect, refreshWallet]);

  const contextValue = useMemo(
    () => ({
      sparkInformation,
      restoreWallet,
      getRecoveryMnemonic,
      getMainSparkAddress,
      refreshWallet,
    }),
    [restoreWallet, sparkInformation, getRecoveryMnemonic, getMainSparkAddress, refreshWallet]
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
