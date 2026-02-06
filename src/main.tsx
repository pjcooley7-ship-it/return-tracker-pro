import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logger } from "@/lib/logger";

// Global error handlers
window.onerror = (message, source, lineno, colno, error) => {
  logger.error(String(message), {
    source: 'window.onerror',
    stack: error?.stack,
    metadata: { source: String(source), lineno, colno },
  });
};

window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const reason = event.reason;
  logger.error(reason instanceof Error ? reason.message : String(reason), {
    source: 'unhandledrejection',
    stack: reason instanceof Error ? reason.stack : undefined,
  });
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Ensure index.html contains <div id='root'></div>.");
}

createRoot(rootElement).render(<App />);
