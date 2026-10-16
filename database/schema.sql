-- AetherBank PostgreSQL foundation
-- All monetary values are integer minor units (cents), never floating point.
-- This schema is the ledger foundation for the U.S. personal banking product.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_verification'
    CHECK (status IN ('pending_verification', 'active', 'restricted', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  account_number CHAR(10) NOT NULL UNIQUE,
  routing_number CHAR(9),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  account_type TEXT NOT NULL DEFAULT 'checking'
    CHECK (account_type IN ('checking', 'savings')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'frozen', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, account_type, currency)
);

CREATE TABLE IF NOT EXISTS ledger_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'fee', 'reversal', 'adjustment')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'posted', 'failed', 'reversed')),
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  description TEXT NOT NULL,
  reference TEXT UNIQUE,
  created_by UUID REFERENCES customers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_at TIMESTAMPTZ
);

-- Signed entries must sum to zero per posted transaction and currency.
-- Positive = credit to a ledger account; negative = debit from it.
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES ledger_transactions(id),
  account_id UUID NOT NULL REFERENCES bank_accounts(id),
  amount_minor BIGINT NOT NULL CHECK (amount_minor <> 0),
  currency CHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_customer ON bank_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account_created ON ledger_entries(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_status_created ON ledger_transactions(status, created_at DESC);

-- Audit records are append-only by design; restrict application DB roles from UPDATE/DELETE.
CREATE TABLE IF NOT EXISTS audit_events (
  id BIGSERIAL PRIMARY KEY,
  actor_customer_id UUID REFERENCES customers(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Balance is derived from the ledger; never trust a client-provided balance.
CREATE OR REPLACE VIEW account_balances AS
SELECT a.id AS account_id,
       a.customer_id,
       a.account_number,
       a.routing_number,
       a.currency,
       a.account_type,
       a.status,
       COALESCE(SUM(e.amount_minor) FILTER (WHERE t.status = 'posted'), 0)::BIGINT AS balance_minor
FROM bank_accounts a
LEFT JOIN ledger_entries e ON e.account_id = a.id AND e.currency = a.currency
LEFT JOIN ledger_transactions t ON t.id = e.transaction_id
GROUP BY a.id, a.customer_id, a.account_number, a.routing_number, a.currency, a.account_type, a.status;

-- Posting requirements for the service layer:
-- 1. Use a single SERIALIZABLE database transaction and lock affected accounts.
-- 2. Enforce idempotency before any debit/credit.
-- 3. Require >= 2 entries and SUM(amount_minor) = 0 per transaction/currency.
-- 4. Check available balance and account status on the server, never in the browser.
-- 5. Only mark a transaction posted after all invariants pass; write audit event atomically.
-- 6. Do not treat an external payment as settled until provider confirmation and reconciliation.
