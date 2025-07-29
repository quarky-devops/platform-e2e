package scrapers

import (
	"net"

	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/scrapers"
)

// IPVoidChecker checks IPVoid for IP reputation
type IPVoidChecker struct {
	apiKey string
}

// NewIPVoidChecker creates a new IPVoid checker
func NewIPVoidChecker(apiKey string) *IPVoidChecker {
	return &IPVoidChecker{
		apiKey: apiKey,
	}
}

// Check performs IPVoid reputation check
func (i *IPVoidChecker) Check(ipAddress string) scrapers.IPVoidResult {
	result := scrapers.IPVoidResult{
		IPAddress: ipAddress,
	}

	// Get IP info
	ip := net.ParseIP(ipAddress)
	if ip == nil {
		result.Error = "Invalid IP address"
		return result
	}

	// Get reverse DNS
	names, err := net.LookupAddr(ipAddress)
	if err == nil && len(names) > 0 {
		result.ReverseHostname = names[0]
	}

	// Mock implementation for now
	result.CountryName = "United States"
	result.CountryCode = "US"
	result.ISP = "Example ISP"
	result.ASN = "AS15169"

	// Simulate detection results
	result.DetectionsCount = scrapers.DetectionsCounts{
		Detected: 0,
		Checks:   30,
	}

	// Check if risky country
	if scrapers.IsRiskyCountry(result.CountryCode) {
		// Add to blacklist status
		result.BlacklistStatus = map[string]string{
			"geopolitical_risk": "high",
		}
	}

	return result
}
