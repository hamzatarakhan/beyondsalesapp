ls roadmap.md >/dev/null && tail -4 roadmap.md

## Booked activation options (Oct 20)
- [x] Booked tab: 4 activation options (Only Plan / Plan with Top Up / Only Top Up / No Plan or Top-Up). Plan section and Top-up card always visible; the option drives validation and checkout only.
- [x] Booked tab: option picker removed — the active option now comes from `BOOKED_ACTIVATION_CONFIG[brand].mode`.
- [x] Booked tab: sections the option leaves out stay visible but are locked — greyed-out cards plus an info note above them; the top-up card already had its own note.
- [x] Booked tab: Top-up card header switch collapses/expands the card; the chosen amount stays visible in the header row while collapsed.
