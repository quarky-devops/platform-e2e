package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/scrapers"
)

func main() {
	fmt.Println("=== QuarkFin Website Risk Assessment - Comprehensive Examples ===")
	fmt.Println()

	// Example 1: Basic risk assessment
	fmt.Println("1. Basic Risk Assessment")
	fmt.Println("========================")
	runBasicAssessment()

	fmt.Println("\n" + strings.Repeat("=", 80) + "\n")

	// Example 2: Multiple domain comparison
	fmt.Println("2. Multiple Domain Comparison")
	fmt.Println("=============================")
	runMultipleDomainComparison()

	fmt.Println("\n" + strings.Repeat("=", 80) + "\n")

	// Example 3: Detailed analysis
	fmt.Println("3. Detailed Analysis")
	fmt.Println("====================")
	runDetailedAnalysis()

	fmt.Println("\n" + strings.Repeat("=", 80) + "\n")

	// Example 4: Export results
	fmt.Println("4. Export Results")
	fmt.Println("=================")
	runExportExample()

	fmt.Println("\n" + strings.Repeat("=", 80) + "\n")

	// Example 5: Country and MCC restrictions
	fmt.Println("5. Country and MCC Restrictions")
	fmt.Println("===============================")
	runCountryMCCExample()
}

func runBasicAssessment() {
	orchestrator := scrapers.NewWebsiteRiskAssessmentOrchestrator()
	
	domain := "example.com"
	countryCode := "US"
	
	fmt.Printf("Assessing: %s (Country: %s)\n", domain, countryCode)
	
	assessment, err := orchestrator.RunAssessment(domain, countryCode)
	if err != nil {
		log.Printf("Assessment failed: %v", err)
		return
	}
	
	fmt.Printf("✅ Assessment completed in %.2f seconds\n", time.Since(assessment.CreatedAt).Seconds())
	fmt.Printf("📊 Risk Score: %d/100\n", assessment.RiskScore)
	fmt.Printf("📈 Risk Category: %s\n", assessment.RiskCategory)
	fmt.Printf("🌍 Country Supported: %v\n", assessment.MerchantBusiness.CountrySupported)
	fmt.Printf("🏷️  MCC Code: %s (%s)\n", assessment.MCCDetails.MCCCode, assessment.MCCDetails.MCCCategory)
	fmt.Printf("🔒 HTTPS: %v\n", assessment.HTTPSCheck.HasHTTPS)
	fmt.Printf("🛡️  SSL Valid: %v\n", assessment.SSLSha256Fingerprint.HasSHA256)
	
	fmt.Println("\n📋 Risk Breakdown:")
	for component, score := range assessment.RiskBreakdown {
		if score > 0 {
			fmt.Printf("   • %s: %d points\n", component, score)
		}
	}
	
	fmt.Println("\n💡 Top Recommendations:")
	recommendations := orchestrator.GetRecommendations(assessment)
	for i, rec := range recommendations {
		if i >= 3 { // Show only top 3
			break
		}
		fmt.Printf("   %d. %s\n", i+1, rec)
	}
}

