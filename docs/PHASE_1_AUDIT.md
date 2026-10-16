# AetherBank Phase 1 audit

Audit date: 2026-10-16. Working branch: work/premium-ui-preserve-functionality. Production branch: main.

## Verified
- The app is React + Vite. package.json currently has dev, build, and preview scripts, but no server framework, test runner, database client, or authentication SDK.
- src/main.jsx mounts src/BankingWorkspace.jsx. Preserve this premium workspace, its styling, and its current navigation; do not replace it with the older dashboard.
- Screens exist for overview, accounts, transfers, withdrawals, add money, transactions, beneficiaries, cards, statements, profile, security, preferences, and support. Their presence is not proof of operational backend services.
- Existing product docs say browser localStorage has been used for member/account/transaction state. database/schema.sql is a PostgreSQL schema foundation, not proof of a live database or migration.
- No live banking/payment provider, server-side transaction service, or authentication/session provider has been verified.
- Registration stays disabled until explicitly approved.

## Safety rules
1. Do not change main, merge, or promote a deployment without explicit approval.
2. Keep the current premium UI and all existing screens.
3. No fake balances, accounts, cards, transactions, recipients, or success confirmations.
4. Do not connect live funds or production databases during this phase.
5. Inspect existing deployment configuration before adding another backend, auth, or database service.
6. Label previews clearly as sandbox/no real funds.

## Phased plan
1. Baseline and feature inventory.
2. Verify current Vercel project configuration and decide the least disruptive server/API approach for the existing Vite app.
3. Provision a non-production database only after confirming available configuration; add migrations and server-side integer-minor-unit ledger logic.
4. Implement internal sandbox transfers with atomic, idempotent double-entry postings and tests.
5. Keep deposits and withdrawals unavailable until a real approved provider, signed webhooks, reconciliation, and step-up verification exist.
6. Build cards and analytics only from real records.
7. Add authorization, audit logging, admin restrictions, and security tests.
8. Keep registration disabled server-side until approved.
9. Run checks, review the preview together, and request explicit approval before any production release.

## Phase 1 acceptance
The premium workspace remains in place; no production or real-money changes are made; preview status says “Sandbox preview · no real funds”; backend/database decisions are based on verified project configuration.
