-- QuarkfinAI Platform - Production Multi-Tenant SaaS Schema
-- For Monday Production Launch

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. USER MANAGEMENT & AUTHENTICATION (Multi-Tenant with Phone Verification)
-- =====================================================================

-- Enhanced User Profiles (Phone-Email Binding for Abuse Prevention)
CREATE TABLE IF NOT EXISTS user_profiles (
    id                    UUID REFERENCES auth.users(id) PRIMARY KEY,
    email                 VARCHAR(255) NOT NULL UNIQUE,
    phone                 VARCHAR(20) NOT NULL UNIQUE, -- UNIQUE constraint prevents abuse
    full_name             VARCHAR(255) NOT NULL,
    company_name          VARCHAR(255),
    company_size          VARCHAR(50), -- startup, small, medium, enterprise
    industry              VARCHAR(100),
    country               VARCHAR(10),
    timezone              VARCHAR(50),
    avatar_url            TEXT,
    phone_verified        BOOLEAN DEFAULT FALSE,
    email_verified        BOOLEAN DEFAULT FALSE,
    onboarding_completed  BOOLEAN DEFAULT FALSE, -- TRUE only when phone is verified
    signup_method         VARCHAR(20) DEFAULT 'email', -- email, google, phone
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW(),
    last_login_at         TIMESTAMPTZ,
    status                VARCHAR(20) DEFAULT 'active' -- active, suspended, deleted
);

-- Phone verification tracking
CREATE TABLE IF NOT EXISTS phone_verifications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES user_profiles(id),
    phone             VARCHAR(20) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    attempts          INTEGER DEFAULT 0,
    verified_at       TIMESTAMPTZ,
    expires_at        TIMESTAMPTZ NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions and activity tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES user_profiles(id),
    session_token     VARCHAR(255),
    ip_address        INET,
    user_agent        TEXT,
    device_type       VARCHAR(50), -- desktop, mobile, tablet
    browser           VARCHAR(50), -- Chrome, Firefox, Safari
    os                VARCHAR(50), -- Windows, macOS, Linux
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    expires_at        TIMESTAMPTZ,
    is_active         BOOLEAN DEFAULT TRUE,
    last_activity_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 2. SUBSCRIPTION & PLAN MANAGEMENT (4 Fixed Tiers)
-- =====================================================================

-- Available subscription plans (FIXED 4 tiers)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id                    SERIAL PRIMARY KEY,
    plan_name             VARCHAR(20) NOT NULL CHECK (plan_name IN ('Free', 'Startup', 'Pro', 'Enterprise')),
    plan_type             VARCHAR(20) NOT NULL, -- free, paid
    monthly_credits       INTEGER NOT NULL,
    yearly_credits        INTEGER, -- for annual plans
    monthly_price         DECIMAL(10,2) NOT NULL,
    yearly_price          DECIMAL(10,2),
    overage_price_per_credit DECIMAL(6,4) NOT NULL,
    features              JSONB,
    is_active             BOOLEAN DEFAULT TRUE,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Insert fixed plans (only if not exists)
INSERT INTO subscription_plans (plan_name, plan_type, monthly_credits, yearly_credits, monthly_price, yearly_price, overage_price_per_credit, features) 
VALUES 
('Free', 'free', 500, NULL, 0.00, NULL, 0.020, '["basic_reports"]'),
('Startup', 'paid', 5000, 60000, 49.00, 539.00, 0.009, '["basic_reports", "api_access"]'),
('Pro', 'paid', 15000, 180000, 149.00, 1639.00, 0.007, '["basic_reports", "api_access", "priority_support", "custom_integrations"]'),
('Enterprise', 'paid', 50000, 600000, 499.00, 5490.00, 0.005, '["all_features", "dedicated_support", "custom_deployment"]')
ON CONFLICT (plan_name) DO NOTHING;

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID REFERENCES user_profiles(id),
    plan_id               INTEGER REFERENCES subscription_plans(id),
    billing_cycle         VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    status                VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired, suspended
    start_date            TIMESTAMPTZ NOT NULL,
    end_date              TIMESTAMPTZ,
    next_billing_date     TIMESTAMPTZ,
    auto_renew            BOOLEAN DEFAULT TRUE,
    cancellation_reason   TEXT,
    cancelled_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 3. CREDIT MANAGEMENT SYSTEM
-- =====================================================================

