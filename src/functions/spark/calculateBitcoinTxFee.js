import { getLiquidSdk } from "../connectToLiquid";

//https://bitcoinops.org/en/tools/calc-size/
export default function calculateBitcoinTxFee({
  inputs = 1,
  outputs = 1,
  feeRate = 1,
}) {
  const sdk = getLiquidSdk();
  const feeRates = sdk.recommendedFees();
  let overhead = 10.5; // Overhead in bytes for the transaction 4(tx version) + 1(input count) + 1(output count) + 4(locktime) +  0.5(segwit maarket & segwit flag)
  const inputTxSize = 57.5; // Average size of an input transaction in bytes
  const outputTxSize = 43; // Average size of an output transaction in bytes

  overhead += inputs * inputTxSize; // Add size for inputs
  overhead += outputs * outputTxSize; // Add size for outputs
  return Math.min([overhead * feeRate, 25_000]); // max is 225 sat/vbye tx fee
}
