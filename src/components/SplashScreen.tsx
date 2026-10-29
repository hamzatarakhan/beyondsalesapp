import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { useTranslation } from "react-i18next";
import { Flag } from "lucide-react";
import splashLight from "@/assets/splash-light.json";
import splashDark from "@/assets/splash-dark.json";
import { useTheme } from "@/contexts/ThemeContext";

interface SplashScreenProps {
  onFinish: () => void;
}

// Both splashes are the same 150-frame @ 60fps (2.5s) animation; only the artwork differs.
// The page backdrop repeats each file's own diagonal gradient so a wide window has no seam.
const SPLASH = {
  light: { data: splashLight, background: "linear-gradient(135deg, #BCD6F7 0%, #ECE5F1 50%, #FAD0BE 100%)" },
  dark: { data: splashDark, background: "linear-gradient(135deg, #13243A 0%, #15131B 50%, #2C1620 100%)" },
} as const;

const PLAY_MS = 2500;

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const splash = SPLASH[theme];
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Show the full play, then fade out.
    const fadeTimer = setTimeout(() => setFadingOut(true), PLAY_MS);
    const doneTimer = setTimeout(onFinish, PLAY_MS + 700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-700 ease-in-out ${
        fadingOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      style={{ background: splash.background }}
    >
      <Lottie
        animationData={splash.data}
        loop={false}
        rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
        className="h-full aspect-[9/16] max-w-full"
      />
      {/* Sits centred just under the logo; same yellow marker in light and dark so it reads on either backdrop. */}
      <div className="absolute inset-x-0 top-[58%] flex justify-center px-6">
        <div role="note" className="flex max-w-full items-center gap-2 rounded-full text-center bg-yellow-200/90 px-4 py-2 text-xs font-medium text-yellow-900 shadow-sm ring-1 ring-yellow-400/40 backdrop-blur-sm opacity-0 animate-fade-in-up">
          <Flag className="h-3.5 w-3.5 shrink-0 fill-yellow-600/70 text-yellow-700" />
          {t("splash.prototypeNotice")}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
