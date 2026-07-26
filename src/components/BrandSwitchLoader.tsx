import Lottie from "lottie-react";
import { useBrand } from "@/contexts/BrandContext";
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
  const { switchingTo } = useBrand();

  if (!switchingTo) return null;

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
