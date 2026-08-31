# SalesPoint — Application Documentation

**Prototype dealer app for Virgin Mobile (VM) and friendi Mobile (FM), Saudi Arabia.**
Generated from the current state of the codebase at `c:\Users\HamzaTarkan\SalesPoint`.

---

## 1. What this app is

SalesPoint is a mobile-first web app (React SPA, deployed as a Progressive-Web-App-style "mobile container") used by **telecom dealers/agents** to activate SIMs, manage customer subscriptions, handle billing, and run day-to-day dealer/field operations for two operator brands: **Virgin Mobile** and **friendi Mobile**. It is explicitly a **prototype** — most flows use hardcoded demo data, simulated OTPs, and mock success/failure outcomes (~85% success rate) rather than real backend integrations, and this is stated in-app via "Prototype only — test numbers" boxes on nearly every flow.

### Tech stack
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui component primitives (Radix-based)
- React Router v6 (`src/App.tsx` holds the full route table)
- react-i18next for localization (English / Arabic, with RTL support)
- React Context for cross-cutting state: auth, brand, language, theme, widgets
- `react-qr-code` / a public QR API for QR generation, Leaflet-based `MapPicker` for location picking, Embla Carousel for the Home hero banner

---

## 2. Cross-cutting systems

### 2.1 Authentication (`AuthContext`)
- `isLoggedIn` persisted to `localStorage` (`app-auth`).
- All routes are wrapped in `RequireAuth` except `/login`, `/forgot-password`, and `/device-registration`.
- **Login** (`/login`): username/password → `AuthContext.login()` → navigate to `/`, with a splash/loader overlay (`LoginTransitionOverlay`) that plays on top of the already-mounted Home screen.
- **Forgot Password** (`/forgot-password`): 3-step wizard — username → 4-digit OTP (30s resend) → new password (rules: uppercase, special char, numeric, ≥8 chars, confirm-match).
- **Device Registration** (`/device-registration`): one-time device enrollment — username/password + phone, demo device info (device ID, Android version, model), 4-digit OTP, then auto-redirects to Login.

### 2.2 Brand system (`BrandContext`)
The whole app can operate as either **Virgin Mobile** or **friendi Mobile**, switched via a brand badge/picker on Home. This changes:
- Logo/branding shown in the header and Profile.
- Which services are available — e.g. **Bill Payment and postpaid-related tiles are Virgin-only** (friendi has no postpaid product), and Subscription Migration widgets are Virgin-only for the same reason.
- Some flows have brand-specific demo data (e.g. SIM Termination test numbers tagged `virgin` vs `friendi`).

### 2.3 Localization (`LanguageContext`)
Full English/Arabic support with RTL layout flipping (mirrored icons, `rtl:` Tailwind variants, direction-aware carousels/inputs). All user-facing strings live in `src/i18n/locales/en.json` / `ar.json` under per-feature namespaces (`activation`, `billPayment`, `simTermination`, `home`, etc.). Note: several activation-flow namespaces (`activation`, `activation3`, `activation4`, `activation5`, `activationV2`) duplicate near-identical key sets, since each corresponds to a separate activation-flow prototype variant (see §4.1).

### 2.4 Theme (`ThemeContext`)
Light / Dark / System theme mode, persisted (`app-theme`), configurable from Settings.

### 2.5 Home widget system (`WidgetsContext`)
Home's sections are user-configurable **widgets** — each can be toggled on/off and drag-reordered from Settings. Default order:

1. Customer Activities
2. Credit Limit Options
3. Subscription Migration Options
4. SIM Services
5. E Wallets
6. Other Services
7. Member Onboarding
8. Dealer Visit
9. Tickets
10. Working Shift

