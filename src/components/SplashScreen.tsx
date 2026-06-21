import { useEffect, useState } from "react";
import logoAsset from "@/assets/main-logo.svg.asset.json";

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

// Palette pulled directly from the Beyond logo pixel grid
const PIXEL_COLORS = [
  "#0076BF", "#027B95", "#0A7A6B", "#365240", "#582F3C",
  "#417041", "#56563E", "#643E3A", "#2583C6", "#758768",
  "#70783D", "#7C4037", "#873037", "#7C8DA3", "#948E67",
  "#958039", "#9A4133", "#9D3036", "#9694C8", "#A997A4",
  "#B59665", "#BB8833", "#B16233", "#BC412E", "#B82B30",
  "#DA8F2B", "#D1652C", "#F6ADCD", "#F8ABA4", "#EF3E23",
  "#ED1C24",
];

const GRID_COLS = 7;
const GRID_ROWS = 7;

const SplashScreen = ({ onFinish, duration = 2600 }: SplashScreenProps) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), duration - 500);
    const doneTimer = setTimeout(onFinish, duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onFinish]);

  const tiles = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const delay = (col + row) * 70;
    const color = PIXEL_COLORS[(i * 7) % PIXEL_COLORS.length];
    return { i, delay, color };
  });

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-white transition-opacity duration-500 ease-out ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            width: "min(78vw, 360px)",
            height: "min(78vw, 360px)",
          }}
        >
          {tiles.map((t) => (
            <span
              key={t.i}
              className="rounded-[6px] splash-tile"
              style={{
                backgroundColor: t.color,
                animationDelay: `${t.delay}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.85)_30%,_rgba(255,255,255,0.35)_60%,_rgba(255,255,255,0)_100%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center gap-6 splash-logo-in">
        <img
          src={logoAsset.url}
          alt="Beyond Sales"
          className="w-52 max-w-[64vw] h-auto drop-shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        />
        <div
          className="h-[3px] w-24 overflow-hidden rounded-full bg-black/5"
          aria-label="Loading"
        >
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#0076BF] via-[#BB8833] to-[#ED1C24] splash-bar" />
        </div>
      </div>

      <style>{`
        @keyframes splash-tile-in {
          0%   { opacity: 0; transform: scale(0.4); }
          60%  { opacity: 1; transform: scale(1.08); }
          100% { opacity: 0.85; transform: scale(1); }
        }
        .splash-tile {
          opacity: 0;
          transform-origin: center;
          animation: splash-tile-in 700ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes splash-logo-in {
          0%   { opacity: 0; transform: scale(0.92) translateY(8px); filter: blur(6px); }
          100% { opacity: 1; transform: scale(1) translateY(0);     filter: blur(0); }
        }
        .splash-logo-in {
          opacity: 0;
          animation: splash-logo-in 800ms cubic-bezier(0.22, 1, 0.36, 1) 700ms forwards;
        }
        @keyframes splash-bar-slide {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
        .splash-bar {
          animation: splash-bar-slide 1.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;