/**
 * Always-on "UET" build tag so developers and QA can tell at a glance they are in
 * the UET build. Rendered inline next to the page title inside every app header
 * (AppHeader plus the custom Home/Menu headers). Deliberately kept Latin in both
 * EN/AR — it is a build acronym, not translated copy.
 */
const UetTag = ({ className = "" }: { className?: string }) => (
  <span className={`uet-tag ${className}`} aria-label="UET build">
    UET
  </span>
);

export default UetTag;
