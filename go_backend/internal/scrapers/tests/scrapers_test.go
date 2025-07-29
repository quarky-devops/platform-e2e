package scrapers

import (
	"testing"
	"time"
)

func TestCheckHTTPS(t *testing.T) {
	tests := []struct {
		name   string
		domain string
		expect bool
	}{
		{"Google HTTPS", "google.com", true},
		{"GitHub HTTPS", "github.com", true},
		{"Example HTTPS", "example.com", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CheckHTTPS(tt.domain)
			if result.HasHTTPS != tt.expect {
				t.Errorf("CheckHTTPS(%s) = %v, expected %v", tt.domain, result.HasHTTPS, tt.expect)
			}
		})
	}
}

func TestGetSSLFingerprint(t *testing.T) {
	tests := []struct {
		name   string
		domain string
		expect bool
	}{
		{"Google SSL", "google.com", true},
		{"GitHub SSL", "github.com", true},
		{"Example SSL", "example.com", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetSSLFingerprint(tt.domain)
			if result.HasSHA256 != tt.expect {
				t.Errorf("GetSSLFingerprint(%s).HasSHA256 = %v, expected %v", tt.domain, result.HasSHA256, tt.expect)
			}
			if result.HasSHA256 && result.SHA256Fingerprint == "" {
				t.Errorf("GetSSLFingerprint(%s) has no fingerprint despite HasSHA256 = true", tt.domain)
			}
		})
	}
}

func TestCheckPrivacyTerms(t *testing.T) {
	tests := []struct {
		name   string
		domain string
	}{
		{"Google", "google.com"},
		{"GitHub", "github.com"},
		{"Example", "example.com"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CheckPrivacyTerms(tt.domain)
			if !result.IsAccessible {
				t.Errorf("CheckPrivacyTerms(%s) site not accessible", tt.domain)
			}
		})
	}
}

func TestCheckSocialPresence(t *testing.T) {
	tests := []struct {
		name   string
		domain string
	}{
		{"Microsoft", "microsoft.com"},
		{"Google", "google.com"},
		{"GitHub", "github.com"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CheckSocialPresence(tt.domain)
			// Just check that it doesn't crash
			_ = result.SocialPresence.LinkedIn.Presence
		})
	}
}

func TestGetWhoisData(t *testing.T) {
	tests := []struct {
		name   string
		domain string
	}{
		{"Google", "google.com"},
		{"Example", "example.com"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetWhoisData(tt.domain)
			if result.Error != "" {
				t.Logf("WHOIS error for %s: %s", tt.domain, result.Error)
			}
		})
	}
}

func TestCheckPageSize(t *testing.T) {
	tests := []struct {
		name   string
		domain string
	}{
		{"Google", "google.com"},
		{"Example", "example.com"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CheckPageSize(tt.domain)
			if result.Error != "" {
				t.Logf("Page size error for %s: %s", tt.domain, result.Error)
			} else {
				if result.PageSizeKB <= 0 {
					t.Errorf("CheckPageSize(%s) returned invalid size: %d KB", tt.domain, result.PageSizeKB)
				}
			}
		})
	}
}

func TestCheckPopupAds(t *testing.T) {
	tests := []struct {
		name   string
		domain string
	}{
		{"Google", "google.com"},
		{"Example", "example.com"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CheckPopupAds(tt.domain)
			if result.Error != "" {
				t.Logf("Popup ads error for %s: %s", tt.domain, result.Error)
			}
		})
	}
}

func TestRiskAssessment(t *testing.T) {
	orchestrator := NewWebsiteRiskAssessmentOrchestrator()
	
	tests := []struct {
		name        string
		domain      string
		countryCode string
	}{
		{"Google US", "google.com", "US"},
		{"Example US", "example.com", "US"},
		{"Unsupported Country", "example.com", "XX"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assessment, err := orchestrator.RunAssessment(tt.domain, tt.countryCode)
			if err != nil {
				t.Fatalf("RunAssessment failed: %v", err)
			}
			
			if assessment.DomainName != tt.domain {
				t.Errorf("Expected domain %s, got %s", tt.domain, assessment.DomainName)
			}
			
			if assessment.MerchantBusiness.CountryCode != tt.countryCode {
				t.Errorf("Expected country code %s, got %s", tt.countryCode, assessment.MerchantBusiness.CountryCode)
			}
			
			if assessment.RiskScore < 0 || assessment.RiskScore > 100 {
				t.Errorf("Risk score out of range: %d", assessment.RiskScore)
			}
			
			if assessment.RiskCategory == "" {
				t.Error("Risk category is empty")
			}
			
			// Test validation
			issues := orchestrator.ValidateAssessmentResult(assessment)
			if len(issues) > 0 {
				t.Errorf("Validation issues: %v", issues)
			}
			
			// Test summary
			summary := orchestrator.GetAssessmentSummary(assessment)
			if summary["domain_name"] != tt.domain {
				t.Errorf("Summary domain mismatch")
			}
			
			// Test recommendations
			recommendations := orchestrator.GetRecommendations(assessment)
			if len(recommendations) == 0 {
				t.Error("No recommendations generated")
			}
		})
	}
}

