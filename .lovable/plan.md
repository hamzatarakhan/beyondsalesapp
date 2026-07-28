## Customer verification rules for Subscription Migration

Apply the table's rules to `src/pages/SubscriptionMigration.tsx`:

### 1. Post → Pre migration: no customer verification
- Detect direction from the current subscription (postpaid source → pre target).
- Skip rendering the Customer Verification row entirely in Checkout.
- Treat customer verification as auto-satisfied so OTP and the Pay/Submit button aren't gated by it.

### 2. Pre → Post migration: Nafath or Fingerprint only
- Keep the Customer Verification row.
- Pass a new prop to `SematiVerification` (e.g. `allowedMethods={["nafath", "fingerprint"]}`) so the method-select bottom sheet hides the Absher card.
- No other flows (SIM Activation, Fulfillment) change — the restriction is scoped to migration.

### Technical notes
- `SematiVerification` currently hard-codes the three method cards; add an optional `allowedMethods?: Method[]` prop (default: all) and filter the render list. Existing `audience="dealer"`/`"manafath"` behavior stays intact.
- Migration direction is already known from the detected current subscription; reuse that flag to conditionally render the verification block.

### Out of scope
- Which specific Pre→Post rows are NA in the source table — left as-is (all Pre→Post cases require Nafath/Fingerprint) until you specify exceptions.