-- User credit balance (main credit wallet)
CREATE TABLE IF NOT EXISTS user_credits (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID REFERENCES user_profiles(id) UNIQUE,
    
    -- Subscription credits
    monthly_allocation    INTEGER DEFAULT 0,
    subscription_credits  INTEGER DEFAULT 0,
    
    -- Pay-as-you-go credits
    recharged_credits     INTEGER DEFAULT 0,
    bonus_credits         INTEGER DEFAULT 0,
    
    -- Usage tracking
    used_credits          INTEGER DEFAULT 0,
    
    -- Reset tracking
    last_reset_date       TIMESTAMPTZ,
    next_reset_date       TIMESTAMPTZ,
    
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Credit packages for pay-as-you-go
CREATE TABLE IF NOT EXISTS credit_packages (
    id                    SERIAL PRIMARY KEY,
    package_name          VARCHAR(100) NOT NULL,
    credit_amount         INTEGER NOT NULL,
    price_usd             DECIMAL(10,2) NOT NULL,
    discount_percent      DECIMAL(5,2) DEFAULT 0,
    is_popular            BOOLEAN DEFAULT FALSE,
    is_active             BOOLEAN DEFAULT TRUE,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Insert credit packages (only if not exists)
INSERT INTO credit_packages (package_name, credit_amount, price_usd, discount_percent, is_popular) 
VALUES 
('Starter Pack', 100, 2.00, 0, FALSE),
('Popular Pack', 500, 8.00, 20, TRUE),
('Value Pack', 1000, 14.00, 30, FALSE),
('Bulk Pack', 5000, 60.00, 40, FALSE)
ON CONFLICT DO NOTHING;

-- Detailed credit transaction history
CREATE TABLE IF NOT EXISTS credit_transactions (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID REFERENCES user_profiles(id),
    transaction_type      VARCHAR(30) NOT NULL, -- subscription_allocation, recharge_purchase, assessment_usage, refund, bonus, monthly_reset
    credit_change         INTEGER NOT NULL, -- positive for add, negative for deduct
    balance_before        INTEGER NOT NULL,
    balance_after         INTEGER NOT NULL,
    description           TEXT,
    
    -- Related records
    assessment_id         BIGINT, -- will reference assessments(id)
    metadata              JSONB,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 4. MULTI-TENANT ASSESSMENTS (User Isolation)
-- =====================================================================

-- Enhanced assessments table with user isolation
CREATE TABLE IF NOT EXISTS assessments (
    id BIGSERIAL PRIMARY KEY,
    user_id               UUID REFERENCES user_profiles(id) NOT NULL, -- CRITICAL: User isolation
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic information
    website               TEXT NOT NULL,
    country_code          TEXT NOT NULL,
    status                TEXT NOT NULL DEFAULT 'pending',
    
    -- Credit tracking
    credits_consumed      INTEGER DEFAULT 1,
    assessment_cost       DECIMAL(5,4),
    assessment_type       VARCHAR(20) DEFAULT 'comprehensive', -- quick, comprehensive
    
    -- Flexible JSON storage
    assessment_data       JSONB NOT NULL DEFAULT '{}',
    
    -- Generated fields for indexing
    risk_score            INTEGER GENERATED ALWAYS AS ((assessment_data->>'risk_score')::INTEGER) STORED,
    risk_category         TEXT GENERATED ALWAYS AS (assessment_data->>'risk_category') STORED,
    country_supported     BOOLEAN GENERATED ALWAYS AS ((assessment_data->>'country_supported')::BOOLEAN) STORED,
    mcc_restricted        BOOLEAN GENERATED ALWAYS AS ((assessment_data->>'mcc_restricted')::BOOLEAN) STORED,
    
    -- Metadata
    processing_time_seconds DECIMAL(10,3),
    error_message         TEXT,
    
    -- Audit fields
    created_by            TEXT DEFAULT 'system',
    updated_by            TEXT DEFAULT 'system'
);

-- =====================================================================
-- 5. USER ACTIVITY & ANALYTICS
-- =====================================================================

-- User activity logging
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID REFERENCES user_profiles(id),
    session_id            UUID REFERENCES user_sessions(id),
    action                VARCHAR(100) NOT NULL, -- login, assessment_created, report_viewed, credit_purchased
    resource_type         VARCHAR(50), -- assessment, report, configuration, payment
    resource_id           VARCHAR(255),
    credits_consumed      INTEGER DEFAULT 0,
    metadata              JSONB,
    ip_address            INET,
    user_agent            TEXT,
    duration_seconds      INTEGER,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- 6. INDEXES & PERFORMANCE (Critical for Multi-Tenant)
-- =====================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON user_profiles(onboarding_completed);

-- Phone verification indexes
CREATE INDEX IF NOT EXISTS idx_phone_verifications_user ON phone_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires ON phone_verifications(expires_at);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created ON user_sessions(created_at);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_billing ON user_subscriptions(next_billing_date);

-- Credit indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);

-- CRITICAL: Multi-tenant assessment indexes
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user_created ON assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_user_status ON assessments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_assessments_user_website ON assessments(user_id, website);

-- Other assessment indexes (existing)
CREATE INDEX IF NOT EXISTS idx_assessments_website ON assessments(website);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_assessments_country_code ON assessments(country_code);
CREATE INDEX IF NOT EXISTS idx_assessments_risk_category ON assessments(risk_category);
CREATE INDEX IF NOT EXISTS idx_assessments_risk_score ON assessments(risk_score);

-- JSON indexes
CREATE INDEX IF NOT EXISTS idx_assessments_data_gin ON assessments USING GIN (assessment_data);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON user_activity_logs(created_at);

-- =====================================================================
-- 7. ROW LEVEL SECURITY (RLS) - Critical for Multi-Tenant
-- =====================================================================

-- Enable RLS on user-specific tables
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data isolation
CREATE POLICY IF NOT EXISTS assessments_user_isolation ON assessments
    USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS user_credits_isolation ON user_credits
    USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS credit_transactions_isolation ON credit_transactions
    USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS activity_logs_isolation ON user_activity_logs
    USING (user_id = auth.uid());

-- =====================================================================
-- 8. TRIGGERS & FUNCTIONS
-- =====================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_assessments_updated_at 
    BEFORE UPDATE ON assessments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_credits_updated_at 
    BEFORE UPDATE ON user_credits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create user profile after signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, phone, full_name, email_verified)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.phone, ''), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create initial credit balance (500 free credits)
  INSERT INTO user_credits (user_id, subscription_credits)
  VALUES (NEW.id, 500)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger for auto-creating user profile