func TestHelperFunctions(t *testing.T) {
	// Test country helper functions
	if !IsCountrySupported("US") {
		t.Error("US should be supported")
	}
	
	if IsCountrySupported("XX") {
		t.Error("XX should not be supported")
	}
	
	if !IsRiskyCountry("RU") {
		t.Error("RU should be risky")
	}
	
	if IsRiskyCountry("US") {
		t.Error("US should not be risky")
	}
	
	// Test MCC helper functions
	if !IsRestrictedMCC("7995") {
		t.Error("7995 should be restricted")
	}
	
	if IsRestrictedMCC("5812") {
		t.Error("5812 should not be restricted")
	}
	
	// Test risk categorization
	if CategorizeRisk(20) != "low_risk" {
		t.Error("Score 20 should be low_risk")
	}
	
	if CategorizeRisk(50) != "med_risk" {
		t.Error("Score 50 should be med_risk")
	}
	
	if CategorizeRisk(85) != "high_risk" {
		t.Error("Score 85 should be high_risk")
	}
}

func TestMCCClassification(t *testing.T) {
	tests := []struct {
		domain   string
		expected string
	}{
		{"bankofamerica.com", "6012"},
		{"casino.com", "7995"},
		{"bitcoin.com", "6051"},
		{"shopify.com", "5999"},
		{"mcdonalds.com", "5812"},
		{"hotels.com", "7011"},
		{"webmd.com", "8011"},
		{"example.com", "7399"},
	}

	for _, tt := range tests {
		t.Run(tt.domain, func(t *testing.T) {
			result := CheckMCC(tt.domain)
			if result.MCCCode != tt.expected {
				t.Errorf("CheckMCC(%s) = %s, expected %s", tt.domain, result.MCCCode, tt.expected)
			}
		})
	}
}

func TestGeopoliticalRisk(t *testing.T) {
	tests := []struct {
		countryCode string
		expected    bool
	}{
		{"US", false},
		{"RU", true},
		{"CN", false},
		{"IR", true},
		{"GB", false},
		{"KP", true},
	}

	for _, tt := range tests {
		t.Run(tt.countryCode, func(t *testing.T) {
			result := CheckGeopoliticalRisk(tt.countryCode)
			if result.IsRisky != tt.expected {
				t.Errorf("CheckGeopoliticalRisk(%s) = %v, expected %v", tt.countryCode, result.IsRisky, tt.expected)
			}
		})
	}
}

func TestJSONSerialization(t *testing.T) {
	assessment := &RiskAssessment{
		DomainName:   "test.com",
		RiskScore:    50,
		RiskCategory: "med_risk",
		CreatedAt:    time.Now(),
	}

	jsonStr, err := assessment.ToJSON()
	if err != nil {
		t.Fatalf("ToJSON failed: %v", err)
	}

	if jsonStr == "" {
		t.Error("JSON string is empty")
	}

	// Test deserialization
	parsed, err := FromJSON(jsonStr)
	if err != nil {
		t.Fatalf("FromJSON failed: %v", err)
	}

	if parsed.DomainName != assessment.DomainName {
		t.Errorf("Domain name mismatch after JSON round trip")
	}
}

func TestMetrics(t *testing.T) {
	assessment := &RiskAssessment{
		DomainName:   "test.com",
		RiskScore:    25,
		RiskCategory: "low_risk",
		HTTPSCheck:   HTTPSResult{HasHTTPS: true},
		SSLSha256Fingerprint: SSLFingerprintResult{HasSHA256: true},
		PrivacyAndTerms: PrivacyTermsResult{
			IsAccessible:           true,
			PrivacyPolicyPresent:   true,
			TermsOfServicePresent:  true,
		},
		SocialPresence: SocialPresenceResult{
			SocialPresence: SocialPresence{
				LinkedIn: LinkedInPresence{Presence: true},
			},
		},
		IsRiskyGeopolitical: GeopoliticalRisk{IsRisky: false},
		MCCDetails:          MCCDetails{MCCRestricted: false},
		URLVoid:             URLVoidResult{DetectionsCounts: DetectionsCounts{Detected: 0}},
		IPVoid:              IPVoidResult{DetectionsCount: DetectionsCounts{Detected: 0}},
	}

	metrics := GetAssessmentMetrics(assessment)
	if metrics["overall_score"] != 25 {
		t.Errorf("Expected overall score 25, got %v", metrics["overall_score"])
	}

	compliance := GetComplianceStatus(assessment)
	if !compliance["overall_compliant"] {
		t.Error("Assessment should be compliant")
	}

	failed := GetFailedComplianceItems(assessment)
	if len(failed) > 0 {
		t.Errorf("No compliance items should fail, but got: %v", failed)
	}
}

// Benchmark tests
func BenchmarkCheckHTTPS(b *testing.B) {
	for i := 0; i < b.N; i++ {
		CheckHTTPS("example.com")
	}
}

func BenchmarkGetSSLFingerprint(b *testing.B) {
	for i := 0; i < b.N; i++ {
		GetSSLFingerprint("example.com")
	}
}

func BenchmarkCheckPrivacyTerms(b *testing.B) {
	for i := 0; i < b.N; i++ {
		CheckPrivacyTerms("example.com")
	}
}

func BenchmarkFullAssessment(b *testing.B) {
	orchestrator := NewWebsiteRiskAssessmentOrchestrator()
	for i := 0; i < b.N; i++ {
		orchestrator.RunAssessment("example.com", "US")
	}
}
