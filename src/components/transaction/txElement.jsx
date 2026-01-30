import copyToClipboard from "../../functions/copyToClipboard";

function formatTxType(type) {
  switch (type) {
    case "PREIMAGE_SWAP":
      return "Lightning";
    case "COOPERATIVE_EXIT":
    case "UTXO_SWAP":
      return "On-chain";
    case "TRANSFER":
      return "Spark";
    default:
      return type;
  }
}

function formatStatus(status) {
  switch (status) {
    case "TRANSFER_STATUS_COMPLETED":
    case "COMPLETED":
      return "Completed";
    case "TRANSFER_STATUS_SENDER_KEY_TWEAKED":
    case "PENDING":
      return "Pending";
    case "TRANSFER_STATUS_RETURNED":
    case "FAILED":
      return "Failed";
    default:
      return status;
  }
}

function statusClass(status) {
  const s = status?.toUpperCase() || "";
  if (s.includes("COMPLETED")) return "statusCompleted";
  if (s.includes("RETURNED") || s.includes("FAILED")) return "statusFailed";
  return "statusPending";
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateId(id) {
  if (!id || id.length <= 16) return id;
  return `${id.slice(0, 8)}...${id.slice(-8)}`;
}

export default function TransactionElement({ item }) {
  const isIncoming = item.transferDirection === "INCOMING";

  return (
    <div className="txContainer" onClick={() => copyToClipboard(item.id)}>
      <div className="txRow txRowMain">
        <div className="txLeft">
          <span className={`txDirection ${isIncoming ? "txIncoming" : "txOutgoing"}`}>
            {isIncoming ? "+" : "-"}
          </span>
          <div className="txInfo">
            <span className="txType">{formatTxType(item.type)}</span>
            <span className="txDate">{formatDate(item.updatedTime)}</span>
          </div>
        </div>
        <div className="txRight">
          <span className={`txAmount ${isIncoming ? "txIncoming" : "txOutgoing"}`}>
            {isIncoming ? "+" : "-"}{Number(item.totalValue).toLocaleString()} sats
          </span>
          <span className={`txStatus ${statusClass(item.status)}`}>
            {formatStatus(item.status)}
          </span>
        </div>
      </div>
      <div className="txId">
        {truncateId(item.id)}
      </div>
    </div>
  );
}
