import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { registerServiceWorker } from "./pwa.js";
import "./styles/base.css";

if (window.Capacitor?.isNativePlatform?.()) {
  document.documentElement.dataset.platform = window.Capacitor.getPlatform();
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

registerServiceWorker();
