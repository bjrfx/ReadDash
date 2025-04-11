import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { register as registerSW } from "./lib/pwa-utils";

// Enable PWA in production
if (import.meta.env.PROD) {
  registerSW();
}

createRoot(document.getElementById("root")!).render(<App />);
