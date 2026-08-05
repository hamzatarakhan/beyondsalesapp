import { useBrand } from "@/contexts/BrandContext";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";

const BrandSwitchLoader = () => {
  const { switchingTo } = useBrand();
  if (!switchingTo) return null;

  // Plays the brand animation for the incoming brand, not the one still active.
  return <BrandLoadingOverlay open brand={switchingTo} />;
};

export default BrandSwitchLoader;
