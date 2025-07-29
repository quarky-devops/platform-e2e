package scrapers

import (
	"fmt"
	"log"
	"strings"
	"time"
)

// WebsiteRiskAssessmentOrchestrator orchestrates the complete website risk assessment process
type WebsiteRiskAssessmentOrchestrator struct {
	// Could add configuration, logging, etc. here
}

// NewWebsiteRiskAssessmentOrchestrator creates a new orchestrator instance
func NewWebsiteRiskAssessmentOrchestrator() *WebsiteRiskAssessmentOrchestrator {
	return &WebsiteRiskAssessmentOrchestrator{}
}

// RunAssessment runs the complete risk assessment for a domain
func (o *WebsiteRiskAssessmentOrchestrator) RunAssessment(domainName, countryCode string) (*RiskAssessment, error) {
	log.Printf("Starting risk assessment for domain: %s", domainName)

	// Initialize assessment
	assessment := &RiskAssessment{
		DomainName: domainName,
		CreatedAt:  time.Now(),
	}

	// Step 1: Check if country can be onboarded
	log.Println("Checking merchant business details...")
	assessment.MerchantBusiness = GetMerchantBusinessDetails(countryCode)

	// Return early if country is not supported
	if !assessment.MerchantBusiness.CountrySupported {
		log.Printf("Country %s is not supported for onboarding", countryCode)
		return assessment, nil
	}

	// Step 2: Check MCC
	log.Println("Running MCC classification...")
	start := time.Now()
	assessment.MCCDetails = CheckMCC(domainName)
	log.Printf("MCC classification completed in %v", time.Since(start))

	// Step 3: Run all scrapers
	log.Println("Running scrapers...")

	// HTTPS Check
	log.Println("Running HTTPS check...")
	start = time.Now()
	assessment.HTTPSCheck = CheckHTTPS(domainName)
	log.Printf("HTTPS check completed in %v", time.Since(start))

	// SSL Fingerprint
	log.Println("Running SSL fingerprint check...")
	start = time.Now()
	assessment.SSLSha256Fingerprint = GetSSLFingerprint(domainName)
	log.Printf("SSL fingerprint check completed in %v", time.Since(start))

	// Privacy and Terms Check
	log.Println("Running privacy and terms check...")
	start = time.Now()
	assessment.PrivacyAndTerms = CheckPrivacyTerms(domainName)
	log.Printf("Privacy and terms check completed in %v", time.Since(start))

	// Social Presence Check
	log.Println("Running social presence check...")
	start = time.Now()
	assessment.SocialPresence = CheckSocialPresence(domainName)
	log.Printf("Social presence check completed in %v", time.Since(start))

	// WHOIS Check
	log.Println("Running WHOIS check...")
	start = time.Now()
	assessment.Whois = GetWhoisData(domainName)
	log.Printf("WHOIS check completed in %v", time.Since(start))

	// URLVoid Check
	log.Println("Running URLVoid check...")
	start = time.Now()
	assessment.URLVoid = GetURLVoidData(domainName)
	log.Printf("URLVoid check completed in %v", time.Since(start))

	// GoDaddy WHOIS Check
	log.Println("Running GoDaddy WHOIS check...")
	start = time.Now()
	assessment.GoDaddyWhois = GetGoDaddyWhoisData(domainName)
	log.Printf("GoDaddy WHOIS check completed in %v", time.Since(start))

	// Google Safe Browsing Check
	log.Println("Running Google Safe Browsing check...")
	start = time.Now()
	assessment.GoogleSafeBrowsing = GetGoogleSafeBrowsingData(domainName)
	log.Printf("Google Safe Browsing check completed in %v", time.Since(start))

	// Tranco List Ranking Check
	log.Println("Running Tranco List ranking check...")
	start = time.Now()
	assessment.TrancoList = GetTrancoListData(domainName)
	log.Printf("Tranco List ranking check completed in %v", time.Since(start))

	// Page Size Check
	log.Println("Running page size check...")
	start = time.Now()
	assessment.PageSize = CheckPageSize(domainName)
	log.Printf("Page size check completed in %v", time.Since(start))

	// Traffic Volume Check
	log.Println("Running traffic volume check...")
	start = time.Now()
	assessment.TrafficVolume = CheckTrafficVolume(domainName)
	log.Printf("Traffic volume check completed in %v", time.Since(start))

	// Popup and Ads Check
	log.Println("Running popup and ads check...")
	start = time.Now()
	assessment.PopupAndAds = CheckPopupAds(domainName)
	log.Printf("Popup and ads check completed in %v", time.Since(start))

	// Step 4: Extract IP and Run IPVoid
	log.Println("Running IPVoid check...")
	start = time.Now()
	ipAddress := ExtractIPFromURLVoid(assessment.URLVoid)
	if ipAddress != "" {
		assessment.IPVoid = GetIPVoidData(ipAddress)
		log.Printf("IPVoid check completed for IP: %s in %v", ipAddress, time.Since(start))
	} else {
		log.Println("No IP address found in URLVoid response, skipping IPVoid")
		assessment.IPVoid = IPVoidResult{
			Error: "No IP Address found in URLVoid response",
		}
	}

	// Step 5: Geopolitical Risk Assessment
	log.Println("Running geopolitical risk assessment...")
	countryCodeFromIP := assessment.IPVoid.CountryCode
	if countryCodeFromIP == "" {
		// Extract from IPVoid country name if available
		countryCodeFromIP = extractCountryCodeFromName(assessment.IPVoid.CountryName)
	}
	assessment.IsRiskyGeopolitical = CheckGeopoliticalRisk(countryCodeFromIP)

	// Step 6: Calculate Risk Score
	log.Println("Calculating risk score...")
	AssessRisk(assessment)

	log.Printf("Risk assessment completed. Score: %d, Category: %s",
		assessment.RiskScore, assessment.RiskCategory)

	return assessment, nil
}

