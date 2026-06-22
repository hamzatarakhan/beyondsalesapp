import { useEffect, useState } from "react";
import logoAsset from "@/assets/main-logo.svg.asset.json";

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
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-background transition-opacity duration-700 ease-in-out ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Animated ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-primary/10 blur-[80px] animate-blob-slow"
          aria-hidden="true"
        />
        <div
          className="absolute -right-1/4 top-1/3 h-2/3 w-2/3 rounded-full bg-secondary/50 blur-[60px] animate-blob-slow"
          style={{ animationDelay: "-4s" }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-1/4 left-1/4 h-1/2 w-1/2 rounded-full bg-primary/5 blur-[70px] animate-blob-slow"
          style={{ animationDelay: "-8s" }}
          aria-hidden="true"
        />
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative">
          {/* Soft pulse ring behind logo */}
          <div className="absolute inset-0 -m-8 rounded-full bg-primary/20 blur-2xl animate-ping-slow" aria-hidden="true" />
          <img
            src={logoAsset.url}
            alt="Beyond Sales App"
            className="relative w-56 max-w-[68vw] h-auto animate-logo-reveal"
          />
        </div>

        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <p className="text-base font-semibold tracking-tight text-foreground">
            Beyond Sales App
          </p>
          <div className="flex items-center gap-1.5" aria-label="Loading">
            <span
              className="h-2 w-2 rounded-full bg-primary animate-bounce-dot"
              style={{ animationDelay: "0s" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-primary animate-bounce-dot"
              style={{ animationDelay: "0.12s" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-primary animate-bounce-dot"
              style={{ animationDelay: "0.24s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
