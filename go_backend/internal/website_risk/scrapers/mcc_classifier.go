package scrapers

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// MCCClassifier classifies merchant category codes
type MCCClassifier struct {
	mccMapping map[string]MCCInfo
}

// MCCInfo represents MCC code information
type MCCInfo struct {
	Code        string `json:"code"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

// MCCDetails represents MCC classification details
type MCCDetails struct {
	MCCCode                 string  `json:"mcc_code"`
	Description             string  `json:"description,omitempty"`
	MCCRestricted           bool    `json:"mcc_restricted"`
	Confidence              float64 `json:"confidence,omitempty"`
	ReasonOfConfidenceScore string  `json:"reason of confidence Score,omitempty"`
}

// NewMCCClassifier creates a new MCC classifier
func NewMCCClassifier() *MCCClassifier {
	classifier := &MCCClassifier{
		mccMapping: make(map[string]MCCInfo),
	}
	
	// Load default MCC mappings
	classifier.loadDefaultMappings()
	
	return classifier
}

// ClassifyDomain classifies a domain into an MCC category
func (m *MCCClassifier) ClassifyDomain(domain string) MCCDetails {
	domain = cleanDomain(domain)
	
	// For now, implement a simple rule-based classification
	// In production, this could use AI/ML or more sophisticated analysis
	
	// Check domain keywords
	domainLower := strings.ToLower(domain)
	
	// E-commerce patterns
	if strings.Contains(domainLower, "shop") || strings.Contains(domainLower, "store") ||
		strings.Contains(domainLower, "buy") || strings.Contains(domainLower, "mart") {
		return MCCDetails{
			MCCCode:                 "5999",
			Description:             "Miscellaneous and Specialty Retail Stores",
			MCCRestricted:           m.isRestricted("5999"),
			Confidence:              0.75,
			ReasonOfConfidenceScore: "Domain contains e-commerce related keywords",
		}
	}
	
	// Technology/Software
	if strings.Contains(domainLower, "tech") || strings.Contains(domainLower, "soft") ||
		strings.Contains(domainLower, "app") || strings.Contains(domainLower, "cloud") {
		return MCCDetails{
			MCCCode:                 "5734",
			Description:             "Computer Software Stores",
			MCCRestricted:           m.isRestricted("5734"),
			Confidence:              0.7,
			ReasonOfConfidenceScore: "Domain contains technology related keywords",
		}
	}
	
	// Finance
	if strings.Contains(domainLower, "pay") || strings.Contains(domainLower, "finance") ||
		strings.Contains(domainLower, "money") || strings.Contains(domainLower, "bank") {
		return MCCDetails{
			MCCCode:                 "6012",
			Description:             "Financial Institutions",
			MCCRestricted:           m.isRestricted("6012"),
			Confidence:              0.65,
			ReasonOfConfidenceScore: "Domain contains finance related keywords",
		}
	}
	
	// Travel
	if strings.Contains(domainLower, "travel") || strings.Contains(domainLower, "tour") ||
		strings.Contains(domainLower, "trip") || strings.Contains(domainLower, "hotel") {
		return MCCDetails{
			MCCCode:                 "4722",
			Description:             "Travel Agencies and Tour Operators",
			MCCRestricted:           m.isRestricted("4722"),
			Confidence:              0.7,
			ReasonOfConfidenceScore: "Domain contains travel related keywords",
		}
	}
	
	// Gaming/Entertainment
	if strings.Contains(domainLower, "game") || strings.Contains(domainLower, "play") ||
		strings.Contains(domainLower, "bet") || strings.Contains(domainLower, "casino") {
		return MCCDetails{
			MCCCode:                 "7995",
			Description:             "Betting, including Lottery Tickets, Casino Gaming Chips",
			MCCRestricted:           m.isRestricted("7995"),
			Confidence:              0.8,
			ReasonOfConfidenceScore: "Domain contains gaming/betting related keywords",
		}
	}
	
	// Health/Medical
	if strings.Contains(domainLower, "health") || strings.Contains(domainLower, "med") ||
		strings.Contains(domainLower, "pharma") || strings.Contains(domainLower, "doctor") {
		return MCCDetails{
			MCCCode:                 "5912",
			Description:             "Drug Stores and Pharmacies",
			MCCRestricted:           m.isRestricted("5912"),
			Confidence:              0.65,
			ReasonOfConfidenceScore: "Domain contains health/medical related keywords",
		}
	}
	
	// Food/Restaurant
	if strings.Contains(domainLower, "food") || strings.Contains(domainLower, "eat") ||
		strings.Contains(domainLower, "restaurant") || strings.Contains(domainLower, "delivery") {
		return MCCDetails{
			MCCCode:                 "5812",
			Description:             "Eating Places and Restaurants",
			MCCRestricted:           false,
			Confidence:              0.7,
			ReasonOfConfidenceScore: "Domain contains food service related keywords",
		}
	}
	
	// Education
	if strings.Contains(domainLower, "edu") || strings.Contains(domainLower, "learn") ||
		strings.Contains(domainLower, "school") || strings.Contains(domainLower, "academy") {
		return MCCDetails{
			MCCCode:                 "8299",
			Description:             "Educational Services",
			MCCRestricted:           m.isRestricted("8299"),
			Confidence:              0.65,
			ReasonOfConfidenceScore: "Domain contains education related keywords",
		}
	}
	
	// Default fallback
	return MCCDetails{
		MCCCode:                 "5999",
		Description:             "Miscellaneous and Specialty Retail Stores",
		MCCRestricted:           m.isRestricted("5999"),
		Confidence:              0.3,
		ReasonOfConfidenceScore: "Could not determine specific category from domain, using default retail classification",
	}
}

// isRestricted checks if an MCC code is restricted
func (m *MCCClassifier) isRestricted(mccCode string) bool {
	restrictedCodes := []string{
		"0742", "4411", "4511", "4722", "4812", "4814", "4816", "4829", "5047", "5094", "5099", "5499", "5699",
		"5734", "5912", "5921", "5933", "5966", "5968", "5969", "5971", "5993", "5995", "5999", "6012", "6051",
		"6211", "6282", "6300", "6531", "7011", "7273", "7276", "7297", "7299", "7322", "7372", "7375", "7389",
		"7393", "7399", "7512", "7841", "7994", "7995", "7996", "7999", "8011", "8099", "8299", "8398", "8399",
		"8651", "8999", "9223", "9399",
	}
	
	for _, restricted := range restrictedCodes {
		if restricted == mccCode {
			return true
		}
	}
	return false
}

// loadDefaultMappings loads default MCC mappings
func (m *MCCClassifier) loadDefaultMappings() {
	// Load from file if exists, otherwise use built-in mappings
	if data, err := os.ReadFile("mcc_mapping.json"); err == nil {
		json.Unmarshal(data, &m.mccMapping)
		return
	}
	
	// Built-in mappings
	m.mccMapping = map[string]MCCInfo{
		"5999": {Code: "5999", Description: "Miscellaneous and Specialty Retail Stores", Category: "Retail"},
		"5734": {Code: "5734", Description: "Computer Software Stores", Category: "Technology"},
		"6012": {Code: "6012", Description: "Financial Institutions", Category: "Finance"},
		"4722": {Code: "4722", Description: "Travel Agencies and Tour Operators", Category: "Travel"},
		"7995": {Code: "7995", Description: "Betting, including Lottery Tickets, Casino Gaming Chips", Category: "Gaming"},
		"5912": {Code: "5912", Description: "Drug Stores and Pharmacies", Category: "Health"},
		"5812": {Code: "5812", Description: "Eating Places and Restaurants", Category: "Food"},
		"8299": {Code: "8299", Description: "Educational Services", Category: "Education"},
		// Add more mappings as needed
	}
}

// ClassifyWithAI would use AI/ML for classification (placeholder for future implementation)
func (m *MCCClassifier) ClassifyWithAI(domain string, websiteContent string) (MCCDetails, error) {
	// This would integrate with OpenAI or other AI services
	// For now, return an error indicating it's not implemented
	return MCCDetails{}, fmt.Errorf("AI classification not implemented")
}