// extractCountryCodeFromName extracts country code from country name
func extractCountryCodeFromName(countryName string) string {
	// Simple mapping for common countries
	countryMapping := map[string]string{
		"united states":        "US",
		"united kingdom":       "GB",
		"germany":              "DE",
		"france":               "FR",
		"canada":               "CA",
		"australia":            "AU",
		"japan":                "JP",
		"china":                "CN",
		"india":                "IN",
		"brazil":               "BR",
		"russia":               "RU",
		"south korea":          "KR",
		"netherlands":          "NL",
		"sweden":               "SE",
		"switzerland":          "CH",
		"singapore":            "SG",
		"hong kong":            "HK",
		"ireland":              "IE",
		"belgium":              "BE",
		"denmark":              "DK",
		"finland":              "FI",
		"norway":               "NO",
		"austria":              "AT",
		"italy":                "IT",
		"spain":                "ES",
		"portugal":             "PT",
		"poland":               "PL",
		"czech republic":       "CZ",
		"hungary":              "HU",
		"romania":              "RO",
		"bulgaria":             "BG",
		"greece":               "GR",
		"turkey":               "TR",
		"israel":               "IL",
		"saudi arabia":         "SA",
		"united arab emirates": "AE",
		"egypt":                "EG",
		"south africa":         "ZA",
		"mexico":               "MX",
		"argentina":            "AR",
		"chile":                "CL",
		"colombia":             "CO",
		"peru":                 "PE",
		"venezuela":            "VE",
		"thailand":             "TH",
		"vietnam":              "VN",
		"philippines":          "PH",
		"indonesia":            "ID",
		"malaysia":             "MY",
		"taiwan":               "TW",
		"new zealand":          "NZ",
	}

	if countryName != "" {
		lowerName := strings.ToLower(countryName)
		if code, exists := countryMapping[lowerName]; exists {
			return code
		}
	}

	return ""
}

