# Project rules
- Keep booked-number eligibility and code validation in a shared schema module used by activation gating; this keeps input and journey checks consistent.
- Keep UAT automatic number reservation in a session-scoped shared service, separate from operator integrations; this prevents duplicate sample assignments without treating demo login as trusted authentication.
- UAT reservation cancellation access is fixed by service fixtures, never by the selected brand; real cancellation must use server-validated brand permissions before any operator integration.
- KIT scanning in SIM Activation uses a cancellable UAT simulation and the existing KIT validation handler; this keeps cancellation and manual scan entry consistent without implying hardware scanning.