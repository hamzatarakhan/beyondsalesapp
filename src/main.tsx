import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

createRoot(document.getElementById("root")!).render(<App />);

// Phone keyboards (iOS Safari especially) only open for a focus() that happens while the user's tap is
// still being handled. React normally commits a tap's state change just after the handler returns, which
// is too late for an OTP / PIN sheet to focus its first box and bring the keyboard up. Flushing the
// pending update at the end of the click keeps the sheet's focus inside the tap.
document.addEventListener("click", () => {
  try { flushSync(() => {}); } catch { /* already rendering */ }
});
