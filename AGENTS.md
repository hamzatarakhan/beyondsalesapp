# Project rules
- Keep booked-number eligibility and code validation in a shared schema module used by activation gating; this keeps input and journey checks consistent.
- Keep booked activation combinations and minimum amounts in independent brand configuration with shared validation for subscription and checkout; this prevents UI choices from bypassing configured restrictions.
- Keep UAT automatic number reservation in a session-scoped shared service, separate from operator integrations; this prevents duplicate sample assignments without treating demo login as trusted authentication.
- UAT reservation cancellation access is fixed by service fixtures, never by the selected brand; real cancellation must use server-validated brand permissions before any operator integration.
- Distinguish explicit picker selections from automatic reservation requests in the shared UAT service; validate replacements atomically so unavailable choices never discard a reservation or silently change the selected number.
- Keep Stock Return input validation in a pure helper and reuse existing field feedback and toast controls; this makes corrective errors testable without adding a new error interaction.