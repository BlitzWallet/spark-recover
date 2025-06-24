import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import "./style.css";
import getDataFromClipboard from "../../functions/getDataFromClipboard";
import { Colors } from "../../constants/theme";
import { validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { useSpark } from "../../contexts/sparkContext";
import ActivityIndicator from "../../components/spinner/spinner";

const NUMARRAY = Array.from({ length: 12 }, (_, i) => i + 1);
const INITIAL_KEY_STATE = NUMARRAY.reduce((acc, num) => {
  acc[`key${num}`] = "";
  return acc;
}, {});
export default function RestoreScreen({
  currentState,
  handleStateChange,
  isTransitioning,
}) {
  const { setMnemonic, sparkInformation } = useSpark();
  const [loadingMessage, setLoadingMessage] = useState(
    "Please don't leave the tab"
  );

  const didInitializeMessageIntervalRef = useRef(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentFocused, setCurrentFocused] = useState(null);
  const keyRefs = useRef({});
  const [inputedKey, setInputedKey] = useState(INITIAL_KEY_STATE);

  const handleInputElement = (text, keyNumber) => {
    setInputedKey((prev) => ({ ...prev, [`key${keyNumber}`]: text }));
  };

  const handleFocus = (keyNumber) => {
    setCurrentFocused(keyNumber);
  };

  const handleSubmit = (keyNumber) => {
    if (keyNumber < 12) {
      keyRefs.current[keyNumber + 1]?.focus();
    } else {
      keyRefs.current[12]?.blur();
    }
  };
  const handleSeedFromClipboard = async () => {
    try {
      const response = await getDataFromClipboard();

      if (!response) throw new Error("Not able to get clipboard data");

      const data = response;
      const splitSeed = data.split(" ");
      if (
        !splitSeed.every((word) => word.trim().length > 0) ||
        splitSeed.length !== 12
      )
        throw new Error("Invalid clipboard data.");

      const newKeys = {};
      NUMARRAY.forEach((num, index) => {
        newKeys[`key${num}`] = splitSeed[index];
      });
      setInputedKey(newKeys);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
  const keyValidation = async () => {
    try {
      setIsValidating(true);
      const mnemonic = Object.values(inputedKey)
        .map((val) => val.trim().toLowerCase())
        .filter((val) => val);

      if (!mnemonic || mnemonic.length !== 12) {
        return;
      }
      if (!validateMnemonic(mnemonic.join(" "), wordlist))
        throw new Error("Not a valid seedphrase");
      setMnemonic(mnemonic.join(" "));
    } catch (err) {
      console.error(err);
      setIsValidating(false);
      alert(err.message);
    }
  };

  useEffect(() => {
    if (!isValidating) return;
    if (didInitializeMessageIntervalRef.current) return;
    didInitializeMessageIntervalRef.current = true;

    const intervalRef = setInterval(() => {
      setLoadingMessage((prev) =>
        prev === "Please don't leave the tab"
          ? "We are setting things up"
          : "Please don't leave the tab"
      );
    }, 5000);

    return () => clearInterval(intervalRef);
  }, [isValidating]);

  useEffect(() => {
    if (!sparkInformation.didConnect) return;
    handleStateChange("wallet");
  }, [sparkInformation.didConnect]);

  useEffect(() => {
    const handleBlur = () => setCurrentFocused(null);
    window.addEventListener("click", handleBlur);
    return () => window.removeEventListener("click", handleBlur);
  }, []);

  const inputKeys = useMemo(() => {
    const rows = [];
    for (let i = 1; i < NUMARRAY.length + 1; i += 1) {
      rows.push(
        <div key={i} className="seedPill">
          <span className="seedText">{i}.</span>
          <input
            className="textInput"
            type="text"
            value={inputedKey[`key${i}`]}
            ref={(ref) => (keyRefs.current[i] = ref)}
            onFocus={() => handleFocus(i)}
            onChange={(e) => handleInputElement(e.target.value, i)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit(i)}
          />
        </div>
      );
    }
    return rows;
  }, [inputedKey]);

  // if (isValidating)
  //   return (
  //     <div className="connectingToSparkContainer">
  //       <ActivityIndicator />
  //       <p>{loadingMessage}</p>
  //     </div>
  //   );

  return (
    <div
      style={{
        opacity: currentState === "restore" && !isTransitioning ? 1 : 0,
        zIndex: currentState === "restore" ? 2 : 1,
      }}
      className="screenContainerStyles restoreScreen"
    >
      {isValidating ? (
        <div className="connectingToSparkContainer">
          <ActivityIndicator />
          <p>{loadingMessage}</p>
        </div>
      ) : (
        <>
          <h1>Restore your Spark Wallet.</h1>
          <p className="description">
            <strong>Important</strong>: For your security, never enter your seed
            phrase into a random website. We recommend restoring your wallet
            using the open-source code available on{" "}
            <a
              href="https://github.com/BlitzWallet/spark-recover"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            .
          </p>
          <div className="inputKeysContainer">{inputKeys}</div>
          <div className="buttonsContainer">
            <button
              style={{
                backgroundColor: Colors.dark.text,
                color: Colors.light.text,
              }}
              onClick={handleSeedFromClipboard}
            >
              Paste
            </button>
            <button onClick={keyValidation}>Restore</button>
          </div>
        </>
      )}
    </div>
  );
}
