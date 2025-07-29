package scrapers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// CheckSocialPresence checks for social media presence of a domain
func CheckSocialPresence(domain string) SocialPresenceResult {
	result := SocialPresenceResult{
		SocialPresence: SocialPresence{
			LinkedIn: LinkedInPresence{
				Presence: false,
			},
		},
	}

	// Check LinkedIn presence
	linkedInURL := checkLinkedInPresence(domain)
	if linkedInURL != "" {
		result.SocialPresence.LinkedIn.Presence = true
		result.SocialPresence.LinkedIn.URL = linkedInURL
	}

	return result
}

// checkLinkedInPresence checks if a company has a LinkedIn page
func checkLinkedInPresence(domain string) string {
	// Clean domain
	cleanDomain := strings.TrimPrefix(domain, "www.")
	companyName := strings.Split(cleanDomain, ".")[0]

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// Common LinkedIn company URL patterns
	linkedInPatterns := []string{
		fmt.Sprintf("https://www.linkedin.com/company/%s", companyName),
		fmt.Sprintf("https://www.linkedin.com/company/%s/", companyName),
		fmt.Sprintf("https://www.linkedin.com/company/%s-inc", companyName),
		fmt.Sprintf("https://www.linkedin.com/company/%s-llc", companyName),
		fmt.Sprintf("https://www.linkedin.com/company/%s-ltd", companyName),
	}

	// Also try to find LinkedIn links on the company website
	websiteLinkedIn := findLinkedInOnWebsite(domain, client)
	if websiteLinkedIn != "" {
		return websiteLinkedIn
	}

	// Try common LinkedIn patterns
	for _, pattern := range linkedInPatterns {
		if checkURLExists(client, pattern) {
			return pattern
		}
	}

	return ""
}

// findLinkedInOnWebsite searches for LinkedIn links on the company website
func findLinkedInOnWebsite(domain string, client *http.Client) string {
	url := "https://" + domain
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return ""
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil {
		// Try HTTP fallback
		url = "http://" + domain
		req, err = http.NewRequest("GET", url, nil)
		if err != nil {
			return ""
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
		
		resp, err = client.Do(req)
		if err != nil {
			return ""
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return ""
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return ""
	}

	// Look for LinkedIn links in various places
	var linkedInURL string

	// Check all links
	doc.Find("a").Each(func(i int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if exists && strings.Contains(href, "linkedin.com/company/") {
			linkedInURL = href
			return
		}
	})

	// Check for social media sections
	doc.Find("*").Each(func(i int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if exists && strings.Contains(href, "linkedin.com/company/") {
			linkedInURL = href
			return
		}
	})

	// Clean up and validate the URL
	if linkedInURL != "" {
		if !strings.HasPrefix(linkedInURL, "http") {
			linkedInURL = "https://" + linkedInURL
		}
		
		// Validate the LinkedIn URL by checking if it exists
		if checkURLExists(client, linkedInURL) {
			return linkedInURL
		}
	}

	return ""
}

// checkURLExists checks if a URL returns a successful response
func checkURLExists(client *http.Client, url string) bool {
	req, err := http.NewRequest("HEAD", url, nil)
	if err != nil {
		return false
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	// Consider 2xx and 3xx status codes as success
	return resp.StatusCode >= 200 && resp.StatusCode < 400
}
