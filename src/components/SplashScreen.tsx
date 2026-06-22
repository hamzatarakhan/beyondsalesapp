import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import splashAnimation from "@/assets/beyond_one_splash_dark.json";

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

const SplashScreen = ({ onFinish, duration = 2500 }: SplashScreenProps) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), duration - 500);
    const doneTimer = setTimeout(onFinish, duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#0b1220] transition-opacity duration-700 ease-in-out ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <Lottie
        animationData={splashAnimation}
        loop={false}
        autoplay
        className="w-full h-full max-w-[100vmin] max-h-[100vmin]"
      />
    </div>
  );
};

export default SplashScreen;
