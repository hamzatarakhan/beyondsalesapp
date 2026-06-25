## Add "New Activation" to Customer Activities

Add a 5th tile labeled **New Activation** to the Customer Activities widget on Home. It routes through the existing dealer/customer verification, then enters an extended version of `PrepaidActivation` running in a new "new-activation" mode.

### 1. Home tile
- `src/pages/Home.tsx`: append `{ icon: Sparkles, label: "New Activation", path: "/prepaid-search?mode=new" }` to `activities`. Reuse `handleActivityClick` so verification runs first. (Grid already wraps to 2 rows for 5 items.)

### 2. Search/verification entry
- `PrepaidSearchCustomer.tsx`: pass `mode=new` through to `/prepaid-activation` so the activation page knows to render the new flow.

### 3. Extend `PrepaidActivation.tsx` with a new staged flow (4 stages)
Add a `mode === "new"` branch that reuses existing components but with new stage definitions in `FlowStepper`:

**Stage 1 — Identity**
- Existing identity sub-stage (reuse current staged Identity step).

**Stage 2 — Service & SIM**
- Service type segmented tabs: **Mobile**, **MBB**, **HBB**.
- SIM Type tabs, conditional per service:
  - Mobile: P-SIM / E-SIM
  - MBB: P-SIM / E-SIM
  - HBB: P-SIM only (tabs hidden / locked)
- If E-SIM selected → show an "Allowed devices" info card (placeholder list of supported iPhone models + iOS versions, with a styled slot for the user's screenshots later).
- KIT input (existing validation: 10 digits, starts with `12`; skipped if E-SIM as today).

**Stage 3 — Subscription details**
- Subscription Type tabs: **SIM Number** / **MNP**.
  - If MNP: show **Port number**, **Operator** (dropdown), **Contact number** fields.
- Payment Type tabs: **Prepaid** (default) / **Postpaid**.
  - For **MBB**: lock to Prepaid only.
  - For **HBB**: rename to match (Prepaid 5G / Postpaid 5G / Vnet) but reuse same toggle.
- Plan Type tabs: **With Plan** (default) / **With Topup**.
  - **With Plan**: existing Plan Type dropdown + Filters chips + plan cards (reused).
  - **With Topup**: show denomination chips (e.g. 10, 20, 50, 100 SAR) + "Enter amount manually" input. Hidden for HBB (no topup).
- Address details: reuse existing dynamic address fields block.

**Stage 4 — Checkout**
- Summary card (reflects all selections incl. service/sim/subscription/plan-or-topup/MNP fields).
- Payment method (existing).
- **OTP Verification** drawer triggered **before** the customer verification step, on the checkout page (a "Send OTP" button gates Pay; 4–6 digit input, demo auto-accept).
- Customer & Dealer signature pads (moved here from earlier stages for this mode).
- Terms and Conditions checkbox + existing T&C drawer.
- Pay button → existing success bottom sheet (already shows full summary).

### 4. FlowStepper
- Add `NEW_ACTIVATION_STEPS = ["Identity", "Service & SIM", "Subscription", "Checkout"]` and accept a `variant="new"` prop. Search page passes the same variant so the stepper is consistent across both pages.

### 5. Conditional rules (single source of truth)
Encapsulate as helpers inside `PrepaidActivation.tsx`:
- `simTypesFor(service)` → restricts SIM options.
- `paymentTypesFor(service)` → MBB locked to Prepaid.
- `planModesFor(service)` → HBB hides "With Topup".
- `showEsimDevices` when `simType === "esim"`.

### Out of scope / deferred
- Real iPhone screenshots for the eSIM devices section (placeholder list now; user will upload assets later).
- Backend wiring — same dummy data approach as the existing flow.

### Technical notes
- No new pages; everything reuses `PrepaidActivation.tsx` and existing primitives (`SourceTab`, `SignatureBox`, plan cards, drawers, `SuccessBottomSheet`).
- New mode is selected via URL query (`?mode=new`) and stored in component state alongside the existing `staged` mode.
- Topup denominations and MNP operator list are local constants for now.
