import "./style.css";

export default function WelcomScreen({
  currentState,
  handleStateChange,
  isTransitioning,
}) {
  return (
    <div
      style={{
        opacity: currentState === "home" && !isTransitioning ? 1 : 0,
        zIndex: currentState === "home" ? 2 : 1,
      }}
      className="screenContainerStyles welcomeContainer"
    >
      <h1>Welcome to Spark Recover</h1>
      <p className="description">
        This tool helps you restore your seed and recover your funds from any
        Spark-compatible wallet. <strong>Never trust, always verify.</strong>{" "}
        For full security, it's recommended that you run your own copy of this
        tool. View the source on{" "}
        <a
          href="https://github.com/BlitzWallet/spark-recover"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        .
      </p>
      <button onClick={() => handleStateChange("restore")}>Get started</button>
    </div>
  );
}
