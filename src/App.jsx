import { useState } from "react";
import "./App.css";
import WelcomScreen from "./pages/welcome/welcome";
import RestoreScreen from "./pages/restore/restore";
import WalletScreen from "./pages/wallet/wallet";

function App() {
  const [currentState, setCurrentState] = useState("home");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStateChange = (newState) => {
    if (newState === currentState || isTransitioning) return;

    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentState(newState);
      setIsTransitioning(false);
    }, 500); //css animation duration
  };

  return (
    <div className="recoveryContainer">
      <WelcomScreen
        currentState={currentState}
        handleStateChange={handleStateChange}
        isTransitioning={isTransitioning}
      />
      <RestoreScreen
        currentState={currentState}
        handleStateChange={handleStateChange}
        isTransitioning={isTransitioning}
      />
      <WalletScreen
        currentState={currentState}
        handleStateChange={handleStateChange}
        isTransitioning={isTransitioning}
      />
    </div>
  );
}

export default App;
