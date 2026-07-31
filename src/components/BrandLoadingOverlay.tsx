import Lottie from "lottie-react";
import { useBrand, type Brand } from "@/contexts/BrandContext";
import friendiLoaderAnimation from "@/assets/friendi-loader.json";
import virginLoaderAnimation from "@/assets/virgin-loader.json";

// Each brand's Lottie has its own native aspect ratio (Friendi: wide/short title-bounce,
// Virgin: tall/narrow logo reveal) — size each within its own box so neither gets stretched
// or squashed to match the other.
const LOADER_BOX_CLASS: Record<Brand, string> = {
  friendi: "w-40 h-auto",
  virgin: "w-28 h-56",
};

interface Props {
  open: boolean;
  /** Brand whose animation to play. Defaults to the active brand. */
  brand?: Brand;
}

/**
 * Full-screen brand-animation overlay shown while something is loading. Shared so a
 * page-level wait looks exactly like the brand switcher's loading step, and so the
 * dimmed backdrop blocks interaction until the work finishes.
 */
const BrandLoadingOverlay = ({ open, brand }: Props) => {
  const { brand: activeBrand } = useBrand();
  const shown = brand ?? activeBrand;

  if (!open) return null;

  const animationData = shown === "friendi" ? friendiLoaderAnimation : virginLoaderAnimation;

  return (
    <div role="status" aria-label="Loading" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
      <div className={LOADER_BOX_CLASS[shown]}>
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

export default BrandLoadingOverlay;
