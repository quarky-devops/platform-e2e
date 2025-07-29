package main

import (
	"fmt"
	"log"

	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/scrapers"
)

func main() {
	// Example usage of the website risk assessment system
	fmt.Println("=== QuarkFin Website Risk Assessment Demo ===")
	
	// Create orchestrator
	orchestrator := scrapers.NewWebsiteRiskAssessmentOrchestrator()
	
	// Test domain and country
	domain := "example.com"
	countryCode := "US"
	
	fmt.Printf("Running assessment for domain: %s\n", domain)
	fmt.Printf("Country code: %s\n", countryCode)
	fmt.Println("----------------------------------------")
	
	// Run assessment
	assessment, err := orchestrator.RunAssessment(domain, countryCode)
	if err != nil {
		log.Fatalf("Assessment failed: %v", err)
	}
	
	// Display results
	fmt.Printf("Assessment completed for: %s\n", assessment.DomainName)
	fmt.Printf("Risk Score: %d\n", assessment.RiskScore)
	fmt.Printf("Risk Category: %s\n", assessment.RiskCategory)
	fmt.Printf("Country Supported: %v\n", assessment.MerchantBusiness.CountrySupported)
	fmt.Printf("HTTPS Supported: %v\n", assessment.HTTPSCheck.HasHTTPS)
	fmt.Printf("SSL Valid: %v\n", assessment.SSLSha256Fingerprint.HasSHA256)
	fmt.Printf("Privacy Policy Present: %v\n", assessment.PrivacyAndTerms.PrivacyPolicyPresent)
	fmt.Printf("Terms of Service Present: %v\n", assessment.PrivacyAndTerms.TermsOfServicePresent)
	fmt.Printf("LinkedIn Presence: %v\n", assessment.SocialPresence.SocialPresence.LinkedIn.Presence)
	fmt.Printf("Geopolitical Risk: %v\n", assessment.IsRiskyGeopolitical.IsRisky)
	
	// Display risk breakdown
	fmt.Println("\nRisk Breakdown:")
	for component, score := range assessment.RiskBreakdown {
		fmt.Printf("  %s: %d points\n", component, score)
	}
	
	// Get recommendations
	recommendations := orchestrator.GetRecommendations(assessment)
	fmt.Println("\nRecommendations:")
	for i, rec := range recommendations {
		fmt.Printf("  %d. %s\n", i+1, rec)
	}
	
	// Get summary
	summary := orchestrator.GetAssessmentSummary(assessment)
	fmt.Println("\nSummary:")
	for key, value := range summary {
		fmt.Printf("  %s: %v\n", key, value)
	}
	
	// Convert to JSON
	jsonResult, err := assessment.ToJSON()
	if err != nil {
		log.Printf("Failed to convert to JSON: %v", err)
	} else {
		fmt.Println("\nJSON Output (first 500 chars):")
		if len(jsonResult) > 500 {
			fmt.Printf("%s...\n", jsonResult[:500])
		} else {
			fmt.Println(jsonResult)
		}
	}
}
