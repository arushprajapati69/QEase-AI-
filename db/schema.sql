-- WaitWise AI PostgreSQL Production Schema Definition
-- Multi-Tenant Virtual Queue & Customer Journey System

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tenants (Businesses)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users (Staff & Admin)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'TELLER', -- ADMIN, TELLER, KIOSK
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Service Types
CREATE TABLE IF NOT EXISTS service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    avg_duration_min INT NOT NULL DEFAULT 5,
    required_docs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Service Counters
CREATE TABLE IF NOT EXISTS counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    counter_number VARCHAR(10) NOT NULL,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Queue Tokens
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES service_types(id),
    token_number VARCHAR(20) NOT NULL, -- e.g., TOKEN-47
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING', -- WAITING, SERVING, COMPLETED, NO_SHOW, CANCELLED, HOLD
    counter_id UUID REFERENCES counters(id),
    customer_name VARCHAR(100),
    position_in_queue INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    served_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 7. AI Prediction Logs
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    predicted_wait_min_lower INT NOT NULL,
    predicted_wait_min_upper INT NOT NULL,
    predicted_turn_start TIMESTAMP WITH TIME ZONE NOT NULL,
    predicted_turn_end TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence_score NUMERIC(3,2) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_tokens_tenant_status ON tokens(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_position ON tokens(tenant_id, position_in_queue);
CREATE INDEX IF NOT EXISTS idx_counters_tenant ON counters(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- Enable Row Level Security (RLS) on core multi-tenant tables
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policy for Tokens (Staff Access)
DROP POLICY IF EXISTS staff_tenant_isolation_policy ON tokens;
CREATE POLICY staff_tenant_isolation_policy ON tokens
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- Public Read-Only Policy for Token Public Verification
DROP POLICY IF EXISTS public_token_read_policy ON tokens;
CREATE POLICY public_token_read_policy ON tokens
    FOR SELECT
    USING (true); -- Public customers can query token details by token ID
