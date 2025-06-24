import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./fonts.css";
import App from "./App.jsx";
import { SparkWalletProvider } from "./contexts/sparkContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SparkWalletProvider>
      <App />
    </SparkWalletProvider>
  </StrictMode>
);
