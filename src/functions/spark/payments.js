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
  exitSpeed = "FAST",
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
          feeResponse.speedFast.userFee.originalValue +
          feeResponse.speedFast.l1BroadcastFee.originalValue;
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

export const sparkReceivePaymentWrapper = async ({
  amountSats,
  memo,
  paymentType,
}) => {
  try {
    if (!sparkWallet) throw new Error("sparkWallet not initialized");

    if (paymentType === "lightning") {
      const invoice = await sparkWallet.createLightningInvoice({
        amountSats,
        memo,
        expirySeconds: 1000 * 60 * 60 * 12, //Add 24 hours validity to invoice
      });

      const tempTransaction = {
        id: invoice.id,
        amount: amountSats,
        expiration: invoice.invoice.expiresAt,
        description: memo || "",
      };
      await addSingleUnpaidSparkLightningTransaction(tempTransaction);
      return {
        didWork: true,
        data: invoice,
        invoice: invoice.invoice.encodedInvoice,
      };
    } else if (paymentType === "bitcoin") {
      // Handle storage of tx when claiming in spark context
      const depositAddress = await getSparkStaticBitcoinL1Address();

      let formmattedAddress = amountSats
        ? `bitcoin:${depositAddress}?amount:${Number(
            amountSats / SATSPERBITCOIN
          ).toFixed(8)}${
            memo
              ? `&label=${encodeURIComponent(memo)}&message${encodeURIComponent(
                  memo
                )}`
              : ""
          }`
        : depositAddress;

      return {
        didWork: true,
        invoice: formmattedAddress,
      };
    } else {
      // No need to save address since it is constant
      const sparkAddress = await getSparkAddress();
      const formattedSparkAddress = formatBip21SparkAddress({
        address: sparkAddress,
        amount: amountSats,
        message: memo,
      });

      let formmattedAddress = amountSats ? formattedSparkAddress : sparkAddress;

      return {
        didWork: true,
        invoice: formmattedAddress,
      };
    }
  } catch (err) {
    console.log("Receive spark payment error", err);
    return { didWork: false, error: err.message };
  }
};
