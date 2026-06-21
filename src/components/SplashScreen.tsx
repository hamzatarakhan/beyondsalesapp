import { useEffect, useState } from "react";
import logoAsset from "@/assets/main-logo.svg.asset.json";

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

const SplashScreen = ({ onFinish, duration = 1800 }: SplashScreenProps) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), duration - 400);
    const doneTimer = setTimeout(onFinish, duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <img
          src={logoAsset.url}
          alt="Logo"
          className="w-56 max-w-[70vw] h-auto animate-scale-in"
        />
        <div className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-1/2 animate-[loading_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;