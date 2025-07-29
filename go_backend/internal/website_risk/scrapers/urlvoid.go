package scrapers

import (
	"fmt"
	"net"
	"time"

	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/scrapers"
)

// URLVoidChecker checks URLVoid for domain reputation
type URLVoidChecker struct {
	apiKey string
}

// NewURLVoidChecker creates a new URLVoid checker
func NewURLVoidChecker(apiKey string) *URLVoidChecker {
	return &URLVoidChecker{
		apiKey: apiKey,
	}
}

// Check performs URLVoid reputation check
func (u *URLVoidChecker) Check(domain string) scrapers.URLVoidResult {
	domain = cleanDomain(domain)

	result := scrapers.URLVoidResult{
		WebsiteAddress: domain,
		LastAnalysis:   time.Now().Format("2006-01-02"),
	}

	// Get IP address for the domain
	ips, err := net.LookupIP(domain)
	if err == nil && len(ips) > 0 {
		result.IPAddress = ips[0].String()

		// Get reverse DNS
		names, _ := net.LookupAddr(result.IPAddress)
		if len(names) > 0 {
			result.ReverseDNS = names[0]
		}
	}

	// Note: Real implementation would use URLVoid API
	// This is a mock implementation

	// Simulate detection results
	result.DetectionsCounts = scrapers.DetectionsCounts{
		Detected: 0,
		Checks:   30,
	}

	// Get WHOIS info for registration date
	whoisChecker := NewWhoisChecker()
	whoisResult := whoisChecker.Check(domain)
	if !whoisResult.CreationDate.IsZero() {
		result.RegisteredOn = whoisResult.CreationDate.Format("2006-01-02")

		// Calculate how long registered
		duration := time.Since(whoisResult.CreationDate)
		years := int(duration.Hours() / 24 / 365)
		months := int((duration.Hours() / 24 / 30)) % 12

		if years > 0 {
			result.RegisteredSince = fmt.Sprintf("%d years, %d months", years, months)
		} else {
			result.RegisteredSince = fmt.Sprintf("%d months", months)
		}
	}

	// Get ASN info
	if result.IPAddress != "" {
		// In real implementation, would query ASN database
		result.ASN = "AS15169 Google LLC" // Example
		result.ServerLocation = "United States"
		result.City = "Mountain View"
		result.Region = "California"
		result.LatitudeLongitude = "37.4056,-122.0775"
	}

	return result
}
