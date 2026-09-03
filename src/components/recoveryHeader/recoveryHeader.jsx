import "./style.css";

export default function RecoveryHeader({ onBack }) {
  return (
    <header className="recoveryHeader">
      <div className="recoveryHeaderInner">
        <div className="recoveryBrand">
          {onBack ? (
            <button
              className="recoveryBackButton"
              type="button"
              onClick={onBack}
              aria-label="Back"
            >
              <span aria-hidden="true">←</span>
            </button>
          ) : (
            <img className="brandMark" src="/favicon/favicon.svg" alt="" />
          )}
        </div>
        <a
          className="recoverySourceLink"
          href="https://github.com/BlitzWallet/spark-recover"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source
        </a>
      </div>
    </header>
  );
}
