# AetherBank — Product Blueprint and Banking Journey Specification

## Purpose

AetherBank is intended to become a production-grade digital banking product, not a balance simulator. This document defines the customer journeys, screens, state transitions, controls, and delivery gates required before any feature is represented as operational banking.

**Current truth:** the existing React app stores customer/account/transaction state in browser localStorage and can create pretend balance changes. Those operations are not bank transactions. Do not describe the current app as connected to a bank or capable of moving real funds.

**Product rule:** no UI button may claim that money was sent, withdrawn, deposited, or paid unless a trusted server-side transaction service and the relevant licensed/provider rails confirm the outcome. Until integrated, label flows as sandbox/test activity and never imply real-money capability.

## 1. Product assumptions to settle before live launch

- Initial market: Nigeria is a working assumption, not a final legal decision. Confirm operating country, legal entity, licence/partner-bank model, customer eligibility, currencies, and supported rails before production.
- Decide whether AetherBank is a licensed bank, a bank-sponsored fintech, or a wallet/payment product operated with a regulated partner. The legal model changes what accounts, deposits, interest, cards, cash withdrawals, and transfers can be offered.
- Do not use random client-generated numbers as real account numbers. Production account identifiers must be allocated/validated by the authorised banking or payment partner.
- Do not collect BVN/NIN, identity documents, card details, or sensitive financial information until a vetted provider, data-protection plan, retention policy, access controls, and secure backend are in place.
- Real-money release requires legal/compliance review, provider approval and credentials, operational support, monitoring, reconciliation, incident response, and independent security testing.

## 2. Customer-facing information architecture

### Public and pre-login
1. Welcome / product overview — explain actual supported services and fees without fabricated claims.
2. Sign in.
3. Create account — email/phone, password or approved passkey flow, terms/privacy consent, age/eligibility gates.
4. Verify email and phone using expiring, rate-limited one-time codes.
5. Identity verification — provider-hosted or secure verified workflow; explain why each data item is requested; show pending, approved, action-required, rejected, and retry states.
6. Application progress — saved progress, missing requirements, support link, clear next step.
7. Forgot password / recover access — safe responses that do not reveal whether an account exists.
8. Accessibility, privacy notice, terms, fee schedule, complaints procedure, product eligibility and service status.

### Authenticated app navigation
- Overview
- Accounts
- Transfer
- Withdraw / cash access (only when a real supported route exists)
- Add money / deposit
- Bills and payments
- Cards (only if card programme exists)
- Statements and transaction history
- Scheduled / recurring payments
- Beneficiaries / saved recipients
- Notifications and secure inbox
- Profile and personal information
- Security centre
- Limits and payment controls
- Documents, statements and tax/fee records where applicable
- Help, complaints, disputes and case tracking
- Legal, privacy, fees and account closure

### Profile and settings
- Personal details: legal name, preferred name, date of birth, verified contact details, address and verification status.
- Contact management: add/change email or phone with re-verification and notification to the old contact.
- Security: change password/passkey, MFA, trusted devices, active sessions, sign out other sessions, login alerts, recovery methods, security events.
- Privacy and consent: marketing preferences separately from mandatory service/security notices; data access/correction/deletion request process subject to legal retention duties.
- Preferences: language, time zone, date format, accessibility, light/dark mode, notification channels and transaction alert thresholds.
- Banking controls: instant-transfer enable/disable where required/available, customer-set transfer limits, card freeze/unfreeze if supported, online/international/cash controls if supported.
- Documents: account details, statements, fee schedule, agreements, identity status.
- Support: ticket history, complaints, disputes, fraud report, callback/contact methods.
- Account management: close-account request, export data, beneficiary management, linked devices.
- Every sensitive profile change requires server-side authorization, re-authentication and risk-based step-up verification.

## 3. Sign-up and account opening — required journey

1. Customer selects Create account and sees eligibility, product/currency and fee information.
2. Collect minimum necessary registration details with clear consent and field-level validation.
3. Verify contact channels; codes expire, have attempt limits, and can be resent only under throttling.
4. Establish secure authentication; never store plaintext passwords. Use a vetted identity/auth provider or established framework, secure server-side sessions, HTTPS, CSRF protection where relevant, rate limiting and abuse monitoring.
5. Start identity/KYC verification through the approved provider; capture provider reference and status, not unnecessary raw identity data.
6. Run applicable sanctions/PEP/AML and risk checks under the approved compliance policy.
7. Resolve exceptions: pending review, missing information, mismatched details, retry, rejection and escalation.
8. Only after eligibility and required checks pass, request account creation from the authorised provider/ledger service.
9. Store the provider-issued account identifier, currency, product, status, limits and disclosures returned by the server.
10. Show account-opening confirmation and explain what is enabled versus still pending.
11. Send a security notification and record auditable events.
12. Never let the browser choose the authoritative customer ID, account number, KYC status, balance or permissions.

