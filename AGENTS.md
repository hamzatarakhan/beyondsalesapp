# Project rules
- Keep booked-number eligibility and code validation in a shared schema module used by activation gating; this keeps input and journey checks consistent.
- Keep UAT automatic number reservation in a session-scoped shared service, separate from operator integrations; this prevents duplicate sample assignments without treating demo login as trusted authentication.
- UAT reservation cancellation access is fixed by service fixtures, never by the selected brand; real cancellation must use server-validated brand permissions before any operator integration.
- Distinguish explicit picker selections from automatic reservation requests in the shared UAT service; validate replacements atomically so unavailable choices never discard a reservation or silently change the selected number.