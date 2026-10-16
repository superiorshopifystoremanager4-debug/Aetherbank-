# AetherBank engineering foundation

AetherBank is a U.S. personal banking product built toward a secure, production-grade digital banking application.

## Current repository status

The React client provides the full customer interface. Account balances and transaction history currently use local storage for the workspace experience. The authoritative ledger lives in the PostgreSQL schema. All money movement must ultimately post through the server-side ledger.

## Ledger foundation

`database/schema.sql` defines the PostgreSQL schema for customers, bank accounts (with routing numbers), immutable ledger entries, transaction state, audit events, and balances derived from posted ledger entries. Amounts are stored as integer minor units (cents for USD).

## Required implementation sequence

1. **Server API:** server-side application with schema validation, secure sessions, rate limiting, CSRF protections where applicable, and centralized authorization.
2. **Identity and onboarding:** verified email/phone, strong password hashing, MFA, Customer Identification Program (CIP) workflow collecting name, date of birth, address and SSN/ITIN, sanctions/AML checks, account status controls, and account recovery.
3. **Ledger posting:** atomic, idempotent double-entry posting; account locking; available-balance rules; reversals rather than editing posted entries; invariant tests.
4. **Funding and payments:** integrate licensed U.S. banking/payment partners for ACH, Zelle-style transfers, direct deposit, and card issuing after credentials and contracts are in place. Verify signed webhooks, use provider references and idempotency, handle pending/failed states, and reconcile statements.
5. **Operational security:** secret management, least-privilege database roles, encryption in transit and at rest, audit monitoring, backups/restore drills, incident response, fraud controls, and independent penetration testing.
6. **Release gates:** automated tests, dependency/security scanning, migrations, staging verification, monitoring, and documented rollback. Clear FDIC signage on digital channels.

## Non-negotiable financial invariants

- The browser never determines or persists authoritative balances.
- A posted transaction has balanced entries in a single currency.
- A request retry cannot debit or credit an account twice.
- Posted ledger entries are not edited or deleted; corrections use linked reversals.
- External payment status is confirmed by the provider and reconciled before it is presented as settled.
- Secrets, API keys, customer data, and credentials must never be committed to Git.

## Local database setup

Apply the migration to a dedicated PostgreSQL database using a migration runner or a controlled SQL session. The schema alone is not a complete banking service: application-layer posting logic, access controls, provider integration, testing, and operational controls are still required.
