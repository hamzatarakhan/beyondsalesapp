import { useTranslation } from "react-i18next";

/**
 * Always-on build tag so everyone can tell at a glance this is a prototype, not the real app.
 * Rendered inline next to the dealer name on the Home header and standalone above the logo on
 * the login screen — deliberately not shown inside feature-page headers, which stay clean.
 */
type UatTagProps = {
  className?: string;
  /** "sm" is the inline name-line size (18px tall); "md" is the standalone size above the logo. */
  size?: "sm" | "md";
};

const UatTag = ({ className = "", size = "sm" }: UatTagProps) => {
  const { t } = useTranslation();
  return (
    <span className={`uat-tag whitespace-nowrap normal-case tracking-normal ${size === "md" ? "uat-tag--md" : ""} ${className}`}>
      {t("uatTag.prototypeOnly")}
    </span>
  );
};

export default UatTag;
