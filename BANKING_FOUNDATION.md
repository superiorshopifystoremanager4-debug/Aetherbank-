# AetherBank engineering foundation

AetherBank is being developed toward a secure, production-grade banking application.

## Current repository status

The current React client stores member records, account balances, and transaction history in browser local storage. Those values are not shared across devices and are not a bank ledger. The client-side balance-changing actions must not be used to move real money or represent settled banking transactions.

## Ledger foundation

`database/schema.sql` introduces a PostgreSQL schema for customers, bank accounts, immutable ledger entries, transaction state, audit events, and balances derived from posted ledger entries. Amounts are stored as integer minor units (for NGN, kobo), not floating-point numbers.

## Required implementation sequence

1. **Server API:** add a server-side application with schema validation, secure sessions, rate limiting, CSRF protections where applicable, and centralized authorization.
2. **Identity and onboarding:** verified email/phone, strong password hashing, MFA, identity/KYC workflow, sanctions/AML checks as required by the operating model, account status controls, and account recovery.
3. **Ledger posting:** implement atomic, idempotent double-entry posting; account locking; overdraft/available-balance rules; reversals rather than editing posted entries; and invariant tests.
4. **Funding and payments:** integrate a licensed banking/payment partner only after credentials and contracts are provisioned. Verify signed webhooks, use provider references and idempotency, handle pending/failed states, and reconcile provider statements.
5. **Operational security:** secret management, least-privilege database roles, encryption in transit and at rest, audit monitoring, backups/restore drills, incident response, fraud controls, and independent penetration testing.
6. **Release gates:** automated tests, dependency/security scanning, migrations, staging verification, monitoring, and documented rollback.

## Non-negotiable financial invariants

- The browser never determines or persists authoritative balances.
- A posted transaction has balanced entries in a single currency.
- A request retry cannot debit or credit an account twice.
- Posted ledger entries are not edited or deleted; corrections use linked reversals.
- External payment status is confirmed by the provider and reconciled before it is presented as settled.
- Secrets, API keys, customer data, and real credentials must never be committed to Git.

## Local database setup

Apply the migration to a dedicated PostgreSQL database using a migration runner or a controlled SQL session. Do not point this schema at a production database before review. The schema alone is not a complete banking service: application-layer posting logic, access controls, provider integration, testing, and operational controls are still required.
