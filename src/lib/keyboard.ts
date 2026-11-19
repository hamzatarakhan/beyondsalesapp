// Phone keyboards only open for a focus() made while the user's tap is being handled. When a tap
// starts a short check (e.g. "Verify & Continue") and the OTP sheet opens a moment later, that tap is
// over. primeKeyboard() focuses a hidden numeric input during the tap so the keyboard is already up;
// the OTP sheet then moves focus to its first box (the keyboard stays) and calls releaseKeyboard().
let proxy: HTMLInputElement | null = null;
let timer: number | undefined;

export const releaseKeyboard = () => {
  if (timer) window.clearTimeout(timer);
  proxy?.remove();
  proxy = null;
};

export const primeKeyboard = () => {
  if (proxy) return;
  const el = document.createElement("input");
  el.setAttribute("inputmode", "numeric");
  el.setAttribute("aria-hidden", "true");
  el.tabIndex = -1;
  Object.assign(el.style, { position: "fixed", top: "0", left: "0", width: "1px", height: "1px", opacity: "0", fontSize: "16px", pointerEvents: "none" });
  document.body.appendChild(el);
  el.focus({ preventScroll: true });
  proxy = el;
  // Safety: never leave the keyboard up if no sheet takes over (e.g. the check failed).
  timer = window.setTimeout(releaseKeyboard, 4000);
};
