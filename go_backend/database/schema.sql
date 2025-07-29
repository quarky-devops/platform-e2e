-- QuarkFin Platform E2E Backend Database Schema
-- This file contains the complete database schema for the website risk assessment system

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS assessment_logs;
DROP TABLE IF EXISTS assessment_metrics;
DROP TABLE IF EXISTS assessments;

-- Create main assessments table with flexible JSON storage
CREATE TABLE assessments (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic information (for indexing and quick queries)
    website TEXT NOT NULL,
    country_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    
    -- Flexible JSON storage for all assessment data
    assessment_data JSONB NOT NULL DEFAULT '{}',
    
    -- Key extracted fields for indexing and performance (auto-populated from JSON)
    risk_score INTEGER GENERATED ALWAYS AS ((assessment_data->>'risk_score')::INTEGER) STORED,
    risk_category TEXT GENERATED ALWAYS AS (assessment_data->>'risk_category') STORED,
    country_supported BOOLEAN GENERATED ALWAYS AS ((assessment_data->>'country_supported')::BOOLEAN) STORED,
    mcc_restricted BOOLEAN GENERATED ALWAYS AS ((assessment_data->>'mcc_restricted')::BOOLEAN) STORED,
    
    -- Metadata
    processing_time_seconds DECIMAL(10,3),
    error_message TEXT,
    
    -- Audit fields
    created_by TEXT DEFAULT 'system',
    updated_by TEXT DEFAULT 'system'
);

-- Create assessment metrics table for historical tracking
CREATE TABLE assessment_metrics (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Store all metrics as flexible JSON
    metrics_data JSONB NOT NULL DEFAULT '{}',
    
    -- Key extracted fields for indexing
    overall_score INTEGER GENERATED ALWAYS AS ((metrics_data->>'overall_score')::INTEGER) STORED,
    compliance_rate DECIMAL(5,2) GENERATED ALWAYS AS ((metrics_data->>'compliance_rate')::DECIMAL(5,2)) STORED
);

-- Create assessment logs table for audit trail
CREATE TABLE assessment_logs (
    id BIGSERIAL PRIMARY KEY,
    assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Log details
    log_level TEXT NOT NULL DEFAULT 'INFO',
    component TEXT NOT NULL,
    message TEXT NOT NULL,
    execution_time_ms INTEGER,
    
    -- Store additional context as JSON
    log_data JSONB DEFAULT '{}',
    
    -- Metadata
    created_by TEXT DEFAULT 'system'
);

-- Create indexes for better performance
CREATE INDEX idx_assessments_website ON assessments(website);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_created_at ON assessments(created_at);
CREATE INDEX idx_assessments_country_code ON assessments(country_code);
CREATE INDEX idx_assessments_risk_category ON assessments(risk_category);
CREATE INDEX idx_assessments_risk_score ON assessments(risk_score);
CREATE INDEX idx_assessments_country_supported ON assessments(country_supported);
CREATE INDEX idx_assessments_mcc_restricted ON assessments(mcc_restricted);

-- JSON-specific indexes for flexible querying
CREATE INDEX idx_assessments_data_gin ON assessments USING GIN (assessment_data);
CREATE INDEX idx_assessments_mcc_code ON assessments USING GIN ((assessment_data->'business_details'));
CREATE INDEX idx_assessments_compliance ON assessments USING GIN ((assessment_data->'compliance_flags'));
CREATE INDEX idx_assessments_security ON assessments USING GIN ((assessment_data->'security_details'));

-- Composite indexes for common queries
CREATE INDEX idx_assessments_status_created ON assessments(status, created_at);
CREATE INDEX idx_assessments_country_risk ON assessments(country_code, risk_category);
CREATE INDEX idx_assessments_website_created ON assessments(website, created_at);

-- Indexes for metrics table
CREATE INDEX idx_metrics_assessment_id ON assessment_metrics(assessment_id);
CREATE INDEX idx_metrics_created_at ON assessment_metrics(created_at);
CREATE INDEX idx_metrics_overall_score ON assessment_metrics(overall_score);
CREATE INDEX idx_metrics_data_gin ON assessment_metrics USING GIN (metrics_data);

