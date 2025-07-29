package scrapers

import (
	"encoding/json"
	"strings"
	"time"

	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/website_risk/mcc"
)

// CalculateRiskScore calculates the risk score based on various assessment parameters
func CalculateRiskScore(assessment *RiskAssessment) (int, map[string]int) {
	scores := make(map[string]int)

	// Privacy & Terms (5 points each)
	if !assessment.PrivacyAndTerms.PrivacyPolicyPresent {
		scores["privacy_policy"] = 5
	}
	if !assessment.PrivacyAndTerms.TermsOfServicePresent {
		scores["terms_of_service"] = 5
	}
	if !assessment.PrivacyAndTerms.IsAccessible {
		scores["privacy_accessible"] = 5
	}

	// HTTPS & SSL (12 points each)
	if !assessment.HTTPSCheck.HasHTTPS {
		scores["https"] = 12
	}
	if !assessment.SSLSha256Fingerprint.HasSHA256 {
		scores["ssl_fingerprint"] = 12
	}

	// Social Media Presence (6 points)
	if !assessment.SocialPresence.SocialPresence.LinkedIn.Presence {
		scores["linkedin_presence"] = 6
	}

	// Domain Age (8 points)
	if assessment.Whois.CreationDate.IsZero() && assessment.URLVoid.RegisteredOn == "" {
		scores["domain_age"] = 8
	}

	// URLVoid Security Scans (6 points)
	if assessment.URLVoid.DetectionsCounts.Detected > 0 {
		scores["urlvoid_detections"] = 6
	}

	// IPVoid Security Scans (6 points)
	if assessment.IPVoid.DetectionsCount.Detected > 0 {
		scores["ipvoid_detections"] = 6
	}

	// Page Size (9 points for very small pages)
	if assessment.PageSize.PageSizeKB > 0 && assessment.PageSize.PageSizeKB < 100 {
		scores["page_size"] = 9
	}

	// Traffic Volume (4 points if all data is N/A)
	if assessment.TrafficVolume.GlobalRank == "N/A" &&
		assessment.TrafficVolume.MonthlyVisits == "N/A" {
		scores["traffic_vol_missing"] = 4
	}

	// Popups and Ads (7 points for popups, 4 for ads)
	if assessment.PopupAndAds.HasPopups {
		scores["popups"] = 7
	}
	if assessment.PopupAndAds.HasAds {
		scores["ads"] = 4
	}

	// Geopolitical Risk (10 points)
	if assessment.IsRiskyGeopolitical.IsRisky {
		scores["risky_geography"] = 10
	}

	// Calculate total risk score
	totalScore := 0
	for _, score := range scores {
		totalScore += score
	}

	return totalScore, scores
}

// CategorizeRisk assigns a risk category based on the score
func CategorizeRisk(score int) string {
	for category, bounds := range RiskCategories {
		if score >= bounds[0] && score < bounds[1] {
			return category
		}
	}
	return "high_risk"
}

// AssessRisk performs the complete risk assessment
func AssessRisk(assessment *RiskAssessment) {
	// Calculate risk score and individual parameter scores
	riskScore, scores := CalculateRiskScore(assessment)
	riskCategory := CategorizeRisk(riskScore)

	// Update assessment with risk data
	assessment.RiskScore = riskScore
	assessment.RiskCategory = riskCategory
	assessment.RiskBreakdown = scores
	assessment.CreatedAt = time.Now()
}

// GetMerchantBusinessDetails creates merchant business details
func GetMerchantBusinessDetails(countryCode string) MerchantBusiness {
	return MerchantBusiness{
		CountryCode:      countryCode,
		CountrySupported: IsCountrySupported(countryCode),
	}
}

// CheckMCC creates MCC details using the OpenAI-based MCC classifier
func CheckMCC(domain string) MCCDetails {
	// Use the new MCC classifier
	classifier := mcc.NewMCCClassifier()
	result := classifier.ClassifyMCC(domain)

	// Handle any errors from the classifier
	if result.Error != "" {
		// Fall back to keyword-based classification if OpenAI fails
		return fallbackMCCClassification(domain)
	}

	return MCCDetails{
		MCCCode:       result.MCCCode,
		MCCCategory:   result.Description,
		MCCRestricted: result.MCCRestricted,
	}
}

