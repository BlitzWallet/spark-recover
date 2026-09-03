import { wordlist } from "@scure/bip39/wordlists/english";

export function handleRestoreFromText(seedText) {
  if (typeof seedText !== "string") {
    return { didWork: false, error: "No recovery phrase found" };
  }

  const seed = seedText.toLowerCase().match(/[a-z]+/g) || [];
  return seed.length
    ? { didWork: true, seed }
    : { didWork: false, error: "No recovery phrase found" };
}

export function handleQRSeed(data) {
  if (typeof data !== "string" || !/^\d{48}$/.test(data)) {
    return { didWork: false, error: "Unsupported recovery QR" };
  }

  const seed = Array.from({ length: 12 }, (_, index) => {
    const wordIndex = Number(data.slice(index * 4, index * 4 + 4));
    return wordlist[wordIndex];
  });

  if (seed.some((word) => !word)) {
    return { didWork: false, error: "Unsupported recovery QR" };
  }

  return { didWork: true, seed };
}
