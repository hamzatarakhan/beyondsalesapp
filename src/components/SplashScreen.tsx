import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import splashAnimation from "@/assets/splash.json";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Animation is 47 frames @ 30fps ≈ 1.57s — show for ~2s then fade out
    const fadeTimer = setTimeout(() => setFadingOut(true), 1800);
    const doneTimer = setTimeout(onFinish, 2500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-700 ease-in-out ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: "linear-gradient(to bottom right, #bcd7f7, #ecced9, #fad0be)" }}
    >
      <Lottie
        animationData={splashAnimation}
        loop={false}
        className="w-full h-full max-w-full max-h-full object-contain"
      />
    </div>
  );
};

export default SplashScreen;