func runMultipleDomainComparison() {
	orchestrator := scrapers.NewWebsiteRiskAssessmentOrchestrator()
	
	domains := []string{
		"google.com",
		"github.com",
		"example.com",
		"stackoverflow.com",
	}
	
	fmt.Printf("Comparing %d domains...\n\n", len(domains))
	
	results := make(map[string]*scrapers.RiskAssessment)
	
	for _, domain := range domains {
		fmt.Printf("Assessing %s...", domain)
		assessment, err := orchestrator.RunAssessment(domain, "US")
		if err != nil {
			fmt.Printf(" ❌ Failed: %v\n", err)
			continue
		}
		results[domain] = assessment
		fmt.Printf(" ✅ Score: %d (%s)\n", assessment.RiskScore, assessment.RiskCategory)
	}
	
	fmt.Println("\n📊 Comparison Summary:")
	fmt.Printf("%-20s | %-5s | %-10s | %-6s | %-4s | %-8s\n", 
		"Domain", "Score", "Category", "HTTPS", "SSL", "Privacy")
	fmt.Println(strings.Repeat("-", 70))
	
	for domain, assessment := range results {
		privacyStatus := "❌"
		if assessment.PrivacyAndTerms.PrivacyPolicyPresent {
			privacyStatus = "✅"
		}
		
		httpsStatus := "❌"
		if assessment.HTTPSCheck.HasHTTPS {
			httpsStatus = "✅"
		}
		
		sslStatus := "❌"
		if assessment.SSLSha256Fingerprint.HasSHA256 {
			sslStatus = "✅"
		}
		
		fmt.Printf("%-20s | %-5d | %-10s | %-6s | %-4s | %-8s\n",
			domain, assessment.RiskScore, assessment.RiskCategory,
			httpsStatus, sslStatus, privacyStatus)
	}
	
	// Find best and worst
	var bestDomain, worstDomain string
	var bestScore, worstScore int = 101, -1
	
	for domain, assessment := range results {
		if assessment.RiskScore < bestScore {
			bestScore = assessment.RiskScore
			bestDomain = domain
		}
		if assessment.RiskScore > worstScore {
			worstScore = assessment.RiskScore
			worstDomain = domain
		}
	}
	
	fmt.Printf("\n🏆 Best: %s (Score: %d)\n", bestDomain, bestScore)
	fmt.Printf("⚠️  Worst: %s (Score: %d)\n", worstDomain, worstScore)
}

func runDetailedAnalysis() {
	orchestrator := scrapers.NewWebsiteRiskAssessmentOrchestrator()
	
	domain := "github.com"
	countryCode := "US"
	
	fmt.Printf("Detailed analysis for: %s\n", domain)
	
	assessment, err := orchestrator.RunAssessment(domain, countryCode)
	if err != nil {
		log.Printf("Assessment failed: %v", err)
		return
	}
	
	// Technical Analysis
	fmt.Println("\n🔧 Technical Analysis:")
	fmt.Printf("   • Website Accessible: %v\n", assessment.PrivacyAndTerms.IsAccessible)
	fmt.Printf("   • Page Title: %s\n", assessment.HTTPSCheck.PageTitle)
	fmt.Printf("   • Page Size: %d KB\n", assessment.PageSize.PageSizeKB)
	fmt.Printf("   • Load Time: %s\n", assessment.PageSize.LoadTime)
	fmt.Printf("   • Has Popups: %v\n", assessment.PopupAndAds.HasPopups)
	fmt.Printf("   • Has Ads: %v\n", assessment.PopupAndAds.HasAds)
	
	// Security Analysis
	fmt.Println("\n🔒 Security Analysis:")
	fmt.Printf("   • SSL Certificate: %v\n", assessment.SSLSha256Fingerprint.HasSHA256)
	if assessment.SSLSha256Fingerprint.SHA256Fingerprint != "" {
		fmt.Printf("   • SSL Fingerprint: %s\n", assessment.SSLSha256Fingerprint.SHA256Fingerprint[:32]+"...")
	}
	fmt.Printf("   • URLVoid Detections: %d/%d\n", 
		assessment.URLVoid.DetectionsCounts.Detected, assessment.URLVoid.DetectionsCounts.Checks)
	fmt.Printf("   • IPVoid Detections: %d/%d\n", 
		assessment.IPVoid.DetectionsCount.Detected, assessment.IPVoid.DetectionsCount.Checks)
	
	// Legal Compliance
	fmt.Println("\n⚖️  Legal Compliance:")
	fmt.Printf("   • Privacy Policy: %v\n", assessment.PrivacyAndTerms.PrivacyPolicyPresent)
	fmt.Printf("   • Terms of Service: %v\n", assessment.PrivacyAndTerms.TermsOfServicePresent)
	fmt.Printf("   • Legal Entity: %s\n", assessment.PrivacyAndTerms.LegalName)
	fmt.Printf("   • MCC Restricted: %v\n", assessment.MCCDetails.MCCRestricted)
	
	// Business Intelligence
	fmt.Println("\n📈 Business Intelligence:")
	fmt.Printf("   • LinkedIn Presence: %v\n", assessment.SocialPresence.SocialPresence.LinkedIn.Presence)
	if assessment.SocialPresence.SocialPresence.LinkedIn.URL != "" {
		fmt.Printf("   • LinkedIn URL: %s\n", assessment.SocialPresence.SocialPresence.LinkedIn.URL)
	}
	fmt.Printf("   • Domain Registrar: %s\n", assessment.Whois.Registrar)
	if !assessment.Whois.CreationDate.IsZero() {
		fmt.Printf("   • Domain Age: %s\n", time.Since(assessment.Whois.CreationDate).String())
	}
	
	// Infrastructure
	fmt.Println("\n🏗️  Infrastructure:")
	fmt.Printf("   • IP Address: %s\n", assessment.URLVoid.IPAddress)
	fmt.Printf("   • Server Location: %s\n", assessment.URLVoid.ServerLocation)
	fmt.Printf("   • ASN: %s\n", assessment.URLVoid.ASN)
	fmt.Printf("   • ISP: %s\n", assessment.IPVoid.ISP)
	
	// Metrics
	fmt.Println("\n📊 Detailed Metrics:")
	metrics := scrapers.GetAssessmentMetrics(assessment)
	fmt.Printf("   • Overall Score: %v/100\n", metrics["overall_score"])
	fmt.Printf("   • Compliance Rate: %.1f%%\n", metrics["compliance_rate"])
	fmt.Printf("   • Security Score: %v/100\n", metrics["security_score"])
	fmt.Printf("   • Legal Score: %v/100\n", metrics["legal_compliance_score"])
	fmt.Printf("   • Technical Score: %v/100\n", metrics["technical_score"])
	fmt.Printf("   • Business Score: %v/100\n", metrics["business_score"])
	
	// Failed compliance items
	failed := scrapers.GetFailedComplianceItems(assessment)
	if len(failed) > 0 {
		fmt.Println("\n❌ Failed Compliance Items:")
		for _, item := range failed {
			fmt.Printf("   • %s\n", item)
		}
	}
	
	// All recommendations
	fmt.Println("\n💡 All Recommendations:")
	recommendations := orchestrator.GetRecommendations(assessment)
	for i, rec := range recommendations {
		fmt.Printf("   %d. %s\n", i+1, rec)
	}
}

