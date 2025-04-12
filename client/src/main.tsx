import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { register as registerSW } from "./lib/pwa-utils";

// Enable PWA in production and development for testing
registerSW();

// We don't need a global event listener here as it's handled in the InstallPopup component
// This was causing the event to be captured twice, potentially interfering with the popup
// The InstallPopup component already has its own event listener for beforeinstallprompt

createRoot(document.getElementById("root")!).render(<App />);