// fallbackMCCClassification provides a simple keyword-based fallback
func fallbackMCCClassification(domain string) MCCDetails {
	domainLower := strings.ToLower(domain)

	// Simple keyword-based classification
	if strings.Contains(domainLower, "bank") || strings.Contains(domainLower, "financial") {
		return MCCDetails{
			MCCCode:       "6012",
			MCCCategory:   "Financial Services",
			MCCRestricted: true,
		}
	}

	if strings.Contains(domainLower, "casino") || strings.Contains(domainLower, "gambling") || strings.Contains(domainLower, "bet") {
		return MCCDetails{
			MCCCode:       "7995",
			MCCCategory:   "Gambling",
			MCCRestricted: true,
		}
	}

	if strings.Contains(domainLower, "crypto") || strings.Contains(domainLower, "bitcoin") || strings.Contains(domainLower, "blockchain") {
		return MCCDetails{
			MCCCode:       "6051",
			MCCCategory:   "Cryptocurrency",
			MCCRestricted: true,
		}
	}

	if strings.Contains(domainLower, "shop") || strings.Contains(domainLower, "store") || strings.Contains(domainLower, "ecommerce") {
		return MCCDetails{
			MCCCode:       "5999",
			MCCCategory:   "E-commerce",
			MCCRestricted: false,
		}
	}

	if strings.Contains(domainLower, "restaurant") || strings.Contains(domainLower, "food") || strings.Contains(domainLower, "cafe") {
		return MCCDetails{
			MCCCode:       "5812",
			MCCCategory:   "Food & Beverage",
			MCCRestricted: false,
		}
	}

	if strings.Contains(domainLower, "hotel") || strings.Contains(domainLower, "travel") || strings.Contains(domainLower, "booking") {
		return MCCDetails{
			MCCCode:       "7011",
			MCCCategory:   "Travel & Hospitality",
			MCCRestricted: true,
		}
	}

	if strings.Contains(domainLower, "health") || strings.Contains(domainLower, "medical") || strings.Contains(domainLower, "pharmacy") {
		return MCCDetails{
			MCCCode:       "8011",
			MCCCategory:   "Healthcare",
			MCCRestricted: true,
		}
	}

	// Default classification
	return MCCDetails{
		MCCCode:       "7399",
		MCCCategory:   "Business Services",
		MCCRestricted: true, // Default to restricted for manual review
	}
}

// RunScraper runs a scraper function with error handling and timing
func RunScraper(scraperName string, scraperFunc func() interface{}) ScraperResult {
	startTime := time.Now()

	defer func() {
		if r := recover(); r != nil {
			// Log panic but don't crash
		}
	}()

	result := scraperFunc()

	return ScraperResult{
		Success: true,
		Data:    result,
		Timing:  time.Since(startTime),
	}
}

// ExtractIPFromURLVoid extracts IP address from URLVoid result for further processing
func ExtractIPFromURLVoid(urlvoidResult URLVoidResult) string {
	if urlvoidResult.IPAddress != "" {
		// Clean up IP address (remove any extra text)
		parts := strings.Fields(urlvoidResult.IPAddress)
		if len(parts) > 0 {
			return parts[0]
		}
	}
	return ""
}

// CheckGeopoliticalRisk checks if a country code is risky
func CheckGeopoliticalRisk(countryCode string) GeopoliticalRisk {
	// Extract country code from potential formats like "US (United States)"
	if strings.Contains(countryCode, "(") {
		parts := strings.Split(countryCode, " ")
		if len(parts) > 0 {
			countryCode = strings.Trim(parts[0], "()")
		}
	}

	return GeopoliticalRisk{
		IsRisky: IsRiskyCountry(countryCode),
	}
}