// GetAssessmentSummary returns a summary of the assessment
func (o *WebsiteRiskAssessmentOrchestrator) GetAssessmentSummary(assessment *RiskAssessment) map[string]interface{} {
	summary := map[string]interface{}{
		"domain_name":        assessment.DomainName,
		"risk_score":         assessment.RiskScore,
		"risk_category":      assessment.RiskCategory,
		"country_supported":  assessment.MerchantBusiness.CountrySupported,
		"mcc_restricted":     assessment.MCCDetails.MCCRestricted,
		"https_supported":    assessment.HTTPSCheck.HasHTTPS,
		"ssl_valid":          assessment.SSLSha256Fingerprint.HasSHA256,
		"privacy_compliant":  assessment.PrivacyAndTerms.PrivacyPolicyPresent && assessment.PrivacyAndTerms.TermsOfServicePresent,
		"social_presence":    assessment.SocialPresence.SocialPresence.LinkedIn.Presence,
		"geopolitical_risk":  assessment.IsRiskyGeopolitical.IsRisky,
		"created_at":         assessment.CreatedAt,
		"page_size_kb":       assessment.PageSize.PageSizeKB,
		"has_popups":         assessment.PopupAndAds.HasPopups,
		"has_ads":            assessment.PopupAndAds.HasAds,
		"urlvoid_detections": assessment.URLVoid.DetectionsCounts.Detected,
		"ipvoid_detections":  assessment.IPVoid.DetectionsCount.Detected,
	}

	return summary
}

// ValidateAssessmentResult validates the assessment result
func (o *WebsiteRiskAssessmentOrchestrator) ValidateAssessmentResult(assessment *RiskAssessment) []string {
	var issues []string

	if assessment.DomainName == "" {
		issues = append(issues, "Domain name is required")
	}

	if assessment.RiskScore < 0 || assessment.RiskScore > 100 {
		issues = append(issues, fmt.Sprintf("Risk score %d is out of valid range (0-100)", assessment.RiskScore))
	}

	if assessment.RiskCategory == "" {
		issues = append(issues, "Risk category is required")
	}

	if assessment.CreatedAt.IsZero() {
		issues = append(issues, "Creation timestamp is required")
	}

	return issues
}

// GetRecommendations provides recommendations based on the assessment
func (o *WebsiteRiskAssessmentOrchestrator) GetRecommendations(assessment *RiskAssessment) []string {
	var recommendations []string

	if !assessment.HTTPSCheck.HasHTTPS {
		recommendations = append(recommendations, "Implement HTTPS encryption for security")
	}

	if !assessment.SSLSha256Fingerprint.HasSHA256 {
		recommendations = append(recommendations, "Obtain a valid SSL certificate")
	}

	if !assessment.PrivacyAndTerms.PrivacyPolicyPresent {
		recommendations = append(recommendations, "Add a privacy policy to your website")
	}

	if !assessment.PrivacyAndTerms.TermsOfServicePresent {
		recommendations = append(recommendations, "Add terms of service to your website")
	}

	if !assessment.SocialPresence.SocialPresence.LinkedIn.Presence {
		recommendations = append(recommendations, "Establish a LinkedIn company presence")
	}

	if assessment.IsRiskyGeopolitical.IsRisky {
		recommendations = append(recommendations, "Address geopolitical risk factors")
	}

	if assessment.URLVoid.DetectionsCounts.Detected > 0 {
		recommendations = append(recommendations, fmt.Sprintf("Address %d security detections found by URLVoid", assessment.URLVoid.DetectionsCounts.Detected))
	}

	if assessment.IPVoid.DetectionsCount.Detected > 0 {
		recommendations = append(recommendations, fmt.Sprintf("Address %d IP reputation issues found by IPVoid", assessment.IPVoid.DetectionsCount.Detected))
	}

	if assessment.PageSize.PageSizeKB > 0 && assessment.PageSize.PageSizeKB < 100 {
		recommendations = append(recommendations, "Consider adding more content to your website - current page size is very small")
	}

	if assessment.PopupAndAds.HasPopups {
		recommendations = append(recommendations, "Consider reducing popup usage for better user experience")
	}

	if assessment.PopupAndAds.HasAds {
		recommendations = append(recommendations, "Ensure advertising compliance with relevant regulations")
	}

	if assessment.Whois.CreationDate.IsZero() {
		recommendations = append(recommendations, "Verify domain registration information is publicly available")
	}

	if assessment.RiskScore > 45 {
		recommendations = append(recommendations, "Consider improving overall website security and compliance")
	}

	if len(recommendations) == 0 {
		recommendations = append(recommendations, "Website appears to meet basic security and compliance requirements")
	}

	return recommendations
}
