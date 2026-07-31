import Lottie from "lottie-react";
import { useBrand } from "@/contexts/BrandContext";
import { cn } from "@/lib/utils";
import friendiLoaderAnimation from "@/assets/friendi-loader.json";
import virginLoaderAnimation from "@/assets/virgin-loader.json";

/**
 * Inline busy indicator playing the active brand's Lottie — the same animation the
 * brand switcher shows, scaled down to sit inside a button.
 *
 * Both animations are full-screen compositions, so they need per-brand handling to
 * stay legible at ~32px tall:
 *  - Virgin's canvas is 1080x1920 but its logo only fills the middle ~40%, so the
 *    artwork is scaled up and the empty margins are cropped away.
 *  - Friendi's canvas is a tight 100x64 around the wordmark, so it needs no zoom.
 */
const LOADER_STYLE: Record<"virgin" | "friendi", { box: string; scale: string }> = {
  virgin: { box: "h-8 w-9", scale: "scale-[2.4]" },
  friendi: { box: "h-8 w-14", scale: "scale-100" },
};

interface Props {
  /**
   * Set on a filled primary button. Both animations are drawn in their own brand
   * colour — the same colour as the button behind them — so this renders them white
   * to make them visible.
   */
  onPrimary?: boolean;
  className?: string;
}

const BrandLoader = ({ onPrimary, className }: Props) => {
  const { brand } = useBrand();
  const animationData = brand === "friendi" ? friendiLoaderAnimation : virginLoaderAnimation;
  const { box, scale } = LOADER_STYLE[brand];

  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-flex items-center justify-center shrink-0 overflow-hidden", box, className)}
      style={onPrimary ? { filter: "brightness(0) invert(1)" } : undefined}
    >
      <Lottie
        animationData={animationData}
        loop
        rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
        className={cn("w-full h-full", scale)}
      />
    </span>
  );
};

export default BrandLoader;
