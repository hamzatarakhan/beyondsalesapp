import { cn } from "@/lib/utils";

interface SarIconProps {
  className?: string;
  /** Inline SVG height; width scales automatically. Defaults to 1em so it matches surrounding text. */
  size?: number | string;
}

/**
 * Official Saudi Riyal currency symbol. Uses `currentColor`, so set color via
 * `className` (e.g. `text-primary`). Sized in `em` by default so it lines up
 * with the adjacent text.
 */
export const SarIcon = ({ className, size = "1em" }: SarIconProps) => (
  <svg
    role="img"
    aria-label="SAR"
    viewBox="0 0 14 16"
    height={size}
    width="auto"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("inline-block align-[-0.125em] shrink-0", className)}
  >
    <path d="M8.52558 13.5626C8.28112 14.1047 8.11952 14.6929 8.05762 15.3098L13.2309 14.2101C13.4754 13.6681 13.6368 13.0798 13.6989 12.4629L8.52558 13.5626Z" />
    <path d="M13.2314 10.9167C13.4758 10.3747 13.6374 9.78637 13.6993 9.16949L9.6695 10.0266V8.37895L13.2312 7.62205C13.4757 7.08011 13.6373 6.49175 13.6992 5.87487L9.66938 6.73121V0.805893C9.05189 1.1526 8.5035 1.6141 8.05771 2.15847V7.0739L6.44605 7.41646V0C5.82856 0.346584 5.28017 0.808209 4.83438 1.35258V7.7589L1.22828 8.52519C0.983816 9.06712 0.822101 9.65549 0.760072 10.2724L4.83438 9.40652V11.4814L0.467962 12.4093C0.2235 12.9512 0.0619074 13.5396 0 14.1564L4.57043 13.1852C4.94248 13.1078 5.26225 12.8878 5.47015 12.5851L6.30834 11.3425V11.3422C6.39535 11.2137 6.44605 11.0586 6.44605 10.8917V9.06395L8.05771 8.72139V12.0166L13.2312 10.9164L13.2314 10.9167Z" />
  </svg>
);

export default SarIcon;