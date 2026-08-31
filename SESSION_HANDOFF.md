# Session Handoff — SalesPoint SIM Activation Flow

_Generated 2026-07-08. Paste this file's content (or point Claude at it) at the start of a new
session to resume with minimal re-exploration._

## Standing rules (already saved in memory, but repeating for safety)
- **Do not `git push`** until the user explicitly says to push. Keep committing locally as normal.
- **Arabic i18n is temporarily PAUSED** — do not add/update `ar.json` entries or RTL work unless
  the user un-pauses it. English-only (`en.json`) for now.

## Current git state
- Branch `main` is **1 commit ahead of `origin/main`** (unpushed):
  - `d740b03` — Revert "Make whole plan card tappable to select; drop the separate Select button"
    (this undid commit `227b473`, per explicit user request).
- `origin/main` HEAD is `227b473`.
- Working tree is clean, `npx tsc --noEmit` passes.
- **Do not push `d740b03` (or anything else) until told to.**

## What `src/components/PlanCard.tsx` looks like right now
Back to the **pre-227b473** state: plan selection happens via a separate
`<button>` at the bottom of the card ("Select this plan" / "Selected"), **not**
whole-card-tap. The whole-card-tappable redesign was tried and explicitly reverted —
don't reintroduce it unless asked again.

## Key logic in `src/pages/NewActivation.tsx` (~lines 391–397)
Derived flags driving OTP / Contact Number visibility & requirement:
```tsx
const showTopupTab = isPrepaidMobile || isPrepaidInternet;

// Contact number: always shown. Mandatory for VNet, 5G Data, Switch Postpaid — optional otherwise.
// For E-SIM, always visible but never required, even on those three cases.
const contactNumberRequired = (isPrepaidInternet || isPostpaidInternet || isPostpaidMobile) && simType !== "esim";

// OTP: mandatory for VNet/5G Data/Switch Postpaid on P-SIM. For E-SIM, shown on
// every case (including Basic/Baqa/Aman/Flex) but never required.
const showOtp     = isPrepaidInternet || isPostpaidInternet || isPostpaidMobile || simType === "esim";
const otpRequired = (isPrepaidInternet || isPostpaidInternet || isPostpaidMobile) && simType !== "esim";
const showNumber  = isPrepaidMobile || isPostpaidMobile;
```
- `isContactValid` / `canPay` were updated to use `contactNumberRequired` / `otpRequired`
  (not the old `showX` flags) for validation.
- Contact Number field now always renders; label gets a `*` suffix only when
  `contactNumberRequired` is true.
- OTP `SectionCard` renders when `showOtp`, marked `required={otpRequired}`.
- Customer-verification disable/hint logic uses `otpRequired`, not `showOtp`.

## Other recent changes this project (context, not pending work)
- Vanity numbers (Switch Postpaid): Gold's `minTier` corrected to 250 (same as Diamond) —
  both Gold and Diamond only unlock free-with-commitment on Postpaid 250/300/365.
- Vanity promo banner simplified to short fixed title + colored tier pills.
- Switch Postpaid credit-limit info banner (20% of plan price) added between Promo Code
  and Payment Summary sections.
- New English-only i18n keys added (no Arabic yet): `activation.checkout.creditLimitNote`,
  `creditLimitSub`, `activation.vanity.availableBannerTitle`.

## Pending / open items
- Nothing explicitly requested beyond the revert-and-hold-push instruction. No active task.
- If resuming plan-card UX work: user wants tap-to-select on the whole card without changing
  card height, "best UX/UI way" — but that attempt was reverted, so treat it as a fresh design
  problem if revisited, not a resurrection of commit `227b473`.

## How to verify UI changes
Use the `mcp__Claude_Preview__*` tools (preview_start, preview_snapshot, preview_eval, etc.),
not Bash, for running/inspecting the dev server.
