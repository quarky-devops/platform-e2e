package scrapers

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// GoogleSafeBrowsingResult represents the result from Google Safe Browsing check
type GoogleSafeBrowsingResult struct {
	Domain        string `json:"domain"`
	CurrentStatus string `json:"current_status"`
	SiteInfo      string `json:"site_info"`
	Error         string `json:"error,omitempty"`
}

// GoogleSafeBrowsingScraper handles Google Safe Browsing checks
type GoogleSafeBrowsingScraper struct {
	client *http.Client
}

// NewGoogleSafeBrowsingScraper creates a new Google Safe Browsing scraper
func NewGoogleSafeBrowsingScraper() *GoogleSafeBrowsingScraper {
	return &GoogleSafeBrowsingScraper{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ScrapeGoogleSafeBrowsing checks a domain against Google Safe Browsing
func (s *GoogleSafeBrowsingScraper) ScrapeGoogleSafeBrowsing(domain string) GoogleSafeBrowsingResult {
	result := GoogleSafeBrowsingResult{
		Domain:        domain,
		CurrentStatus: "Unknown",
		SiteInfo:      "Unknown",
	}

	// Clean the domain name
	domain = strings.TrimSpace(domain)
	domain = strings.Replace(domain, "http://", "", -1)
	domain = strings.Replace(domain, "https://", "", -1)
	domain = strings.Replace(domain, "www.", "", -1)

	// Construct the Google Transparency Report URL
	baseURL := "https://transparencyreport.google.com/safe-browsing/search"
	params := url.Values{}
	params.Add("url", domain)
	params.Add("hl", "en")
	fullURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())

	// Create request with headers to mimic browser
	req, err := http.NewRequest("GET", fullURL, nil)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to create request: %v", err)
		return result
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")
	req.Header.Set("Referer", "https://transparencyreport.google.com/")

	// Execute request
	resp, err := s.client.Do(req)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to fetch data: %v", err)
		return result
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		result.Error = fmt.Sprintf("HTTP error: %d", resp.StatusCode)
		return result
	}

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to read response: %v", err)
		return result
	}

	// Parse the HTML
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(body)))
	if err != nil {
		result.Error = fmt.Sprintf("Failed to parse HTML: %v", err)
		return result
	}

	// Extract Current Status
	result = s.extractStatus(doc, result)

	// Extract Site Info
	result = s.extractSiteInfo(doc, result)

	return result
}

// extractStatus attempts to extract the current status from various possible selectors
func (s *GoogleSafeBrowsingScraper) extractStatus(doc *goquery.Document, result GoogleSafeBrowsingResult) GoogleSafeBrowsingResult {
	// Try multiple selectors for the status
	statusSelectors := []string{
		"data-tile[trtitle='Current status'] span",
		"[data-title='Current status'] span",
		".status-tile span",
		".current-status span",
		"[aria-label*='status'] span",
		"div[role='button'] span",
	}

	for _, selector := range statusSelectors {
		element := doc.Find(selector)
		if element.Length() > 0 {
			status := strings.TrimSpace(element.Text())
			if status != "" && status != "Unknown" {
				result.CurrentStatus = status
				break
			}
		}
	}

	// Try to find status in text content
	if result.CurrentStatus == "Unknown" {
		doc.Find("*").Each(func(i int, s *goquery.Selection) {
			text := strings.ToLower(s.Text())
			if strings.Contains(text, "no unsafe content found") {
				result.CurrentStatus = "No unsafe content found"
				return
			}
			if strings.Contains(text, "unsafe") || strings.Contains(text, "malware") || strings.Contains(text, "phishing") {
				result.CurrentStatus = "Unsafe content detected"
				return
			}
		})
	}

	// Fallback: check for specific patterns in the page content
	if result.CurrentStatus == "Unknown" {
		pageText := strings.ToLower(doc.Text())
		if strings.Contains(pageText, "no unsafe content") {
			result.CurrentStatus = "No unsafe content found"
		} else if strings.Contains(pageText, "unsafe") || strings.Contains(pageText, "malware") {
			result.CurrentStatus = "Unsafe content detected"
		} else if strings.Contains(pageText, "safe") {
			result.CurrentStatus = "Safe"
		}
	}

	return result
}

// extractSiteInfo attempts to extract site information from various possible selectors
func (s *GoogleSafeBrowsingScraper) extractSiteInfo(doc *goquery.Document, result GoogleSafeBrowsingResult) GoogleSafeBrowsingResult {
	// Try multiple selectors for site info
	infoSelectors := []string{
		"column-layout p",
		".site-info p",
		".description p",
		"[data-title='Site info'] p",
		".info-section p",
		"p[data-text]",
	}

	for _, selector := range infoSelectors {
		element := doc.Find(selector)
		if element.Length() > 0 {
			info := strings.TrimSpace(element.Text())
			if info != "" && info != "Unknown" && len(info) > 10 {
				result.SiteInfo = info
				break
			}
		}
	}

	// Try to extract from meta description
	if result.SiteInfo == "Unknown" {
		metaDesc := doc.Find("meta[name='description']").AttrOr("content", "")
		if metaDesc != "" {
			result.SiteInfo = metaDesc
		}
	}

	// Try to find relevant paragraphs with substantial content
	if result.SiteInfo == "Unknown" {
		doc.Find("p").Each(func(i int, s *goquery.Selection) {
			text := strings.TrimSpace(s.Text())
			if len(text) > 20 && !strings.Contains(strings.ToLower(text), "cookie") &&
				!strings.Contains(strings.ToLower(text), "privacy") {
				result.SiteInfo = text
				return
			}
		})
	}

	return result
}

// GetGoogleSafeBrowsingData is a convenience function for the main scraper
func GetGoogleSafeBrowsingData(domain string) GoogleSafeBrowsingResult {
	scraper := NewGoogleSafeBrowsingScraper()
	return scraper.ScrapeGoogleSafeBrowsing(domain)
}
