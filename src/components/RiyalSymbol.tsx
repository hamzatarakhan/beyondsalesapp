import { cn } from "@/lib/utils";

interface RiyalSymbolProps {
  className?: string;
  /** Match the surrounding text color when true (default). */
  currentColor?: boolean;
}

/**
 * Saudi Riyal currency symbol. Sized to 1em so it scales with the
 * surrounding font-size, and aligned to sit on the text baseline.
 */
const RiyalSymbol = ({ className, currentColor = true }: RiyalSymbolProps) => {
  const fill = currentColor ? "currentColor" : "#000B25";
  return (
    <svg
      viewBox="0 0 14 16"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SAR"
      role="img"
      className={cn("inline-block h-[0.9em] w-auto align-[-0.1em]", className)}
      fill="none"
    >
      <g>
        <path
          d="M8.52607 13.5636C8.28161 14.1056 8.12001 14.6939 8.05811 15.3108L13.2314 14.211C13.4759 13.6691 13.6373 13.0807 13.6994 12.4639L8.52607 13.5636Z"
          fill={fill}
          fillOpacity={currentColor ? 1 : 0.64}
        />
        <path
          d="M13.2314 10.9167C13.4758 10.3747 13.6374 9.78637 13.6993 9.16949L9.6695 10.0266V8.37895L13.2312 7.62205C13.4757 7.08011 13.6373 6.49175 13.6992 5.87487L9.66938 6.73121V0.805893C9.05189 1.1526 8.5035 1.6141 8.05771 2.15847V7.0739L6.44605 7.41646V0C5.82856 0.346584 5.28017 0.808209 4.83438 1.35258V7.7589L1.22828 8.52519C0.983816 9.06712 0.822101 9.65549 0.760072 10.2724L4.83438 9.40652V11.4814L0.467962 12.4093C0.2235 12.9512 0.0619074 13.5396 0 14.1564L4.57043 13.1852C4.94248 13.1078 5.26225 12.8878 5.47015 12.5851L6.30834 11.3425V11.3422C6.39535 11.2137 6.44605 11.0586 6.44605 10.8917V9.06395L8.05771 8.72139V12.0166L13.2312 10.9164L13.2314 10.9167Z"
          fill={fill}
          fillOpacity={currentColor ? 1 : 0.64}
        />
      </g>
    </svg>
  );
};

export default RiyalSymbol;