## 4. Sign-in, recovery and session lifecycle

- Sign in using approved identifier and credential/passkey.
- Generic failure messaging, throttling, credential-stuffing protection, breached-password controls where appropriate, and monitoring for suspicious patterns.
- MFA/step-up verification for sensitive actions and risk events; do not rely on a static PIN alone for high-risk changes.
- Secure, unpredictable server-managed sessions; rotate session identifiers after authentication/privilege changes; secure, HttpOnly, SameSite cookies; short-lived access and appropriate idle/absolute timeouts.
- Show new-device sign-in alerts and a session/device management screen.
- Lost phone, SIM swap, compromised email, forgotten password and suspected account takeover each need separate recovery/risk procedures.
- Changing password, phone, email, MFA, beneficiary details or transaction limits requires current-session verification and risk-based reauthentication.
- Provide “log out” and “log out all other devices”; invalidate server sessions after password reset or compromise.
- Record security events without logging passwords, OTPs, session tokens or full payment credentials.

## 5. Transfer journey — not a single amount field

1. Choose source account and display currency plus available balance.
2. Choose recipient type supported by the product: own account, AetherBank account, domestic bank account, or international recipient only if enabled.
3. Select saved beneficiary or enter recipient details.
4. Resolve recipient through the approved directory/provider where available; show verified recipient name and institution. Never trust a client-supplied display name.
5. Enter amount, currency, reference and optional purpose. Validate precision, minimum/maximum, account status and available balance server-side.
6. Show a review screen: recipient, masked account identifier, source, amount, fee, FX rate and markup (if any), total debit, delivery estimate, limits and cancellation rules.
7. Run risk/fraud checks and required step-up verification. Check transfer enablement, device risk, velocity, customer limits, beneficiary cooling-off rules and applicable compliance screening.
8. Submit an idempotent transaction request to the backend. A double tap/retry must not create a duplicate payment.
9. Display a pending/processing state while awaiting provider outcome. A timeout is not proof of failure; query by transaction reference before retrying.
10. Show completed, pending, failed, returned or reversed status accurately. Provide receipt/reference and “report a problem”.
11. Update the ledger only according to defined transaction/provider state rules; reconcile provider settlement and handle asynchronous webhooks idempotently.
12. Notify customer and create immutable audit events. Never silently rewrite or delete a posted transaction; use a compensating reversal.

## 6. Withdrawal / cash-out journey — required screens and state machine

A withdrawal is not “type amount and click withdraw.” First determine which real route is supported: ATM/card cash withdrawal, agent cash-out, bank transfer to an external account, or withdrawal to a verified funding source. These are different products and must not be mixed into one pretend flow.

1. **Choose withdrawal method:** show only methods enabled for this customer, country, currency, account type and KYC tier.
2. **Eligibility check:** verify account is active, not restricted/frozen, KYC is sufficient, method is available, and required rails/provider are healthy.
3. **Choose source account:** show currency, available balance, pending holds, and amount available to withdraw.
4. **Enter destination or access method:** e.g. verified bank destination/beneficiary, approved agent, or supported card/ATM route. Do not ask for another bank's PIN or online-banking password.
5. **Verify destination:** resolve and display recipient name or agent identity where supported; mask sensitive identifiers and allow correction before proceeding.
6. **Enter amount:** show min/max, remaining daily/monthly limits, cash availability/agent limits if relevant, and whether amount precision is valid.
7. **Calculate costs:** show fee, taxes where applicable, FX rate/markup for cross-currency, total debit, net amount received and expected arrival time before confirmation.
8. **Risk and compliance checks:** server-side balance/holds/limits, account and beneficiary status, transaction velocity, device/session risk, sanctions/fraud checks where applicable, and any cooling-off period for new destinations.
9. **Confirm details:** explicit review of source, destination, amount, currency, fee, net amount and terms. Make cancellation timing clear.
10. **Step-up authentication:** request appropriate MFA/transaction approval for the risk level; no secrets or OTPs in logs.
11. **Submit once:** create an idempotency key and durable transaction intent; reserve/hold funds atomically if the method requires it.
12. **Processing screen:** provide reference number and explain that the transaction is pending; prevent duplicate submissions and do not promise immediate completion.
13. **Provider result:** handle accepted, processing, completed, rejected, expired, timed out, returned and reversed states. A timeout must be reconciled by reference before any retry.
14. **Receipt:** show timestamp, reference, amount, fee, net proceeds, destination/method, status and support action.
15. **Post-transaction:** notify customer, update statements only from authoritative records, release holds on failure, reverse using compensating ledger entries when appropriate, and reconcile external settlement.
16. **Exception handling:** if cash/transfer did not arrive but the account was debited, offer a trace/dispute flow, display the case ID and keep the customer informed.
17. **Audit and operations:** retain an immutable event trail, provider messages, status transitions and reconciliation evidence under the approved retention policy.

