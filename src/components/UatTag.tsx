/**
 * Always-on "UAT" build tag so developers and QA can tell at a glance they are in
 * the UAT build. Rendered inline next to the dealer name on the Home header and
 * standalone above the logo on the login screen — deliberately not shown inside
 * feature-page headers, which stay clean.
 * Deliberately kept Latin in both EN/AR — it is a build acronym, not translated copy.
 */
type UatTagProps = {
  className?: string;
  /** "sm" is the inline name-line size (18px tall); "md" is the standalone size above the logo. */
  size?: "sm" | "md";
};

const UatTag = ({ className = "", size = "sm" }: UatTagProps) => (
  <span
    className={`uat-tag ${size === "md" ? "uat-tag--md" : ""} ${className}`}
    aria-label="UAT build"
  >
    UAT
  </span>
);

export default UatTag;