-- Indexes for logs table
CREATE INDEX idx_logs_assessment_id ON assessment_logs(assessment_id);
CREATE INDEX idx_logs_created_at ON assessment_logs(created_at);
CREATE INDEX idx_logs_component ON assessment_logs(component);
CREATE INDEX idx_logs_log_level ON assessment_logs(log_level);
CREATE INDEX idx_logs_data_gin ON assessment_logs USING GIN (log_data);

-- Add constraints
ALTER TABLE assessments ADD CONSTRAINT chk_risk_score_range CHECK (risk_score >= 0 AND risk_score <= 100);
ALTER TABLE assessments ADD CONSTRAINT chk_status_valid CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE assessments ADD CONSTRAINT chk_risk_category_valid CHECK (risk_category IN ('low_risk', 'med_risk', 'high_risk'));
ALTER TABLE assessments ADD CONSTRAINT chk_country_code_length CHECK (LENGTH(country_code) = 2);
ALTER TABLE assessments ADD CONSTRAINT chk_website_not_empty CHECK (LENGTH(TRIM(website)) > 0);
ALTER TABLE assessments ADD CONSTRAINT chk_assessment_data_not_empty CHECK (assessment_data != '{}');

-- Add check constraints for metrics
ALTER TABLE assessment_metrics ADD CONSTRAINT chk_overall_score_range CHECK (
    overall_score >= 0 AND overall_score <= 100
);

