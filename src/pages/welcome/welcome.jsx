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
      <RecoveryHeader />
      <main className="recoveryPage">
        <div className="recoveryMain welcomeContent">
          <h1>Recover access to your wallet.</h1>
          <p className="welcomeLead">
            Restore a Blitz or Spark-compatible wallet, see your recovered
            funds, and move your Bitcoin somewhere safe.
          </p>

          <section className="securityNotice" aria-labelledby="security-title">
            <ul className="securityChecklist">
              <li className="securityChecklistItem">
                <ShieldCheck
                  className="securityChecklistIcon"
                  aria-hidden="true"
                />
                <div>
                  <h3>Use a website you trust</h3>
                  <p>Only enter your seed phrase on a trusted website.</p>
                </div>
              </li>
              <li className="securityChecklistItem">
                <Globe2 className="securityChecklistIcon" aria-hidden="true" />
                <div>
                  <h3>Verify the recovery site</h3>
                  <p>Check that you are on the official Blitz recovery site.</p>
                </div>
              </li>
              <li className="securityChecklistItem">
                <UserRoundX
                  className="securityChecklistIcon"
                  aria-hidden="true"
                />
                <div>
                  <h3>Keep your phrase private</h3>
                  <p>Never give it to a person, agent, or unexpected site.</p>
                </div>
              </li>
            </ul>
          </section>

          <button
            className="recoveryButton welcomeAction"
            type="button"
            onClick={() => handleStateChange("restore")}
          >
            Begin recovery <span aria-hidden="true">→</span>
          </button>
          <p className="welcomeFootnote">
            This recovery page does not save your seed phrase in browser
            storage. You can inspect the open-source code from the Source link
            above.
          </p>
        </div>
      </main>
    </section>
  );
}
