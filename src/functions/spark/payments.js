import {
  getSparkBitcoinPaymentFeeEstimate,
  getSparkLightningPaymentFeeEstimate,
  sendSparkBitcoinPayment,
  sendSparkLightningPayment,
  sendSparkPayment,
  sparkWallet,
} from ".";
import { SPARK_TO_SPARK_FEE } from "../../constants/math";

export const sparkPaymenWrapper = async ({
  getFee = false,
  address,
  paymentType,
  amountSats = 0,
  exitSpeed = "FAST",
  fee,
  memo,
  userBalance = 0,
  sparkInformation,
  feeQuote,
  usingZeroAmountInvoice = false,
}) => {
  try {
    console.log("Begining spark payment");
    if (!sparkWallet) throw new Error("sparkWallet not initialized");
    const supportFee = 0;
    if (getFee) {
      console.log("Calculating spark payment fee");
      let calculatedFee = 0;
      let tempFeeQuote;
      if (paymentType === "lightning") {
        const routingFee = await getSparkLightningPaymentFeeEstimate(address);
        if (!routingFee.didWork)
          throw new Error(routingFee.error || "Unable to get routing fee");
        calculatedFee = routingFee.response;
      } else if (paymentType === "bitcoin") {
        const feeResponse = await getSparkBitcoinPaymentFeeEstimate({
          amountSats,
          withdrawalAddress: address,
        });
        if (!feeResponse.didWork)
          throw new Error(
            feeResponse.error || "Unable to get Bitcoin fee estimation"
          );
        const data = feeResponse.response;
        calculatedFee =
          data.userFeeFast.originalValue +
          data.l1BroadcastFeeFast.originalValue;
        tempFeeQuote = data;
      } else {
        // Spark payments
        const feeResponse = await sparkWallet.getSwapFeeEstimate(amountSats);
        calculatedFee =
          feeResponse.feeEstimate.originalValue || SPARK_TO_SPARK_FEE;
      }
      return {
        didWork: true,
        fee: Math.round(calculatedFee),
        supportFee: Math.round(supportFee),
        feeQuote: tempFeeQuote,
      };
    }
    let response;
    if (
      userBalance <
      amountSats + (paymentType === "bitcoin" ? supportFee : fee)
    )
      throw new Error("Insufficient funds");

    let supportFeeResponse;

    if (paymentType === "lightning") {
      const initialFee = Math.round(fee - supportFee);
      const lightningPayResponse = await sendSparkLightningPayment({
        maxFeeSats: Math.ceil(initialFee * 1.2), //addding 20% buffer so we dont undershoot it
        invoice: address,
        amountSats: usingZeroAmountInvoice ? amountSats : undefined,
      });
      if (!lightningPayResponse.didWork)
        throw new Error(
          lightningPayResponse.error || "Error when sending lightning payment"
        );

      const data = lightningPayResponse.paymentResponse;
      const tx = {
        id: data.id,
        paymentStatus: "pending",
        paymentType: "lightning",
        accountId: sparkInformation.identityPubKey,
        details: {
          fee: fee,
          amount: amountSats,
          address: data.encodedInvoice,
          time: new Date(data.updatedAt).getTime(),
          direction: "OUTGOING",
          description: memo || "",
          preimage: "",
        },
      };
      response = tx;
    } else if (paymentType === "bitcoin") {
      // make sure to import exist speed
      const onChainPayResponse = await sendSparkBitcoinPayment({
        onchainAddress: address,
        exitSpeed,
        amountSats,
        feeQuote,
        deductFeeFromWithdrawalAmount: true,
      });

      if (!onChainPayResponse.didWork)
        throw new Error(
          onChainPayResponse.error || "Error when sending bitcoin payment"
        );

      console.log(onChainPayResponse, "on-chain pay response");
      const data = onChainPayResponse.response;

      const tx = {
        id: data.id,
        paymentStatus: "pending",
        paymentType: "bitcoin",
        accountId: sparkInformation.identityPubKey,
        details: {
          fee: fee,
          amount: amountSats,
          address: address,
          time: new Date(data.updatedAt).getTime(),
          direction: "OUTGOING",
          description: memo || "",
          onChainTxid: data.coopExitTxid,
        },
      };
      response = tx;
    } else {
      const sparkPayResponse = await sendSparkPayment({
        receiverSparkAddress: address,
        amountSats,
      });

      if (!sparkPayResponse.didWork)
        throw new Error(
          sparkPayResponse.error || "Error when sending spark payment"
        );

      const data = sparkPayResponse.response;
      const tx = {
        id: data.id,
        paymentStatus: "completed",
        paymentType: "spark",
        accountId: data.senderIdentityPublicKey,
        details: {
          fee: fee,
          amount: amountSats,
          address: address,
          time: new Date(data.updatedTime).getTime(),
          direction: "OUTGOING",
          description: memo || "",
          senderIdentityPublicKey: data.receiverIdentityPublicKey,
        },
      };
      response = tx;
    }
    console.log(response, "resonse in send function");
    return { didWork: true, response };
  } catch (err) {
    console.log("Send lightning payment error", err);
    return { didWork: false, error: err.message };
  } finally {
    if (!getFee) {
    }
  }
};
