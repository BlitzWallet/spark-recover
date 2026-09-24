import { ArrowUpRight, ShieldCheck } from "lucide-react";
import "./style.css";

export default function WelcomeScreen({
  currentState,
  handleStateChange,
  isTransitioning,
}) {
  const isActive = currentState === "home" && !isTransitioning;

  return (
    <section
      className="screenContainerStyles welcomeContainer"
      aria-hidden={!isActive}
      style={{
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? "auto" : "none",
        zIndex: currentState === "home" ? 2 : 1,
      }}
    >
      <main className="recoveryPage">
        <div className="recoveryMain welcomeContent">
          <h1>Recover access to your wallet.</h1>
          <p className="welcomeLead">
            Restore your Blitz wallet, see your recovered funds, and move your
            Bitcoin somewhere safe.
          </p>

          <aside className="demoNotice">
            <span className="demoNoticeIcon" aria-hidden="true">
              <ShieldCheck />
            </span>
            <div className="demoNoticeText">
              <p>
                Anyone with your recovery phrase can take your funds. Never
                enter it anywhere you don't fully trust. It's safest to run this
                tool yourself.
              </p>
              <a
                className="demoNoticeLink"
                href="https://github.com/BlitzWallet/spark-recover"
                target="_blank"
                rel="noopener noreferrer"
              >
                View source <ArrowUpRight aria-hidden="true" />
              </a>
            </div>
          </aside>

          <button
            className="recoveryButton welcomeAction"
            type="button"
            onClick={() => handleStateChange("restore")}
          >
            Begin recovery
          </button>
        </div>
      </main>
    </section>
  );
}