func runExportExample() {
	orchestrator := scrapers.NewWebsiteRiskAssessmentOrchestrator()
	
	domain := "example.com"
	assessment, err := orchestrator.RunAssessment(domain, "US")
	if err != nil {
		log.Printf("Assessment failed: %v", err)
		return
	}
	
	// Export to JSON
	jsonData, err := assessment.ToJSON()
	if err != nil {
		log.Printf("JSON export failed: %v", err)
		return
	}
	
	filename := fmt.Sprintf("risk_assessment_%s_%s.json", domain, time.Now().Format("20060102_150405"))
	err = os.WriteFile(filename, []byte(jsonData), 0644)
	if err != nil {
		log.Printf("File write failed: %v", err)
		return
	}
	
	fmt.Printf("✅ Assessment exported to: %s\n", filename)
	
	// Export summary to CSV-like format
	summary := orchestrator.GetAssessmentSummary(assessment)
	summaryFilename := fmt.Sprintf("risk_summary_%s_%s.txt", domain, time.Now().Format("20060102_150405"))
	
	var summaryContent strings.Builder
	summaryContent.WriteString("Risk Assessment Summary\n")
	summaryContent.WriteString("========================\n\n")
	
	for key, value := range summary {
		summaryContent.WriteString(fmt.Sprintf("%-20s: %v\n", key, value))
	}
	
	err = os.WriteFile(summaryFilename, []byte(summaryContent.String()), 0644)
	if err != nil {
		log.Printf("Summary file write failed: %v", err)
		return
	}
	
	fmt.Printf("✅ Summary exported to: %s\n", summaryFilename)
	
	// Show file sizes
	if jsonInfo, err := os.Stat(filename); err == nil {
		fmt.Printf("📄 JSON file size: %d bytes\n", jsonInfo.Size())
	}
	
	if summaryInfo, err := os.Stat(summaryFilename); err == nil {
		fmt.Printf("📄 Summary file size: %d bytes\n", summaryInfo.Size())
	}
	
	// Demonstrate loading from JSON
	fmt.Println("\n🔄 Demonstrating JSON import...")
	loadedAssessment, err := scrapers.FromJSON(jsonData)
	if err != nil {
		log.Printf("JSON import failed: %v", err)
		return
	}
	
	fmt.Printf("✅ Successfully loaded assessment for: %s\n", loadedAssessment.DomainName)
	fmt.Printf("📊 Loaded risk score: %d\n", loadedAssessment.RiskScore)
}

