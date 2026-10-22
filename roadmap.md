ls roadmap.md >/dev/null && tail -4 roadmap.md

## Booked activation options (Oct 20)
- [x] Booked tab: 4 activation options (Only Plan / Plan with Top Up / Only Top Up / No Plan or Top-Up). Plan section and Top-up card always visible; the option drives validation and checkout only.
- [x] Booked tab: option picker removed — the active option now comes from `BOOKED_ACTIVATION_CONFIG[brand].mode`.
- [x] Booked tab: sections the option leaves out stay visible but are locked — greyed-out cards plus an info note above them; the top-up card already had its own note.
- [x] Booked tab: Top-up card header switch collapses/expands the card; the chosen amount stays visible in the header row while collapsed.

## KPI breakdown card UI (Oct 21)
- [x] KPI breakdown cards: rebuilt to the uploaded reference — compact one-line card, name + Killer pill with the eligibility pill opposite, bar filled to the achievement with a tick at the minimum (teal when met, red when missed), "Achieved · Min" and "Weight · +Score" underneath; a missed score shows as plain 0.0% in grey. No expand/collapse.
- [x] Group summary card: overall achievement now drawn as a donut (primary fill) with the weighted score inside it; the six KPI rows keep their progress bars.

## E-Wallet member-only scope (Oct 22)
- [x] E-Wallet now shows only the signed-in dealer's own wallet and transactions — the Parent/Child role toggle, My/Team Wallets switch, member filter, member chips and Member Wallet Ranking were all removed.
- [x] E-Wallet wallet balance cards row removed; the active wallet is now chosen in the filter drawer's Wallet section (Transactions and Analytics), default E-Topup.
- [x] E-Wallet filter chips: unselected options now show a single "+" (the extra literal plus was removed where it doubled the styled one).
