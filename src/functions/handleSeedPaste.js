import { wordlist } from "@scure/bip39/wordlists/english";
import { IS_LETTER_REGEX } from "../constants";

export function handleRestoreFromText(seedString) {
  try {
    let wordArray = [];
    let currentIndex = 0;
    let maxIndex = seedString.length;
    let currentWord = "";

    while (currentIndex <= maxIndex) {
      const letter = seedString[currentIndex];
      const isLetter = IS_LETTER_REGEX.test(letter);
      if (!isLetter) {
        currentIndex += 1;
        continue;
      }
      currentWord += letter.toLowerCase();
      const currentTry = currentWord;

      const posibleOptins = wordlist.filter((word) =>
        word.toLowerCase().startsWith(currentTry)
      );

      if (!posibleOptins.length) {
        const lastPosibleOption = currentWord.slice(0, currentWord.length - 1);
        wordArray.push(lastPosibleOption);
        currentWord = "";
        continue;
      }
      if (
        posibleOptins.length === 1 &&
        posibleOptins[0].toLowerCase() === currentTry.toLowerCase()
      ) {
        wordArray.push(currentTry);
        currentWord = "";
      }

      currentIndex += 1;
    }

    return { didWork: true, seed: wordArray };
  } catch (err) {
    console.log("handle restore from text error", err);
    return { didWork: false, error: err.message };
  }
}
export function handleQRSeed(data) {
  try {
    if (!data) return;
    let indexMnemonic = [];

    for (let index = 0; index < 12; index++) {
      const start = index * 4;
      const end = start + 4;
      indexMnemonic.push(data.slice(start, end));
    }
    const seedMnemoinc = indexMnemonic.map((item) => {
      return wordlist.at(Number(item));
    });
    return { didWork: true, seed: seedMnemoinc };
  } catch (err) {
    console.log("error getting seed from camera", err);
    return { didWork: false, error: err.message };
  }
}