-- Add check constraints for logs
ALTER TABLE assessment_logs ADD CONSTRAINT chk_log_level_valid CHECK (log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_assessments_updated_at 
    BEFORE UPDATE ON assessments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries with JSON extraction
CREATE VIEW assessment_summary AS
SELECT 
    a.id,
    a.website,
    a.country_code,
    a.status,
    a.risk_score,
    a.risk_category,
    a.created_at,
    a.country_supported,
    a.mcc_restricted,
    a.processing_time_seconds,
    -- Extract additional data from JSON
    (a.assessment_data->>'https_supported')::BOOLEAN AS https_supported,
    (a.assessment_data->>'ssl_valid')::BOOLEAN AS ssl_valid,
    (a.assessment_data->>'privacy_compliant')::BOOLEAN AS privacy_compliant,
    (a.assessment_data->>'terms_compliant')::BOOLEAN AS terms_compliant,
    (a.assessment_data->>'social_presence')::BOOLEAN AS social_presence,
    (a.assessment_data->>'geopolitical_risk')::BOOLEAN AS geopolitical_risk,
    a.assessment_data->'business_details' AS business_details,
    a.assessment_data->'security_details' AS security_details,
    a.assessment_data->'compliance_flags' AS compliance_flags,
    a.assessment_data->'technical_details' AS technical_details,
    a.assessment_data->'risk_breakdown' AS risk_breakdown,
    CASE 
        WHEN a.status = 'completed' AND a.risk_score < 45 THEN 'auto_approve'
        WHEN a.status = 'completed' AND a.risk_score >= 81 THEN 'reject'
        WHEN a.status = 'completed' AND a.mcc_restricted THEN 'manual_review'
        WHEN a.status = 'completed' THEN 'manual_review'
        ELSE 'pending'
    END AS decision,
    am.compliance_rate,
    am.overall_score AS metrics_overall_score,
    am.metrics_data->'scores' AS detailed_scores,
    am.metrics_data->'recommendations' AS recommendations
FROM assessments a
LEFT JOIN assessment_metrics am ON a.id = am.assessment_id;

-- Create view for risk statistics
CREATE VIEW risk_statistics AS
SELECT 
    DATE_TRUNC('day', created_at) AS date,
    COUNT(*) AS total_assessments,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_assessments,
    COUNT(*) FILTER (WHERE risk_category = 'low_risk') AS low_risk_count,
    COUNT(*) FILTER (WHERE risk_category = 'med_risk') AS med_risk_count,
    COUNT(*) FILTER (WHERE risk_category = 'high_risk') AS high_risk_count,
    AVG(risk_score) FILTER (WHERE risk_score IS NOT NULL) AS avg_risk_score,
    COUNT(*) FILTER (WHERE country_supported = false) AS unsupported_country_count,
    COUNT(*) FILTER (WHERE mcc_restricted = true) AS restricted_mcc_count,
    COUNT(*) FILTER (WHERE (assessment_data->>'geopolitical_risk')::BOOLEAN = true) AS geopolitical_risk_count
FROM assessments
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Create view for compliance overview
CREATE VIEW compliance_overview AS
SELECT 
    country_code,
    COUNT(*) AS total_assessments,
    COUNT(*) FILTER (WHERE (assessment_data->>'https_supported')::BOOLEAN = true) AS https_compliant,
    COUNT(*) FILTER (WHERE (assessment_data->>'ssl_valid')::BOOLEAN = true) AS ssl_compliant,
    COUNT(*) FILTER (WHERE (assessment_data->>'privacy_compliant')::BOOLEAN = true) AS privacy_compliant,
    COUNT(*) FILTER (WHERE (assessment_data->>'terms_compliant')::BOOLEAN = true) AS terms_compliant,
    COUNT(*) FILTER (WHERE (assessment_data->>'social_presence')::BOOLEAN = true) AS social_presence_count,
    COUNT(*) FILTER (WHERE (assessment_data->>'geopolitical_risk')::BOOLEAN = false) AS geopolitical_safe,
    ROUND(AVG(risk_score), 2) AS avg_risk_score,
    -- Aggregate JSON data for insights
    jsonb_agg(assessment_data->'business_details') FILTER (WHERE status = 'completed') AS business_insights,
    jsonb_agg(assessment_data->'risk_breakdown') FILTER (WHERE status = 'completed') AS risk_insights
FROM assessments
WHERE status = 'completed'
GROUP BY country_code
ORDER BY total_assessments DESC;

-- Comments
COMMENT ON TABLE assessments IS 'Main table storing website risk assessments with flexible JSON storage';
COMMENT ON COLUMN assessments.assessment_data IS 'Complete assessment data in JSON format for maximum flexibility';
COMMENT ON TABLE assessment_metrics IS 'Detailed metrics and scoring breakdown stored as JSON';
COMMENT ON TABLE assessment_logs IS 'Audit trail and logging with JSON context data';

-- Example assessment_data JSON structure
/*
{
  "risk_score": 75,
  "risk_category": "med_risk",
  "country_supported": true,
  "mcc_restricted": false,
  "compliance_flags": {
    "https_supported": true,
    "ssl_valid": true,
    "privacy_compliant": false,
    "terms_compliant": true,
    "social_presence": true,
    "geopolitical_risk": false
  },
  "technical_details": {
    "page_size_kb": 250,
    "load_time_ms": 1500,
    "has_popups": false,
    "has_ads": true,
    "ip_address": "192.168.1.1",
    "server_location": "US-East"
  },
  "security_details": {
    "urlvoid_detections": 0,
    "ipvoid_detections": 0,
    "ssl_details": {
      "issuer": "Let's Encrypt",
      "expiry": "2025-12-31",
      "valid": true
    }
  },
  "business_details": {
    "mcc_code": "5999",
    "mcc_category": "Miscellaneous Retail",
    "legal_entity": "Example Corp",
    "linkedin_url": "https://linkedin.com/company/example",
    "domain_registrar": "GoDaddy",
    "domain_age_days": 365
  },
  "risk_breakdown": {
    "privacy_policy": 10,
    "terms_service": 5,
    "https": 0,
    "ssl": 0,
    "linkedin": 0,
    "domain_age": 5,
    "urlvoid": 0,
    "ipvoid": 0,
    "page_size": 15,
    "popups": 0,
    "ads": 10,
    "geopolitical": 0
  },
  "scraped_data": {
    "privacy_policy_url": "https://example.com/privacy",
    "terms_url": "https://example.com/terms",
    "contact_info": {
      "email": "contact@example.com",
      "phone": "+1-555-0123"
    }
  },
  "timestamps": {
    "assessment_started": "2025-01-15T10:30:00Z",
    "assessment_completed": "2025-01-15T10:32:15Z",
    "processing_duration": 135
  }
}
*/
