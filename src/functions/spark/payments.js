import {
  getSparkAddress,
  getSparkBitcoinPaymentRequest,
  getSparkLightningPaymentFeeEstimate,
  getSparkLightningSendRequest,
  getSparkStaticBitcoinL1Address,
  sendSparkBitcoinPayment,
  sendSparkLightningPayment,
  sparkWallet,
} from ".";

import { SATSPERBITCOIN } from "../../constants/math";

export const sparkPaymenWrapper = async ({
  getFee = false,
  address,
  paymentType,
  amountSats = 0,
  exitSpeed = "MEDIUM",
  fee,
  memo,
  sparkInformation,
}) => {
  try {
    console.log("Begining spark payment");
    if (!sparkWallet) throw new Error("sparkWallet not initialized");

    if (getFee) {
      console.log("Calculating spark payment fee");
      let calculatedFee = 0;
      if (paymentType === "lightning") {
        const routingFee = await getSparkLightningPaymentFeeEstimate(address);
        if (!routingFee) throw new Error("Unable to calculate spark fee");
        calculatedFee = routingFee;
      } else if (paymentType === "bitcoin") {
        const feeResponse = await sparkWallet.getWithdrawalFeeEstimate({
          amountSats,
          withdrawalAddress: address,
        });
        calculatedFee =
          feeResponse.speedMedium.userFee.originalValue +
          feeResponse.speedMedium.l1BroadcastFee.originalValue;
      }
      return {
        didWork: true,
        fee: Math.round(calculatedFee),
      };
    }
    let response;

    if (paymentType === "lightning") {
      const lightningPayResponse = await sendSparkLightningPayment({
        invoice: address,
      });
      if (!lightningPayResponse)
        throw new Error("Error when sending lightning payment");

      let sparkQueryResponse = null;
      let count = 0;
      while (!sparkQueryResponse && count < 5) {
        const sparkResponse = await getSparkLightningSendRequest(
          lightningPayResponse.id
        );

        if (sparkResponse?.transfer) {
          sparkQueryResponse = sparkResponse;
        } else {
          console.log("Waiting for response...");
          await new Promise((res) => setTimeout(res, 2000));
        }
        count += 1;
      }

      const tx = {
        id: sparkQueryResponse
          ? sparkQueryResponse.transfer.sparkId
          : lightningPayResponse.id,
        paymentStatus: sparkQueryResponse ? "completed" : "pending",
        paymentType: "lightning",
        accountId: sparkInformation.identityPubKey,
        details: {
          fee: fee,
          amount: amountSats,
          address: lightningPayResponse.encodedInvoice,
          time: new Date(lightningPayResponse.updatedAt).getTime(),
          direction: "OUTGOING",
          description: memo || "",
          preimage: sparkQueryResponse
            ? sparkQueryResponse.paymentPreimage
            : "",
        },
      };
      response = tx;
    } else if (paymentType === "bitcoin") {
      // make sure to import exist speed
      const onChainPayResponse = await sendSparkBitcoinPayment({
        onchainAddress: address,
        exitSpeed,
        amountSats,
      });
      if (!onChainPayResponse)
        throw new Error("Error when sending bitcoin payment");

      console.log(onChainPayResponse, "on-chain pay response");
      let sparkQueryResponse = null;
      let count = 0;
      while (!sparkQueryResponse && count < 5) {
        const sparkResponse = await getSparkBitcoinPaymentRequest(
          onChainPayResponse.id
        );
        if (sparkResponse?.coopExitTxid) {
          sparkQueryResponse = sparkResponse;
        } else {
          console.log("Waiting for response...");
          await new Promise((res) => setTimeout(res, 2000));
        }
        count += 1;
      }

      console.log(
        sparkQueryResponse,
        "on-chain query response after confirmation"
      );
      const tx = {
        id: onChainPayResponse.id,
        paymentStatus: "pending",
        paymentType: "bitcoin",
        accountId: sparkInformation.identityPubKey,
        details: {
          fee: fee,
          amount: Math.round(amountSats - fee),
          address: address,
          time: new Date(onChainPayResponse.updatedAt).getTime(),
          direction: "OUTGOING",
          description: memo || "",
          onChainTxid: sparkQueryResponse
            ? sparkQueryResponse.coopExitTxid
            : onChainPayResponse.coopExitTxid,
        },
      };
      response = tx;
    }
    console.log(response, "resonse in send function");
    return { didWork: true, response };
  } catch (err) {
    console.log("Send lightning payment error", err);
    return { didWork: false, error: err.message };
  }
};
