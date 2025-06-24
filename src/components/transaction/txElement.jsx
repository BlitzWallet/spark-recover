import copyToClipboard from "../../functions/copyToClipboard";

export default function TransactionElement({ item }) {
  return (
    <div className="txContainer">
      <p onClick={() => copyToClipboard(item.id)}>{`Spark Id: ${item.id}`}</p>
      <p>{`Status: ${item.status}`}</p>
      <p>{`Value: ${item.totalValue} sats`}</p>
      <p>{`Direction: ${item.transferDirection}`}</p>
      <p>{`Type: ${item.type}`}</p>
      <p>{`Date: ${item.updatedTime}`}</p>
    </div>
  );
}