The config is stored in `localStorage` (versioned key, currently `app-widgets-v10` — bumped whenever a widget's *default position* changes, since the merge logic only appends newly-added widgets and never reorders ones a device already has stored).

### 2.6 Verification pattern (`SematiVerification`)
Nearly every sensitive action (dealer-level actions from Home, customer-facing actions inside a flow) goes through a shared verification component offering **Nafath** (Saudi national digital-identity app) or **device Fingerprint**, simulated with a short animated wait. Two audiences: `"dealer"` (verifying the dealer/agent) and `"customer"` (verifying the end customer mid-flow). One documented exception: **Adjust Credit Limit skips dealer verification entirely** when opened from Home, by design.

### 2.7 OTP pattern
Every OTP step uses the same convention: a 4–6 digit code entry with a 30-second resend timer, and a **deliberate wrong-code test value** (`111111` for 6-digit OTPs, `1111` for 4-digit) that always shows the error state so testers can exercise that path without needing a real failure condition.

### 2.8 "Prototype only — test numbers" boxes
Almost every lookup-driven flow (MSISDN, Civil ID, voucher code, etc.) ships a collapsible demo box listing which test values exercise which case (active/terminated/not-found/paid/unpaid/etc.), explicitly labeled as not appearing in the real implementation.

### 2.9 Success / Failure pattern
Actions that submit something (payment, activation, termination) resolve after a short delay to either a **Success** bottom sheet (checkmark, order/reference ID, "Go to Home") or a **Failure** bottom sheet (Retry / Cancel), simulated via a ~85% random success rate. The richest version, `SuccessBottomSheet` (shared component), additionally supports a **real generated QR code + "Share via Mobile/Email"** panel for eSIM flows — sharing shows an in-app **toast** and returns to Home (an earlier version tried real `sms:`/`mailto:` OS links, which crashed in-browser and was replaced).

---

## 3. Home screen

Home (`/`) is the dealer's dashboard: a rotating hero banner, then the widget stack described in §2.5. Tapping most tiles triggers dealer verification (§2.6) before navigating to the target flow. Feature tiles carry a **rollout-status badge** — `Confirmed` (approved) / `Needs Confirm` / `In Progress` — or, for services with multiple parallel prototype variants, a `Special "Option N"` badge instead.

---

## 4. Feature catalog

### 4.1 SIM Activation & Onboarding

**SIM Activation** (`/new-activation-3`) — the live, Home-linked activation flow (Sparkles icon, "Confirmed" badge). Multi-step: Identity → Subscription (line type, SIM type Physical/eSIM, subscription type Prepaid/Postpaid/Basic Postpaid, plan selection) → Checkout (payment, verification, OTP, terms, signatures) → Success. Handles Saudi ID/Iqama/GCC ID/passport/visa identity types, number porting (MNP), and both "Continue Activation" (customer already selected everything online; dealer fulfills) and full self-service activation. Includes business rules like:
- KIT-code-to-plan reservation checks (a KIT code can be pre-reserved to a specific plan; entering a mismatched KIT is blocked, with different messaging for paid vs unpaid Continue Activation).
- eSIM + Data line type forces Prepaid-only (Postpaid/Basic Postpaid excluded, not just disabled).
- Paid Continue Activation shows read-only Line Type and Subscription Type sections instead of editable ones.

**Fulfilment** (`/new-activation-3?flow=fulfilment`) — same underlying flow, entered specifically to fulfil an online-initiated activation ("Needs Confirm" badge).

**Dormant activation variants** — `NewActivation.tsx` (original), `NewActivation4.tsx`, `NewActivation5.tsx`, `NewActivationV2.tsx` are **parallel, unlinked design-iteration copies** of the same multi-step activation flow (each ~2,500–3,700 lines), reachable only by direct URL (`/new-activation`, `/new-activation-4`, `/new-activation-5`, `/new-activation-v2`), not from Home or Menu. They exist for side-by-side design review, not as live product variants — hence the duplicated i18n namespaces noted in §2.3.

**Prepaid Activation** (`/prepaid-activation`) — a separate, self-contained prepaid-only activation pipeline (own `FlowStepper`, plan cards, draft persistence via `saveActivationDraft`/`getActivationDraft` so an in-progress activation survives navigating away). Reached via `PrepaidSearchCustomer` (`/prepaid-search`) → optionally `ExistingCustomerFound` (`/prepaid-existing-customer`, shows a matched customer's prior activation snapshot to resume) → `PrepaidActivation`. Not linked from Home in the current build.

**Member Onboarding widget** (Home):
- **Channel Onboarding** (`/channel-onboarding`) — onboard a new **channel partner/member** (Sales Partner, Distributor, POS, Sales Promoter, Sales Champion, Team Leader, Account Manager) into the dealer hierarchy, via a role-specific dynamic form (org details, IBAN, CR expiry, national address via map picker, required document uploads).
- **Onboarding Requests** (`/onboarding-requests`) — "My Requests" vs "My Tasks" (approvals awaiting the current user as line manager). Status flow: `submitted → approval-pending-1 → approval-pending-2 → activation-pending → activated`, with `rejected`/`resubmitted` branches.

### 4.2 Billing & Payments

**Bill Payment** (`/bill-payment`, Virgin-only) — look up by MSISDN (Switch Postpaid or Vnet) or Civil ID (returns all accounts under that ID). Each bill shows Current Balance / Unbilled Amount / Out of Bundle Usage / Total (VAT incl.) — **Unbilled and Out of Bundle are currently pinned to 0.00 across all demo data** (this prototype doesn't generate on-demand bills, so Current Balance carries the full total due). Supports single or multi-account payment with per-account amount entry (min 10 SAR, capped at that account's total due).

**Credit Limit Adjustment** — **five parallel entry points** from Home's "Credit Limit Options" widget (`?option=1`–`5`), each a different UI approach to picking the new limit on the *same* underlying flow, kept side-by-side for design review: slider, predefined-amount buttons, swipeable carousel, plain wheel picker, and a zero-centered slider. This is the one service that **skips dealer verification** entirely.

**Credit Transfer** (`/credit-transfer`) — dealer transfers credit from their own wallet to a customer's prepaid MSISDN. Validates the line isn't terminated, offers predefined amounts, checks dealer wallet sufficiency, OTP goes to the *customer's* number, then Confirm → Success/Failure.

**eWallet Recharge** (`/wallet-recharge`) — tops up the **dealer's own wallet** via Voucher (14-digit code, fixed demo denomination, "Data Voucher not supported" note) or Card. Card payment uses a "Select Payment Method" screen (Tap-Payments-style): Apple Pay, Google Pay, saved cards shown as real gradient card art (swipe left to reveal Delete), and "Add New Card" opening a dedicated full-page form (card number/holder/expiry/CVV + "Save card for later" checkbox).

### 4.3 SIM & Subscription Lifecycle

**SIM Termination** (`/sim-termination`) — deactivates a **single SIM/subscription line** (prepaid, Switch Postpaid, or Vnet). For postpaid/Vnet lines with an outstanding bill, shows Paid/Unpaid status and a breakdown (Current Balance + Outstanding Balance + Out of Bundle Usage = Total Outstanding), then offers **Pay Full Bill Amount / Pay Partial Bill Amount / Terminate Without Paying** (partial payment has its own amount field, min 10 SAR / max = total due). Requires customer identity + OTP verification and Terms acceptance.

**SIM Replacement** (`/sim-replacement`) — replace a customer's SIM (physical ↔ eSIM), fee-based unless it's their free replacement. eSIM success reuses the same `SuccessBottomSheet` as SIM Activation's eSIM success (real QR code + Share via Mobile/Email), for visual/functional consistency across the app.

**Subscription Migration** (`/subscription-migration`) — two design options from Home: the original auto-detecting flow (any number, direction inferred) plus two direction-locked entry points (Prepaid→Postpaid, Postpaid→Prepaid), Virgin-only.

**Change of Ownership** — `SearchCustomerForOwnership` (`/search-customer-ownership`) → `NewOwnerDetails` (`/new-owner-details`, captures incoming owner) → `ChangeOfOwnership` (`/change-of-ownership`, side-by-side current/new owner review, outstanding balance transfers to the new owner, document upload + signature + terms).

**Customer Termination** (`/customer-termination`, via `SearchCustomer` at `/search-customer`) — terminates the **entire customer account and every active service** (not just one SIM — distinct from SIM Termination above). Blocked ("Awaiting Payment") if the account has outstanding balances until they're cleared.

### 4.4 Customer Support

**Raise Customer Complaint** (`/customer-complaint`) — accepts any line type (10-digit prepaid/postpaid or 13-digit Vnet), auto-looks-up the MSISDN, enforces a daily 10-ticket-per-customer limit, then OTP verification → complaint form (contact number, optional email, Subject, Level 1/Level 2 category, description, up to 3 attachments) → Ticket ID on success.

**Tickets** (`/tickets`, `/tickets/new`, `/tickets/:id`) — general dealer support-ticket system (separate from customer complaints): stat tiles (Progress/Closed/Resolved), category → sub-category picker, priority, attachments, and an update/comment thread per ticket with a Close action.

### 4.5 Dealer E-Wallet (management view)

**E Wallet** (`/ewallet`) — a more fully-built wallet **management/reporting** area (distinct from the simple "eWallet Recharge" top-up flow): balance cards across several wallet types (e-topup, e-voucher, e-cash, rewards, credit-line), a Parent/Child role toggle with My-Wallets vs Team-Wallets views, member ranking (Top 5 / Lowest 5), activity/credit-debit charts, filterable transaction history, and a transaction-details sheet with Share/PDF/Excel export stubs. **Note:** this page prices everything in **KD (Kuwaiti Dinar)** rather than the SAR used everywhere else in the app — a known copy/localization inconsistency, not an intentional multi-currency feature.

### 4.6 Field Operations

**Visit Management** (`/visit-management`, `/visit-management/:id`) — list/search dealer visits by status (`pending/active/completed/missed/canceled`) and type (`planned`/`adhoc`).
- **Create Visit** (`/create-visit`) — builds a planned visit: visit type, user type (Modern Trade/Sales Promoter/Distributor/Retailer), assignee, steps of call, date range, optional recurrence (daily/weekly/monthly), and one or more Channel Members selected via a searchable, map-based picker.
- **Ad-Hoc Visit** (`/adhoc-visit`) — an unscheduled visit started by scanning a channel member's QR code, then a "Dealer Overview" (KPI cards: Gross Activations, Recharge Value; stock counts) and one or more attached Surveys (Merchandising / Stock / Customer Feedback).
- Executing a visit (`VisitDetails`) walks each assigned member through QR scan → Dealer Overview → Survey → Pass/Cancel result (with reason + document upload for cancellations).

**My Shifts** (`/my-shifts`) — read-only working-shift schedule/history (`scheduled/not-started/not-checked-in/completed`), with a map link to the assigned store. No check-in action lives on this page.

### 4.7 Account, Org & Settings

- **My Hierarchy** (`/profile/hierarchy`) — the dealer's org tree (Regional Manager → Team Leader/Account Manager → Sales Partner → Sales Promoter chains).
- **Profile** (`/profile`) — employee card, brand badge, QR code (`EMPLOYEE:{code}`), Logout.
- **Settings** (`/settings`) — Language, Theme, Home widget visibility/reordering, PIN/Face ID/biometrics security.
- **Menu** (`/menu`) — full feature grid (Stock Management, Channel Member Onboarding, KPI Dashboard, Other Widgets), some entries are placeholders with no route yet (Check-In, Sales KPIs, Performance at a Glance, Training Hub).
- **Notifications** (`/notifications`) — categorized (general/payment/orders/unpaid) notification center with filters, search, and bulk mark-read/delete. Currently static demo data.
- **Phase 2** (`/phase-2`) — generic "Coming Soon" placeholder destination for not-yet-built features.

### 4.8 Search entry points

Several pages exist purely as "look the customer/line up first" gateways feeding a specific downstream flow:

| Search page | Route | Feeds into |
|---|---|---|
| Search Customer | `/search-customer` | Customer Termination |
| Search Customer for Ownership | `/search-customer-ownership` | New Owner Details → Change of Ownership |
| Search Customer for Credit | `/search-customer-credit` | Credit Limit Adjustment |
| Search Subscription | `/search-subscription` | SIM Termination |
| Search Bundle Activation | `/search-bundle` | Bundle Plans |

**Bundle Plans** (`/bundle-plans`) — like E Wallet (§4.5), this page is priced in **KD**, again suggesting an un-localized Kuwait-market copy rather than an intentional feature of the Saudi app.

---

## 5. Known prototype quirks (worth knowing before demoing)

- **Orphaned pages** — `EWalletAnalytics.tsx`, `EWalletReports.tsx`, `EWalletTransactions.tsx`, `EWalletTransactionDetails.tsx`, and `Index.tsx` exist in `src/pages/` but are not routed in `App.tsx` and not linked from anywhere else — earlier, split-apart iterations that were consolidated into `EWallet.tsx`'s two-tab design (or, for `Index.tsx`, superseded by routing `Home` directly at `/`).
- **`UserRoleContext`** is defined but never wired into the app's provider tree — `EWallet.tsx`'s own Parent/Child toggle uses local state instead.
- **KD-priced pages** — `EWallet.tsx` and `BundlePlans.tsx` both show Kuwaiti Dinar pricing instead of the Saudi Riyal used everywhere else.
- **Menu vs Tickets** — `Menu.tsx`'s "Other Widgets" section lists Tickets as a placeholder even though `Tickets.tsx` is a fully routed, working page (`/tickets`) elsewhere in the app.
- **Dormant activation-flow variants** — four of five activation-flow implementations (`NewActivation`, `NewActivation4`, `NewActivation5`, `NewActivationV2`) are unreachable from any in-app navigation; only `NewActivation3` is live.

---

## 6. Full route table

| Route | Page |
|---|---|
| `/login` | Login |
| `/forgot-password` | Forgot Password |
| `/device-registration` | Device Registration |
| `/` | Home |
| `/menu` | Menu |
| `/coming-soon` | Coming Soon |
| `/visit-management`, `/visit-management/:id` | Visit Management / Details |
| `/create-visit` | Create Visit |
| `/adhoc-visit` | Ad-Hoc Visit |
| `/settings` | Settings |
| `/profile`, `/profile/hierarchy` | Profile / My Hierarchy |
| `/notifications` | Notifications |
| `/bill-payment` | Bill Payment |
| `/credit-transfer` | Credit Transfer |
| `/wallet-recharge` | eWallet Recharge |
| `/customer-complaint` | Raise Customer Complaint |
| `/search-subscription` | Search Subscription |
| `/search-customer` | Search Customer |
| `/search-customer-ownership` | Search Customer (Ownership) |
| `/search-customer-credit` | Search Customer (Credit) |
| `/sim-termination` | SIM Termination |
| `/customer-termination` | Customer Termination |
| `/new-owner-details` | New Owner Details |
| `/change-of-ownership` | Change of Ownership |
| `/credit-limit-adjustment` | Credit Limit Adjustment (`?option=1-5`) |
| `/sim-replacement` | SIM Replacement |
| `/search-bundle` | Search Bundle Activation |
| `/bundle-plans` | Bundle Plans |
| `/ewallet` | E Wallet |
| `/prepaid-search` | Prepaid Search Customer |
| `/prepaid-activation` | Prepaid Activation |
| `/prepaid-existing-customer` | Existing Customer Found |
| `/new-activation` | SIM Activation (v1, dormant) |
| `/new-activation-v2` | SIM Activation (V2, dormant) |
| `/new-activation-3`, `/new-activation-3/plans` | SIM Activation (live) / All Plans |
| `/new-activation-4`, `/new-activation-4/plans` | SIM Activation (v4, dormant) / All Plans |
| `/new-activation-5`, `/new-activation-5/plans` | SIM Activation (v5, dormant) / All Plans |
| `/subscription-migration` | Subscription Migration |
| `/phase-2` | Phase 2 (placeholder) |
| `/channel-onboarding` | Channel Onboarding |
| `/onboarding-requests` | Onboarding Requests |
| `/my-shifts` | My Shifts |
| `/tickets`, `/tickets/new`, `/tickets/:id` | Tickets / New / Details |

---

*Generated 2026-08-16 from the live codebase. Feature descriptions reflect current committed behavior — always re-verify against source before relying on this for anything beyond a general orientation, since this is a fast-moving prototype.*
