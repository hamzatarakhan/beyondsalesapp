import { useId } from "react";

// Small 3D-style product illustrations (gradients + soft shadow) used in place of the flat
// line icons on every Stock Management screen. Drawn inline so they stay crisp, themeable
// and dependency-free; they ignore the caller's size and fill the 44px icon circle.
type ArtProps = { className?: string };
const SIZE = "w-8 h-8 shrink-0 drop-shadow-sm";

const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 48 48" className={SIZE} aria-hidden="true">{children}</svg>
);

export const SimCardArt = (_: ArtProps) => {
  const id = useId();
  return (
    <Svg>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff5a5a" /><stop offset="1" stopColor="#c40a0a" /></linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe9a8" /><stop offset="1" stopColor="#f2b541" /></linearGradient>
      </defs>
      <path d="M14 5h16l9 9v27a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z" fill={`url(#${id}b)`} />
      <path d="M30 5l9 9h-6a3 3 0 0 1-3-3z" fill="#8f0606" opacity=".35" />
      <rect x="17" y="21" width="15" height="14" rx="3" fill={`url(#${id}c)`} />
      <path d="M17 28h15M24.5 21v14M17 24.5h5M27 24.5h5M17 31.5h5M27 31.5h5" stroke="#b9801f" strokeWidth="1" fill="none" />
      <path d="M14 5h16" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
};

const VOUCHER_COLORS: Record<number, [string, string]> = {
  10: ["#4aa8ff", "#1556c9"],
  20: ["#3ddc97", "#0b8a5a"],
  50: ["#ffb84d", "#d9680b"],
  100: ["#c58bff", "#6a2bd1"],
};

export const VoucherArt = ({ value }: { value: number }) => {
  const [from, to] = VOUCHER_COLORS[value] ?? VOUCHER_COLORS[10];
  const id = useId();
  return (
    <Svg>
      <defs>
        <linearGradient id={`${id}v`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient>
      </defs>
      <g transform="rotate(-10 24 24)">
        <rect x="5" y="11" width="38" height="26" rx="4" fill="#0b2e73" opacity=".35" transform="translate(1.5 2)" />
        <rect x="5" y="11" width="38" height="26" rx="4" fill={`url(#${id}v)`} />
        <path d="M5 30c8-6 14 2 22-2s10-6 16-3v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="#fff" opacity=".9" />
        <text x="10" y="24" fontSize={value >= 100 ? 11 : 13} fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">{value}</text>
      </g>
    </Svg>
  );
};

export const RouterArt = (_: ArtProps) => {
  const id = useId();
  return (
    <Svg>
      <defs>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#c9d1de" /></linearGradient>
      </defs>
      <path d="M15 6l3 14M33 6l-3 14" stroke="#6b7689" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="24" cy="42" rx="17" ry="3" fill="#000" opacity=".12" />
      <rect x="5" y="20" width="38" height="18" rx="6" fill={`url(#${id}r)`} stroke="#aab3c3" strokeWidth="1" />
      <circle cx="14" cy="29" r="1.8" fill="#22c55e" /><circle cx="20" cy="29" r="1.8" fill="#22c55e" /><circle cx="26" cy="29" r="1.8" fill="#f59e0b" />
      <rect x="32" y="27.5" width="7" height="3" rx="1.5" fill="#8b95a8" />
    </Svg>
  );
};

export const DigitalVoucherArt = (_: ArtProps) => {
  const id = useId();
  return (
    <Svg>
      <defs>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff7a8a" /><stop offset="1" stopColor="#d6143a" /></linearGradient>
      </defs>
      <rect x="9" y="5" width="30" height="38" rx="6" fill={`url(#${id}d)`} />
      <rect x="14" y="12" width="20" height="20" rx="3" fill="#fff" />
      <path d="M17 15h6v6h-6zM25 15h6v6h-6zM17 23h6v6h-6z" fill="#d6143a" />
      <path d="M26 24h2v2h-2zM29 27h2v2h-2zM26 28h2v1h-2z" fill="#d6143a" />
      <rect x="19" y="36" width="10" height="2.5" rx="1.25" fill="#fff" opacity=".8" />
    </Svg>
  );
};

export const FingerprintArt = (_: ArtProps) => {
  const id = useId();
  return (
    <Svg>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5cc2ff" /><stop offset="1" stopColor="#1f6fdc" /></linearGradient>
      </defs>
      <rect x="6" y="6" width="36" height="36" rx="10" fill={`url(#${id}f)`} />
      <g stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M14 22a10 10 0 0 1 20 0" />
        <path d="M17 38c-1-4-1-8 1-12a6.5 6.5 0 0 1 12 0c1 3 1 6 0 9" />
        <path d="M24 24v6c0 4-1 7-2 9" />
        <path d="M30 31c0 3-.6 5-1.5 7" />
      </g>
    </Svg>
  );
};

// Model 2 — upright 5G tower unit.
export const TowerRouterArt = (_: ArtProps) => {
  const id = useId();
  return (
    <Svg>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#c9d1de" /><stop offset=".45" stopColor="#ffffff" /><stop offset="1" stopColor="#b3bccb" /></linearGradient>
      </defs>
      <ellipse cx="24" cy="43" rx="12" ry="2.6" fill="#000" opacity=".14" />
      <rect x="13" y="5" width="22" height="37" rx="9" fill={`url(#${id}t)`} stroke="#aab3c3" strokeWidth="1" />
      <rect x="13" y="14" width="22" height="3.5" fill="#e00b0b" opacity=".85" />
      <path d="M19 26a7 7 0 0 1 10 0M21.5 29.5a3.6 3.6 0 0 1 5 0" stroke="#6b7689" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="33" r="1.5" fill="#22c55e" />
    </Svg>
  );
};

// Model 3 — pocket MiFi with a signal screen.
export const PortableRouterArt = (_: ArtProps) => {
  const id = useId();
  return (
    <Svg>
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4b5563" /><stop offset="1" stopColor="#111827" /></linearGradient>
      </defs>
      <ellipse cx="24" cy="43" rx="13" ry="2.4" fill="#000" opacity=".14" />
      <rect x="10" y="6" width="28" height="36" rx="8" fill={`url(#${id}p)`} />
      <rect x="15" y="12" width="18" height="12" rx="3" fill="#0ea5e9" opacity=".9" />
      <path d="M19 20h2v2h-2zM23 18h2v4h-2zM27 16h2v6h-2z" fill="#fff" />
      <circle cx="24" cy="33" r="3.6" fill="none" stroke="#e00b0b" strokeWidth="2" />
      <circle cx="24" cy="33" r="1" fill="#e00b0b" />
    </Svg>
  );
};