## 7. Transaction history, receipts and statements

- Filters by date range, status, amount, type, account and reference; search must work on server-paginated records.
- Each detail view shows a stable transaction ID/reference, status, timestamps, source/destination (masked), amount/currency, fee, exchange rate if applicable, and support/dispute actions.
- Distinguish pending authorisations, posted transactions, reversals, refunds, fees and settlements.
- Downloadable statements/receipts must be generated server-side from authoritative data and must not fabricate balances.
- Never hard-delete financial ledger entries; correct mistakes with linked reversing/adjusting entries and audit reasons.

## 8. Ledger and transaction engine requirements

- PostgreSQL-backed server-side system; the browser is never the source of truth for money.
- Integer minor units or exact decimal types with explicit currency exponent; never binary floating point for money.
- Double-entry ledger: every posted transaction balances to zero across entries for each currency; enforce invariants at service/database boundaries.
- Atomic database transactions, appropriate isolation/locking, idempotency keys, unique provider references and safe retry handling.
- Explicit state machine: created, awaiting_auth, pending, posted, failed, reversed/returned; transitions are validated and audited.
- Separate available balance, ledger/book balance, pending holds and limits. Do not derive available balance by blindly adding/subtracting UI state.
- Immutable posted entries, compensating entries, daily/provider reconciliation, suspense handling and operational exception queues.
- Outbox/event pattern for reliable notifications and downstream work; signed/authenticated webhooks with replay protection and idempotent processing.
- Per-currency accounting, fees, FX quote expiry, rounding rules and reconciliation.
- Admin/operator access must use least privilege, separation of duties, MFA, approval thresholds and audited support actions. No silent balance-edit button.

## 9. Security, compliance, fraud and customer protection

- Threat model and data-flow diagram before implementation.
- Secrets only in managed server-side environment variables/secret storage; never commit keys to GitHub or expose provider secret keys to Vite/client code.
- Least privilege, secure defaults, input validation, output encoding, dependency scanning, secure headers, TLS, backups and tested restoration.
- Sensitive data minimisation, encryption in transit/at rest, access logs, retention/deletion rules, breach response and privacy review.
- Rate limits and abuse detection for login, OTP, recovery, beneficiary creation, transfers, cash-out and support forms.
- AML/KYC/sanctions controls and recordkeeping must be designed with qualified compliance counsel and the actual regulated partner.
- Card data only through a compliant card provider/tokenized hosted flow; define PCI DSS scope before any card functionality.
- Complaints, fraud reporting, disputes, failed/duplicate payments, fee disclosure, service outage notices and accessibility are core features, not optional polish.
- Admin actions and customer support impersonation (if permitted at all) require strict access control, reason capture and audit; never reveal credentials or OTPs to support staff.

## 10. Internal operations console (separate from customer UI)

- Role-based queues for onboarding/KYC exceptions, flagged transactions, failed webhooks, reconciliation mismatches, complaints, disputes and provider outages.
- Customer/account view with strictly masked data and least-privilege access.
- Transaction trace by internal ID/provider reference; no direct edit of posted ledger rows.
- Maker-checker approval for sensitive adjustments/refunds and manual release decisions.
- Audit viewer, security events, limits configuration, provider health, reconciliation reports and incident controls.
- Every action records operator identity, reason, timestamp, before/after state and approval chain.

## 11. Screens to design and implement

