-- ============================================
-- PayBack Module — Database Schema
-- Autonomous Chargeback Defense & Evidence Ledger
-- ============================================

CREATE TYPE payback_dispute_status AS ENUM (
    'OPENED',
    'ANALYZING_EVIDENCE',
    'EVIDENCE_SUBMITTED',
    'UNDER_REVIEW',
    'RESOLVED_MERCHANT_WIN',
    'RESOLVED_BUYER_WIN',
    'AUTO_REFUNDED'
);

CREATE TABLE IF NOT EXISTS payback_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paypal_dispute_id VARCHAR(100) UNIQUE NOT NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    dispute_amount DECIMAL(15, 2) NOT NULL,
    dispute_currency VARCHAR(10) DEFAULT 'USD',
    reason VARCHAR(100) NOT NULL,
    status payback_dispute_status DEFAULT 'OPENED',
    confidence_score DECIMAL(5, 2) DEFAULT 0.00,
    evidence_packet JSONB NOT NULL DEFAULT '{}',
    ai_defense_summary TEXT,
    paypal_response_raw JSONB DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payback_disputes_paypal_id ON payback_disputes(paypal_dispute_id);
CREATE INDEX IF NOT EXISTS idx_payback_disputes_user_id ON payback_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_payback_disputes_status ON payback_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payback_disputes_created_at ON payback_disputes(created_at DESC);

CREATE TRIGGER update_payback_disputes_updated_at
    BEFORE UPDATE ON payback_disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
