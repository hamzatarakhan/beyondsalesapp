# Project rules
- Keep booked-number eligibility and code validation in a shared schema module used by activation gating; this keeps input and journey checks consistent.
- Keep UAT automatic number reservation in a session-scoped shared service, separate from operator integrations; this prevents duplicate sample assignments without treating demo login as trusted authentication.