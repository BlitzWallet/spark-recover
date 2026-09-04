import { useCallback, useEffect, useRef, useState } from "react";
import { validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import RecoveryHeader from "../../components/recoveryHeader/recoveryHeader";
import {
  handleQRSeed,
  handleRestoreFromText,
} from "../../functions/handleSeedPaste";
import { useSpark } from "../../contexts/sparkContext";
import Camera from "../camera/cameraPage";
import "./style.css";

const WORD_COUNT = 12;
const WORD_NUMBERS = Array.from(
  { length: WORD_COUNT },
  (_, index) => index + 1,
);

export default function RestoreScreen({
  currentState,
  handleStateChange,
  isTransitioning,
}) {
  const { restoreWallet, sparkInformation } = useSpark();
  const [entryMode, setEntryMode] = useState("words");
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Connecting to your recovered wallet…",
  );
  const [useCamera, setUseCamera] = useState(false);
  const wordRefs = useRef({});
  const pendingSeedRef = useRef(null);
  const isActive = currentState === "restore" && !isTransitioning;

  const clearWordInputs = useCallback(() => {
    WORD_NUMBERS.forEach((number) => {
      if (wordRefs.current[number]) wordRefs.current[number].value = "";
    });
    pendingSeedRef.current = null;
  }, []);

  const writeWordsToInputs = useCallback((seed) => {
    WORD_NUMBERS.forEach((number, index) => {
      if (wordRefs.current[number]) {
        wordRefs.current[number].value = seed[index];
      }
    });
  }, []);

  const fillWords = useCallback(
    (text) => {
      const parsed = handleRestoreFromText(text);
      if (!parsed.didWork || parsed.seed.length !== WORD_COUNT) {
        setError("Enter or scan all 12 words from your recovery phrase.");
        return false;
      }

      if (entryMode === "words") {
        writeWordsToInputs(parsed.seed);
      } else {
        pendingSeedRef.current = parsed.seed;
        setEntryMode("words");
      }
      setError("");
      return true;
    },
    [entryMode, writeWordsToInputs],
  );

  useEffect(() => {
    if (entryMode !== "words" || !pendingSeedRef.current) return;
    writeWordsToInputs(pendingSeedRef.current);
    pendingSeedRef.current = null;
  }, [entryMode, writeWordsToInputs]);

  const updateWord = (number, value) => {
    if (/\s/.test(value)) {
      fillWords(value);
      return;
    }
    if (wordRefs.current[number]) {
      wordRefs.current[number].value = value.toLowerCase();
    }
    setError("");
  };

  const handleCameraScan = useCallback(
    (data) => {
      const parsed = handleQRSeed(data);
      if (!parsed.didWork || parsed.seed.length !== WORD_COUNT) {
        setError("That QR code is not a supported 12-word recovery QR.");
        return false;
      }
      return fillWords(parsed.seed.join(" "));
    },
    [fillWords],
  );

  const submitRecovery = () => {
    const phrase = WORD_NUMBERS.map((number) =>
      wordRefs.current[number]?.value.trim(),
    )
      .filter(Boolean)
      .join(" ");

    if (phrase.split(" ").length !== WORD_COUNT) {
      setError("Enter all 12 words before continuing.");
      return;
    }
    if (!validateMnemonic(phrase, wordlist)) {
      setError(
        "This recovery phrase is not valid. Check each word and try again.",
      );
      return;
    }

    setError("");
    setIsValidating(true);
    clearWordInputs();
    restoreWallet(phrase);
  };

  useEffect(() => {
    if (!isValidating) return undefined;

    const intervalId = window.setInterval(() => {
      setLoadingMessage((message) =>
        message === "Connecting to your recovered wallet…"
          ? "Loading your available funds…"
          : "Connecting to your recovered wallet…",
      );
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [isValidating]);

  useEffect(() => {
    if (!sparkInformation.didConnect) return;
    handleStateChange("wallet");
  }, [sparkInformation.didConnect, handleStateChange]);

  useEffect(() => {
    if (!sparkInformation.connectionError) return;
    setIsValidating(false);
    setError(
      "We could not restore this wallet. Check your phrase and connection, then try again.",
    );
  }, [sparkInformation.connectionError]);

  if (useCamera) {
    return (
      <Camera
        mode="seed"
        title="Scan recovery QR"
        description="Align the recovery QR inside the frame. The image is processed only in this browser session."
        onScan={handleCameraScan}
        onClose={() => setUseCamera(false)}
      />
    );
  }

  return (
    <section
      className="screenContainerStyles restoreScreen"
      aria-hidden={!isActive}
      style={{
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none",
        zIndex: currentState === "restore" ? 2 : 1,
      }}
    >
      <main className="recoveryPage">
        <div className="recoveryMain restoreContent">
          {isValidating ? (
            <div className="restoreLoading" role="status" aria-live="polite">
              <div className="spinner" />
              <h1>Restoring your wallet</h1>
              <p>{loadingMessage}</p>
            </div>
          ) : (
            <>
              <h1>Restore your wallet.</h1>
              <p className="restoreLead">
                Your 12-word recovery phrase stays private to this browser
                session. Do not take a screenshot or share it with anyone.
              </p>

              <div
                className="restoreMethodSwitch"
                role="tablist"
                aria-label="Recovery method"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={entryMode === "words"}
                  className={entryMode === "words" ? "active" : ""}
                  onClick={() => setEntryMode("words")}
                >
                  Enter phrase
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={entryMode === "qr"}
                  className={entryMode === "qr" ? "active" : ""}
                  onClick={() => setEntryMode("qr")}
                >
                  Scan seed QR
                </button>
              </div>

              {entryMode === "words" ? (
                <div className="seedEntry" role="tabpanel">
                  <div className="seedEntryActions">
                    <p>Enter each word in the order you wrote them down.</p>
                  </div>
                  <div className="seedWords">
                    {WORD_NUMBERS.map((number) => (
                      <label className="seedWord" key={number}>
                        <span>{number}</span>
                        <input
                          ref={(element) => {
                            wordRefs.current[number] = element;
                          }}
                          name={`recovery-word-${number}`}
                          type="text"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          onChange={(event) =>
                            updateWord(number, event.target.value)
                          }
                          onPaste={(event) => {
                            event.preventDefault();
                            fillWords(event.clipboardData.getData("text"));
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && number < WORD_COUNT) {
                              wordRefs.current[number + 1]?.focus();
                            }
                            if (
                              event.key === "Backspace" &&
                              !event.currentTarget.value &&
                              number > 1
                            ) {
                              wordRefs.current[number - 1]?.focus();
                            }
                          }}
                          aria-label={`Recovery word ${number}`}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <section className="qrRestore" role="tabpanel">
                  <p className="qrRestoreLabel">Recovery QR</p>
                  <h2>Use a QR from your original backup.</h2>
                  <p>
                    Open the camera on this device or choose a QR image. Make
                    sure nobody can see your screen while scanning.
                  </p>
                  <button
                    className="recoveryButton"
                    type="button"
                    onClick={() => setUseCamera(true)}
                  >
                    Open scanner <span aria-hidden="true">→</span>
                  </button>
                </section>
              )}

              {error && (
                <p className="restoreError" role="alert">
                  {error}
                </p>
              )}

              {entryMode === "words" && (
                <button
                  className="recoveryButton restoreAction"
                  type="button"
                  onClick={submitRecovery}
                >
                  Restore wallet <span aria-hidden="true">→</span>
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </section>
  );
}