CREATE TRIGGER IF NOT EXISTS on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================================
-- 9. CONSTRAINTS & VALIDATION
-- =====================================================================

-- Assessment constraints
ALTER TABLE assessments ADD CONSTRAINT IF NOT EXISTS chk_risk_score_range CHECK (risk_score >= 0 AND risk_score <= 100);
ALTER TABLE assessments ADD CONSTRAINT IF NOT EXISTS chk_status_valid CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE assessments ADD CONSTRAINT IF NOT EXISTS chk_risk_category_valid CHECK (risk_category IN ('low_risk', 'med_risk', 'high_risk'));
ALTER TABLE assessments ADD CONSTRAINT IF NOT EXISTS chk_country_code_length CHECK (LENGTH(country_code) = 2);
ALTER TABLE assessments ADD CONSTRAINT IF NOT EXISTS chk_website_not_empty CHECK (LENGTH(TRIM(website)) > 0);

-- User profile constraints
ALTER TABLE user_profiles ADD CONSTRAINT IF NOT EXISTS chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE user_profiles ADD CONSTRAINT IF NOT EXISTS chk_phone_format CHECK (phone ~ '^[+]?[0-9\s\-\(\)]{10,20}$');
ALTER TABLE user_profiles ADD CONSTRAINT IF NOT EXISTS chk_status_valid CHECK (status IN ('active', 'suspended', 'deleted'));

-- Credit constraints
ALTER TABLE user_credits ADD CONSTRAINT IF NOT EXISTS chk_credits_non_negative CHECK (
    subscription_credits >= 0 AND 
    recharged_credits >= 0 AND 
    bonus_credits >= 0 AND 
    used_credits >= 0
);

-- =====================================================================
-- 10. INITIAL DATA & CLEANUP
-- =====================================================================

-- Clean up any orphaned data
DELETE FROM assessments WHERE user_id IS NULL;

-- Update any existing assessments without user_id (development data)
-- UPDATE assessments SET user_id = (SELECT id FROM user_profiles LIMIT 1) WHERE user_id IS NULL;

-- Final status
DO $$
BEGIN
    RAISE NOTICE '✅ QuarkfinAI Multi-Tenant Production Schema Setup Complete';
    RAISE NOTICE '📊 Tables created: user_profiles, phone_verifications, user_sessions, subscription_plans, user_subscriptions, user_credits, credit_packages, credit_transactions, assessments, user_activity_logs';
    RAISE NOTICE '🔒 Row Level Security enabled for data isolation';
    RAISE NOTICE '📈 Indexes created for optimal performance';
    RAISE NOTICE '🎯 Ready for Monday production launch!';
END $$;
