import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import loaderAnimation from "@/assets/loader-b1.json";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Animation is 39 frames @ 30fps = 1.3s — show for the full play then fade out
    const fadeTimer = setTimeout(() => setFadingOut(true), 1300);
    const doneTimer = setTimeout(onFinish, 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-background transition-opacity duration-700 ease-in-out ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <Lottie
        animationData={loaderAnimation}
        loop={false}
        rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
        className="w-40 aspect-[9/16]"
      />
    </div>
  );
};

export default SplashScreen;
