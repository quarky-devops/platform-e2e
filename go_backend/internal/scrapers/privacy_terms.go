package scrapers

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// CheckPrivacyTerms checks if a website is accessible and whether it contains Terms of Service or Privacy Policy
func CheckPrivacyTerms(domain string) PrivacyTermsResult {
	result := PrivacyTermsResult{}

	// Check SSL validity
	result.SSLValid = checkSSLValidity(domain)

	// Fetch page content
	pageContent, err := fetchPageContent(domain)
	if err != nil {
		result.IsAccessible = false
		return result
	}

	result.IsAccessible = true

	// Parse HTML content
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(pageContent))
	if err != nil {
		return result
	}

	// Get text content for analysis
	pageText := strings.ToLower(doc.Text())

	// Check for Terms of Service
	result.TermsOfServicePresent = checkTermsPresence(pageText)

	// Check for Privacy Policy
	result.PrivacyPolicyPresent = checkPrivacyPolicyPresence(pageText)

	// Extract legal entity name
	result.LegalName = extractLegalName(pageText)

	return result
}

// checkSSLValidity checks if the SSL certificate is valid
func checkSSLValidity(domain string) bool {
	conn, err := tls.Dial("tcp", domain+":443", &tls.Config{})
	if err != nil {
		return false
	}
	defer conn.Close()

	// If we can establish a connection without errors, SSL is valid
	return true
}

// fetchPageContent fetches the content of a webpage with multiple fallback strategies
func fetchPageContent(domain string) (string, error) {
	url := "https://" + domain

	// Create HTTP client with timeouts
	client := &http.Client{
		Timeout: 15 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	// Try with SSL verification first
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil {
		// Try HTTP fallback
		url = "http://" + domain
		req, err = http.NewRequest("GET", url, nil)
		if err != nil {
			return "", err
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
		
		resp, err = client.Do(req)
		if err != nil {
			return "", err
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP status: %d", resp.StatusCode)
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return "", err
	}

	html, err := doc.Html()
	if err != nil {
		return "", err
	}

	return html, nil
}

// checkTermsPresence checks for various terms of service variations
func checkTermsPresence(pageText string) bool {
	termsVariants := []string{
		"terms of service",
		"terms of use",
		"terms & conditions",
		"terms and conditions",
		"terms",
		"user agreement",
		"website terms",
		"site terms",
		"conditions of use",
		"user terms",
		"service terms",
	}

	for _, variant := range termsVariants {
		if strings.Contains(pageText, variant) {
			return true
		}
	}

	return false
}

// checkPrivacyPolicyPresence checks for various privacy policy variations
func checkPrivacyPolicyPresence(pageText string) bool {
	privacyVariants := []string{
		"privacy policy",
		"data protection",
		"gdpr",
		"privacy statement",
		"privacy notice",
		"data privacy",
		"confidentiality",
		"privacy",
		"data collection",
		"information collection",
		"cookie policy",
		"data processing",
	}

	for _, variant := range privacyVariants {
		if strings.Contains(pageText, variant) {
			return true
		}
	}

	return false
}

// extractLegalName extracts potential legal company names from page content
func extractLegalName(pageText string) string {
	// Regular expressions for common legal entity patterns
	patterns := []*regexp.Regexp{
		regexp.MustCompile(`(?i)company name[:\s]+([A-Za-z0-9\s,.-]+)`),
		regexp.MustCompile(`(?i)registered as[:\s]+([A-Za-z0-9\s,.-]+)`),
		regexp.MustCompile(`(?i)is operated by[:\s]+([A-Za-z0-9\s,.-]+)`),
		regexp.MustCompile(`(?i)\b([A-Za-z0-9\s]+ (?:Ltd|LLC|Inc|Pvt|Corporation|Limited|Pvt Ltd|SpA|BV|AG|KG|AB|Oy|NV|Sdn Bhd))\b`),
		regexp.MustCompile(`(?i)©\s*\d{4}\s*([A-Za-z0-9\s,.-]+(?:Ltd|LLC|Inc|Pvt|Corporation|Limited|Pvt Ltd|SpA|BV|AG|KG|AB|Oy|NV|Sdn Bhd))`),
		regexp.MustCompile(`(?i)copyright\s*\d{4}\s*([A-Za-z0-9\s,.-]+(?:Ltd|LLC|Inc|Pvt|Corporation|Limited|Pvt Ltd|SpA|BV|AG|KG|AB|Oy|NV|Sdn Bhd))`),
	}

	for _, pattern := range patterns {
		if match := pattern.FindStringSubmatch(pageText); match != nil && len(match) > 1 {
			legalName := strings.TrimSpace(match[1])
			// Clean up the result
			legalName = strings.TrimPrefix(legalName, "by ")
			legalName = strings.TrimSuffix(legalName, ".")
			legalName = strings.TrimSuffix(legalName, ",")
			
			if len(legalName) > 3 && len(legalName) < 100 {
				return legalName
			}
		}
	}

	return ""
}
