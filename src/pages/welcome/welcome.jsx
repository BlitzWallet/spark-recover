import RecoveryHeader from "../../components/recoveryHeader/recoveryHeader";
import { ChevronRight, Globe2, ShieldCheck, UserRoundX } from "lucide-react";
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
