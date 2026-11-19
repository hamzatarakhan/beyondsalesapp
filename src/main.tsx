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
// Arabic-Indic (٠-٩) and Persian (۰-۹) digits typed on an Arabic keyboard are turned into 0-9 as they are
// typed, so every numeric field (OTP / PIN boxes, phone, amounts) accepts them instead of rejecting them.
const AR_DIGITS = /[\u0660-\u0669\u06F0-\u06F9\u066B]/;
document.addEventListener(
  "input",
  (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    const mode = el.inputMode;
    if (mode !== "numeric" && mode !== "decimal" && mode !== "tel") return;
    if (!AR_DIGITS.test(el.value)) return;
    const fixed = el.value
      .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
      .replace(/\u066B/g, ".");
    // Native setter so React still sees a change and runs the field's own onChange.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(el, fixed);
  },
  true,
);

document.addEventListener("click", () => {
  try { flushSync(() => {}); } catch { /* already rendering */ }
});
