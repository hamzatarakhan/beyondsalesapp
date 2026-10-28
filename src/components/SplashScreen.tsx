import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import loaderAnimation from "@/assets/loader-b1.json";
import splashLight from "@/assets/splash-light.json";
import { useTheme } from "@/contexts/ThemeContext";

interface SplashScreenProps {
  onFinish: () => void;
}

// Light mode plays the full "Beyond ONE" splash (150 frames @ 60fps = 2.5s) on its own
// gradient; dark mode keeps the short loader over a dimmed backdrop.
const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const { theme } = useTheme();
  const light = theme === "light";
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Light: 2.5s animation. Dark: 39 frames @ 30fps = 1.3s. Show the full play, then fade out.
    const playMs = light ? 2500 : 1300;
    const fadeTimer = setTimeout(() => setFadingOut(true), playMs);
    const doneTimer = setTimeout(onFinish, playMs + 700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish, light]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-700 ease-in-out ${
        light ? "" : "bg-black/80"
      } ${fadingOut ? "opacity-0" : "opacity-100"}`}
      // Same diagonal gradient as the animation's own background, so a wide window has no seam.
      style={light ? { background: "linear-gradient(135deg, #BCD6F7 0%, #ECE5F1 50%, #FAD0BE 100%)" } : undefined}
    >
      {light ? (
        <Lottie
          animationData={splashLight}
          loop={false}
          rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
          className="h-full aspect-[9/16] max-w-full"
        />
      ) : (
        <Lottie
          animationData={loaderAnimation}
          loop={false}
          rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
          className="w-40 aspect-[9/16]"
        />
      )}
    </div>
  );
};

export default SplashScreen;