// ConvertToJSON converts assessment to JSON string
func (assessment *RiskAssessment) ToJSON() (string, error) {
	jsonData, err := json.MarshalIndent(assessment, "", "  ")
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

// FromJSON creates assessment from JSON string
func FromJSON(jsonStr string) (*RiskAssessment, error) {
	var assessment RiskAssessment
	err := json.Unmarshal([]byte(jsonStr), &assessment)
	if err != nil {
		return nil, err
	}
	return &assessment, nil
}

// GetRiskLevel returns a human-readable risk level
func GetRiskLevel(score int) string {
	category := CategorizeRisk(score)
	switch category {
	case "low_risk":
		return "Low Risk"
	case "med_risk":
		return "Medium Risk"
	case "high_risk":
		return "High Risk"
	default:
		return "Unknown Risk"
	}
}

// GetRiskColor returns a color code for the risk level
func GetRiskColor(score int) string {
	category := CategorizeRisk(score)
	switch category {
	case "low_risk":
		return "#28a745" // Green
	case "med_risk":
		return "#ffc107" // Yellow
	case "high_risk":
		return "#dc3545" // Red
	default:
		return "#6c757d" // Gray
	}
}

// GetComplianceStatus returns compliance status based on assessment
func GetComplianceStatus(assessment *RiskAssessment) map[string]bool {
	return map[string]bool{
		"https_compliant":         assessment.HTTPSCheck.HasHTTPS,
		"ssl_compliant":           assessment.SSLSha256Fingerprint.HasSHA256,
		"privacy_compliant":       assessment.PrivacyAndTerms.PrivacyPolicyPresent,
		"terms_compliant":         assessment.PrivacyAndTerms.TermsOfServicePresent,
		"accessibility_compliant": assessment.PrivacyAndTerms.IsAccessible,
		"security_compliant":      assessment.URLVoid.DetectionsCounts.Detected == 0 && assessment.IPVoid.DetectionsCount.Detected == 0,
		"geopolitical_compliant":  !assessment.IsRiskyGeopolitical.IsRisky,
		"mcc_compliant":           !assessment.MCCDetails.MCCRestricted,
		"overall_compliant":       assessment.RiskScore < 45,
	}
}

// GetFailedComplianceItems returns list of failed compliance items
func GetFailedComplianceItems(assessment *RiskAssessment) []string {
	var failed []string

	if !assessment.HTTPSCheck.HasHTTPS {
		failed = append(failed, "HTTPS not enabled")
	}

	if !assessment.SSLSha256Fingerprint.HasSHA256 {
		failed = append(failed, "Invalid SSL certificate")
	}

	if !assessment.PrivacyAndTerms.PrivacyPolicyPresent {
		failed = append(failed, "Privacy policy missing")
	}

	if !assessment.PrivacyAndTerms.TermsOfServicePresent {
		failed = append(failed, "Terms of service missing")
	}

	if !assessment.PrivacyAndTerms.IsAccessible {
		failed = append(failed, "Website not accessible")
	}

	if assessment.URLVoid.DetectionsCounts.Detected > 0 {
		failed = append(failed, "Security threats detected")
	}

	if assessment.IPVoid.DetectionsCount.Detected > 0 {
		failed = append(failed, "IP reputation issues")
	}

	if assessment.IsRiskyGeopolitical.IsRisky {
		failed = append(failed, "Geopolitical risk")
	}

	if assessment.MCCDetails.MCCRestricted {
		failed = append(failed, "Restricted MCC category")
	}

	return failed
}

// GetAssessmentMetrics returns key metrics from the assessment
func GetAssessmentMetrics(assessment *RiskAssessment) map[string]interface{} {
	return map[string]interface{}{
		"overall_score":          assessment.RiskScore,
		"risk_category":          assessment.RiskCategory,
		"compliance_rate":        calculateComplianceRate(assessment),
		"security_score":         calculateSecurityScore(assessment),
		"legal_compliance_score": calculateLegalComplianceScore(assessment),
		"technical_score":        calculateTechnicalScore(assessment),
		"business_score":         calculateBusinessScore(assessment),
	}
}

// calculateComplianceRate calculates overall compliance rate
func calculateComplianceRate(assessment *RiskAssessment) float64 {
	totalChecks := 9 // Total number of compliance checks
	passed := 0

	compliance := GetComplianceStatus(assessment)
	for _, status := range compliance {
		if status {
			passed++
		}
	}

	return float64(passed) / float64(totalChecks) * 100
}

// calculateSecurityScore calculates security-specific score
func calculateSecurityScore(assessment *RiskAssessment) int {
	securityScore := 0

	if !assessment.HTTPSCheck.HasHTTPS {
		securityScore += 25
	}

	if !assessment.SSLSha256Fingerprint.HasSHA256 {
		securityScore += 25
	}

	if assessment.URLVoid.DetectionsCounts.Detected > 0 {
		securityScore += 25
	}

	if assessment.IPVoid.DetectionsCount.Detected > 0 {
		securityScore += 25
	}

	return securityScore
}

// calculateLegalComplianceScore calculates legal compliance score
func calculateLegalComplianceScore(assessment *RiskAssessment) int {
	legalScore := 0

	if !assessment.PrivacyAndTerms.PrivacyPolicyPresent {
		legalScore += 33
	}

	if !assessment.PrivacyAndTerms.TermsOfServicePresent {
		legalScore += 33
	}

	if assessment.MCCDetails.MCCRestricted {
		legalScore += 34
	}

	return legalScore
}

// calculateTechnicalScore calculates technical compliance score
func calculateTechnicalScore(assessment *RiskAssessment) int {
	techScore := 0

	if !assessment.PrivacyAndTerms.IsAccessible {
		techScore += 25
	}

	if assessment.PageSize.PageSizeKB < 100 {
		techScore += 25
	}

	if assessment.PopupAndAds.HasPopups {
		techScore += 25
	}

	if assessment.Whois.CreationDate.IsZero() {
		techScore += 25
	}

	return techScore
}

// calculateBusinessScore calculates business-related score
func calculateBusinessScore(assessment *RiskAssessment) int {
	businessScore := 0

	if !assessment.SocialPresence.SocialPresence.LinkedIn.Presence {
		businessScore += 25
	}

	if assessment.IsRiskyGeopolitical.IsRisky {
		businessScore += 25
	}

	if assessment.TrafficVolume.GlobalRank == "N/A" {
		businessScore += 25
	}

	if assessment.PopupAndAds.HasAds {
		businessScore += 25
	}

	return businessScore
}
