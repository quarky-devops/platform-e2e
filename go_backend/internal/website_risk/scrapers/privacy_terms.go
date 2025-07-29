package scrapers

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// PrivacyTermsChecker checks for privacy policy and terms of service
type PrivacyTermsChecker struct {
	client *http.Client
}

// NewPrivacyTermsChecker creates a new privacy terms checker
func NewPrivacyTermsChecker() *PrivacyTermsChecker {
	return &PrivacyTermsChecker{
		client: &http.Client{
			Timeout: 15 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 10 {
					return fmt.Errorf("too many redirects")
				}
				return nil
			},
		},
	}
}

// Check performs privacy policy and terms check
func (p *PrivacyTermsChecker) Check(domain string) PrivacyTermsResult {
	domain = cleanDomain(domain)
	
	result := PrivacyTermsResult{
		IsAccessible:          false,
		SSLValid:              false,
		TermsOfServicePresent: false,
		PrivacyPolicyPresent:  false,
	}
	
	// Try HTTPS first
	baseURL := fmt.Sprintf("https://%s", domain)
	doc, err := p.fetchPage(baseURL)
	
	if err != nil {
		// Try HTTP if HTTPS fails
		baseURL = fmt.Sprintf("http://%s", domain)
		doc, err = p.fetchPage(baseURL)
		if err != nil {
			return result
		}
	} else {
		result.SSLValid = true
	}
	
	result.IsAccessible = true
	
	// Search for privacy policy and terms links
	result.PrivacyPolicyPresent = p.findPrivacyPolicy(doc, baseURL)
	result.TermsOfServicePresent = p.findTermsOfService(doc, baseURL)
	
	// Try to extract legal name
	result.LegalName = p.extractLegalName(doc)
	
	return result
}

// fetchPage fetches and parses a web page
func (p *PrivacyTermsChecker) fetchPage(urlStr string) (*goquery.Document, error) {
	resp, err := p.client.Get(urlStr)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status code: %d", resp.StatusCode)
	}
	
	return goquery.NewDocumentFromReader(resp.Body)
}

// findPrivacyPolicy searches for privacy policy links
func (p *PrivacyTermsChecker) findPrivacyPolicy(doc *goquery.Document, baseURL string) bool {
	privacyKeywords := []string{
		"privacy policy",
		"privacy-policy",
		"privacy_policy",
		"privacypolicy",
		"privacy",
		"datenschutz",
		"confidentialité",
		"privacidad",
	}
	
	found := false
	
	// Search in links
	doc.Find("a").Each(func(i int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists {
			return
		}
		
		text := strings.ToLower(s.Text())
		href = strings.ToLower(href)
		
		for _, keyword := range privacyKeywords {
			if strings.Contains(text, keyword) || strings.Contains(href, keyword) {
				// Verify the link is accessible
				if p.verifyLink(href, baseURL) {
					found = true
					return
				}
			}
		}
	})
	
	// Also check footer
	if !found {
		doc.Find("footer").Each(func(i int, s *goquery.Selection) {
			text := strings.ToLower(s.Text())
			for _, keyword := range privacyKeywords {
				if strings.Contains(text, keyword) {
					found = true
					return
				}
			}
		})
	}
	
	return found
}

// findTermsOfService searches for terms of service links
func (p *PrivacyTermsChecker) findTermsOfService(doc *goquery.Document, baseURL string) bool {
	termsKeywords := []string{
		"terms of service",
		"terms-of-service",
		"terms_of_service",
		"terms of use",
		"terms-of-use",
		"terms_of_use",
		"terms and conditions",
		"terms & conditions",
		"terms",
		"tos",
		"nutzungsbedingungen",
		"conditions d'utilisation",
		"términos de servicio",
	}
	
	found := false
	
	// Search in links
	doc.Find("a").Each(func(i int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists {
			return
		}
		
		text := strings.ToLower(s.Text())
		href = strings.ToLower(href)
		
		for _, keyword := range termsKeywords {
			if strings.Contains(text, keyword) || strings.Contains(href, keyword) {
				// Verify the link is accessible
				if p.verifyLink(href, baseURL) {
					found = true
					return
				}
			}
		}
	})
	
	// Also check footer
	if !found {
		doc.Find("footer").Each(func(i int, s *goquery.Selection) {
			text := strings.ToLower(s.Text())
			for _, keyword := range termsKeywords {
				if strings.Contains(text, keyword) {
					found = true
					return
				}
			}
		})
	}
	
	return found
}

// verifyLink checks if a link is valid and accessible
func (p *PrivacyTermsChecker) verifyLink(href, baseURL string) bool {
	// Skip empty or anchor links
	if href == "" || href == "#" || strings.HasPrefix(href, "#") {
		return false
	}
	
	// Skip javascript links
	if strings.HasPrefix(href, "javascript:") {
		return false
	}
	
	// Make absolute URL
	absURL := href
	if !strings.HasPrefix(href, "http://") && !strings.HasPrefix(href, "https://") {
		base, err := url.Parse(baseURL)
		if err != nil {
			return false
		}
		
		ref, err := url.Parse(href)
		if err != nil {
			return false
		}
		
		absURL = base.ResolveReference(ref).String()
	}
	
	// Quick HEAD request to verify
	req, err := http.NewRequest("HEAD", absURL, nil)
	if err != nil {
		return false
	}
	
	resp, err := p.client.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	
	return resp.StatusCode == http.StatusOK
}

// extractLegalName tries to extract the company's legal name
func (p *PrivacyTermsChecker) extractLegalName(doc *goquery.Document) string {
	// Look for copyright notices
	copyrightSelectors := []string{
		"footer",
		".copyright",
		"#copyright",
		".footer-copyright",
		".footer",
	}
	
	for _, selector := range copyrightSelectors {
		doc.Find(selector).Each(func(i int, s *goquery.Selection) {
			text := s.Text()
			
			// Look for copyright patterns
			patterns := []string{
				"© ",
				"Copyright ",
				"(c) ",
				"©",
			}
			
			for _, pattern := range patterns {
				if idx := strings.Index(text, pattern); idx != -1 {
					// Extract text after copyright symbol
					remaining := text[idx+len(pattern):]
					
					// Clean up and extract company name
					parts := strings.Fields(remaining)
					if len(parts) > 0 {
						// Take first few words (likely company name)
						companyName := strings.Join(parts[:min(3, len(parts))], " ")
						
						// Remove common suffixes
						companyName = strings.TrimSuffix(companyName, ".")
						companyName = strings.TrimSuffix(companyName, ",")
						companyName = strings.TrimSpace(companyName)
						
						if companyName != "" && !strings.Contains(strings.ToLower(companyName), "all rights reserved") {
							return
						}
					}
				}
			}
		})
	}
	
	return ""
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// PrivacyTermsResult represents privacy and terms check result
type PrivacyTermsResult struct {
	IsAccessible          bool   `json:"is_accessible"`
	SSLValid              bool   `json:"ssl_valid"`
	TermsOfServicePresent bool   `json:"terms_of_service_present"`
	PrivacyPolicyPresent  bool   `json:"privacy_policy_present"`
	LegalName             string `json:"legal_name,omitempty"`
}