func runCountryMCCExample() {
	orchestrator := scrapers.NewWebsiteRiskAssessmentOrchestrator()
	
	// Test various country codes
	testCases := []struct {
		domain      string
		countryCode string
		description string
	}{
		{"example.com", "US", "US (Supported)"},
		{"example.com", "DE", "Germany (Supported)"},
		{"example.com", "RU", "Russia (Risky)"},
		{"example.com", "XX", "Unknown (Not Supported)"},
		{"casino.com", "US", "Gambling Site"},
		{"bank.com", "US", "Financial Services"},
		{"crypto.com", "US", "Cryptocurrency"},
		{"shop.com", "US", "E-commerce"},
	}
	
	fmt.Printf("Testing %d scenarios...\n\n", len(testCases))
	
	for i, testCase := range testCases {
		fmt.Printf("%d. %s - %s\n", i+1, testCase.domain, testCase.description)
		
		assessment, err := orchestrator.RunAssessment(testCase.domain, testCase.countryCode)
		if err != nil {
			fmt.Printf("   ❌ Failed: %v\n\n", err)
			continue
		}
		
		fmt.Printf("   🌍 Country: %s (Supported: %v)\n", 
			assessment.MerchantBusiness.CountryCode, assessment.MerchantBusiness.CountrySupported)
		fmt.Printf("   🏷️  MCC: %s - %s (Restricted: %v)\n", 
			assessment.MCCDetails.MCCCode, assessment.MCCDetails.MCCCategory, assessment.MCCDetails.MCCRestricted)
		fmt.Printf("   ⚠️  Geopolitical Risk: %v\n", assessment.IsRiskyGeopolitical.IsRisky)
		fmt.Printf("   📊 Risk Score: %d (%s)\n", assessment.RiskScore, assessment.RiskCategory)
		
		// Decision logic
		if !assessment.MerchantBusiness.CountrySupported {
			fmt.Printf("   🔴 DECISION: Cannot onboard - Country not supported\n")
		} else if assessment.MCCDetails.MCCRestricted {
			fmt.Printf("   🟡 DECISION: Manual review required - Restricted MCC\n")
		} else if assessment.RiskScore >= 81 {
			fmt.Printf("   🔴 DECISION: Reject - High risk\n")
		} else if assessment.RiskScore >= 45 {
			fmt.Printf("   🟡 DECISION: Manual review - Medium risk\n")
		} else {
			fmt.Printf("   🟢 DECISION: Auto-approve - Low risk\n")
		}
		
		fmt.Println()
	}
	
	// Summary of all countries and MCC codes
	fmt.Println("📋 Reference Information:")
	fmt.Println("\n🌍 Supported Countries:")
	for _, country := range scrapers.OnboardingSupportedCountries {
		fmt.Printf("   • %s\n", country)
	}
	
	fmt.Println("\n⚠️  Risky Countries:")
	for _, country := range scrapers.RiskyCountries {
		fmt.Printf("   • %s\n", country)
	}
	
	fmt.Println("\n🏷️  Sample Restricted MCC Codes:")
	restrictedSample := scrapers.RestrictedMCCCodes[:10] // Show first 10
	for _, mcc := range restrictedSample {
		fmt.Printf("   • %s\n", mcc)
	}
	fmt.Printf("   ... and %d more\n", len(scrapers.RestrictedMCCCodes)-10)
}