1. Welcome and product disclosures.
2. Sign-up form and progress.
3. Email/phone verification.
4. KYC status and exceptions.
5. Login, MFA, recovery, new-device alert.
6. Authenticated overview with account balances and pending activity.
7. Account details and account controls.
8. Transfer wizard (recipient → amount → review → authorize → status → receipt).
9. Withdrawal/cash-out wizard (method → destination → amount → fee/limits → review → authorize → status → receipt).
10. Add-money/funding wizard based on real provider methods.
11. Beneficiary list, add/edit and cooling-off state.
12. Transaction history, filters and transaction details.
13. Statements and downloadable receipts.
14. Cards, only after real card programme integration.
15. Bills and recurring payments, only for enabled providers.
16. Profile, contact changes and identity details.
17. Security centre, devices, sessions and MFA.
18. Preferences and notification controls.
19. Limits and instant-payment controls where applicable.
20. Help centre, complaints, disputes, fraud report and case tracking.
21. Legal documents, fee schedule, privacy controls and account closure.
22. Internal operations console with role-based permissions.

Every screen needs loading, empty, validation, disabled, pending, success, failure, timeout, retry, and accessibility states—not only the happy path.

## 12. Nigeria-specific research checkpoints (if Nigeria is confirmed)

- Review current Central Bank of Nigeria licensing and payment-system rules for the exact business model.
- Review applicable CBN instant-payment rules, customer controls, transfer limits, device binding and fraud-monitoring requirements with the authorised partner; requirements and effective dates must be confirmed against official current circulars before launch.
- Confirm KYC/BVN/NIN handling, AML/CFT obligations, consumer-protection, complaints and data-protection obligations with qualified counsel and the regulated provider.
- Confirm NUBAN/account issuance, NIP/interbank transfer access, settlement, reversals, dispute timelines and reporting obligations with the partner/rail operator.
- Do not infer that using a payment API alone makes AetherBank a licensed bank.

## 13. Phased delivery and acceptance gates

### Phase A — Product and regulatory definition
- Confirm market, legal operating model, product scope, provider shortlist and money flows.
- Deliver product requirements, data map, threat model, risk register, fee model and state diagrams.
- Gate: no ambiguous claims about licensing, deposits, interest or real-money capability.

### Phase B — Real interface and design system
- Replace the one-screen mobile-demo feel with a coherent responsive banking app and full navigation.
- Build onboarding/login screens, customer dashboard, profile/settings/security centre, transaction list/detail, and multi-step transfer/withdrawal flows.
- Include all loading/error/pending/empty states and accessible forms.
- Until backend exists, use unmistakable sandbox mode with simulated data isolated from production branding and no claim that funds moved.

### Phase C — Backend identity and persistence
- API, database migrations, secure auth/session lifecycle, customer/account model, authorization checks, audit events, notifications and automated tests.
- Gate: browser storage is no longer authoritative for identity, accounts or balances.

### Phase D — Ledger and transaction orchestration
- Double-entry posting, idempotency, holds, reversals, transaction state machine, reconciliation, provider webhooks and failure recovery.
- Gate: invariants and concurrency tests pass; retries/timeouts cannot duplicate or lose value.

### Phase E — Provider integrations
- Integrate approved account issuance, transfers, funding/cash-out, notifications and KYC providers using sandbox first and server-side secrets.
- Gate: provider certification, reconciliation, error mapping, webhook security and operational playbooks complete.

### Phase F — Security/compliance/operations
- Penetration test, dependency/security scans, access reviews, backup restore test, fraud controls, complaint/dispute operations, incident drills and legal approval.
- Gate: documented sign-off from responsible security, compliance and provider teams.

### Phase G — Controlled launch
- Feature flags, capped pilot, monitoring/alerts, customer support coverage, reconciliation sign-off, rollback plan and post-launch review.
- Gate: no live money movement until all legal, provider, security and operational launch requirements are satisfied.

## 14. Definition of done for every financial action

A feature is not done because the button works. It is done only when:
- The user journey and all failure states are designed.
- Server-side authorization, balance, status, limit and risk checks exist.
- Requests are idempotent and safely retryable.
- Ledger postings balance and are atomic.
- Provider state and ledger state reconcile.
- Audit records and customer notifications are reliable.
- Automated tests cover success, decline, duplicate submission, concurrent requests, provider timeout, webhook replay, reversal and reconciliation mismatch.
- Monitoring, support instructions, customer messaging and incident handling exist.
- Regulatory/provider approvals applicable to the feature are satisfied.
