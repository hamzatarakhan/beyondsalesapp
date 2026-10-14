/**
 * Always-on "UAT" build tag so developers and QA can tell at a glance they are in
 * the UAT build. Rendered once, inline next to the dealer name on the Home header —
 * deliberately not shown inside feature-page headers, which stay clean.
 * Deliberately kept Latin in both EN/AR — it is a build acronym, not translated copy.
 */
const UatTag = ({ className = "" }: { className?: string }) => (
  <span className={`uat-tag ${className}`} aria-label="UAT build">
    UAT
  </span>
);

export default UatTag;
