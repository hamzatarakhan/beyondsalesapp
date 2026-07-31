import { useBrand } from "@/contexts/BrandContext";
import SplashScreen from "@/components/SplashScreen";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";

const BrandSwitchLoader = () => {
  const { switchingTo, switchPhase, finishBrandSwitch } = useBrand();

  if (!switchingTo || !switchPhase) return null;

  // Second phase: hand off to the app's own splash screen so switching brands feels like
  // the app is rebuilding itself, same as a cold start.
  if (switchPhase === "splash") {
    return <SplashScreen onFinish={finishBrandSwitch} />;
  }

  // First phase plays the brand animation the incoming brand, not the one still active.
  return <BrandLoadingOverlay open brand={switchingTo} />;
};

export default BrandSwitchLoader;
