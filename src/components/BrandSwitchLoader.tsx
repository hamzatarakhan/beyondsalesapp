import Lottie from "lottie-react";
import { useBrand } from "@/contexts/BrandContext";
import SplashScreen from "@/components/SplashScreen";
import friendiLoaderAnimation from "@/assets/friendi-loader.json";
import virginLoaderAnimation from "@/assets/virgin-loader.json";

// Each brand's Lottie has its own native aspect ratio (Friendi: wide/short title-bounce,
// Virgin: tall/narrow logo reveal) — size each within its own box so neither gets stretched
// or squashed to match the other.
const LOADER_BOX_CLASS: Record<"virgin" | "friendi", string> = {
  friendi: "w-40 h-auto",
  virgin: "w-28 h-56",
};

const BrandSwitchLoader = () => {
  const { switchingTo, switchPhase, finishBrandSwitch } = useBrand();

  if (!switchingTo || !switchPhase) return null;

  // Second phase: hand off to the app's own splash screen so switching brands feels like
  // the app is rebuilding itself, same as a cold start.
  if (switchPhase === "splash") {
    return <SplashScreen onFinish={finishBrandSwitch} />;
  }

  const animationData = switchingTo === "friendi" ? friendiLoaderAnimation : virginLoaderAnimation;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
      <div className={LOADER_BOX_CLASS[switchingTo]}>
        <Lottie
          animationData={animationData}
          loop
          rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default BrandSwitchLoader;
