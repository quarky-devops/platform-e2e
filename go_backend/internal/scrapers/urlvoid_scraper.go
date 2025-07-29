package scrapers

import (
	"context"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// URLVoidScraper handles URLVoid website scanning
type URLVoidScraper struct {
	client *http.Client
}

// NewURLVoidScraper creates a new URLVoid scraper
func NewURLVoidScraper() *URLVoidScraper {
	return &URLVoidScraper{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ScrapeURLVoid scrapes URLVoid for domain security information
func (s *URLVoidScraper) ScrapeURLVoid(domain string) URLVoidResult {
	result := URLVoidResult{}
	
	// Clean domain
	domain = strings.TrimPrefix(domain, "http://")
	domain = strings.TrimPrefix(domain, "https://")
	domain = strings.TrimPrefix(domain, "www.")
	
	// URLVoid check URL
	url := fmt.Sprintf("https://www.urlvoid.com/scan/%s/", domain)
	
	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()
	
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to create request: %v", err)
		return result
	}
	
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("Upgrade-Insecure-Requests", "1")
	
	resp, err := s.client.Do(req)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to fetch URLVoid: %v", err)
		return result
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		result.Error = fmt.Sprintf("URLVoid returned status %d", resp.StatusCode)
		return result
	}
	
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to parse HTML: %v", err)
		return result
	}
	
	// Parse URLVoid results
	result = s.parseURLVoidResponse(doc, domain)
	
	return result
}

// parseURLVoidResponse parses the URLVoid HTML response
func (s *URLVoidScraper) parseURLVoidResponse(doc *goquery.Document, domain string) URLVoidResult {
	result := URLVoidResult{
		WebsiteAddress: domain,
	}
	
	// Extract information from the results table
	doc.Find("table.table-custom tr").Each(func(i int, row *goquery.Selection) {
		cells := row.Find("td")
		if cells.Length() >= 2 {
			key := strings.TrimSpace(cells.Eq(0).Text())
			value := strings.TrimSpace(cells.Eq(1).Text())
			
			switch strings.ToLower(key) {
			case "last analysis":
				result.LastAnalysis = s.cleanAnalysisTime(value)
			case "domain registration":
				result.RegisteredOn, result.RegisteredSince = s.parseDomainRegistration(value)
			case "ip address":
				result.IPAddress = s.extractIPAddress(value)
			case "reverse dns":
				result.ReverseDNS = value
			case "asn":
				result.ASN = value
			case "server location":
				result.ServerLocation = value
			case "latitude / longitude":
				result.LatitudeLongitude = value
			case "city":
				result.City = value
			case "region":
				result.Region = value
			}
		}
	})
	
	// Extract detection counts
	detectionText := doc.Find(".alert-success, .alert-danger").Text()
	result.DetectionsCounts = s.parseDetectionCounts(detectionText)
	
	return result
}

// cleanAnalysisTime removes the rescan link from analysis time
func (s *URLVoidScraper) cleanAnalysisTime(text string) string {
	// Remove "| Rescan" part
	parts := strings.Split(text, "|")
	if len(parts) > 0 {
		return strings.TrimSpace(parts[0])
	}
	return text
}

// parseDomainRegistration parses domain registration information
func (s *URLVoidScraper) parseDomainRegistration(text string) (string, string) {
	parts := strings.Split(text, "|")
	if len(parts) >= 2 {
		return strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
	}
	return text, ""
}

// extractIPAddress extracts IP address from text
func (s *URLVoidScraper) extractIPAddress(text string) string {
	// Use regex to extract IP address
	ipRegex := regexp.MustCompile(`(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})`)
	matches := ipRegex.FindStringSubmatch(text)
	if len(matches) > 0 {
		return matches[0]
	}
	return text
}

// parseDetectionCounts parses detection counts from text
func (s *URLVoidScraper) parseDetectionCounts(text string) DetectionsCounts {
	// Look for pattern like "0/20" or "2/25"
	detectionRegex := regexp.MustCompile(`(\d+)/(\d+)`)
	matches := detectionRegex.FindStringSubmatch(text)
	
	if len(matches) >= 3 {
		detected, _ := strconv.Atoi(matches[1])
		total, _ := strconv.Atoi(matches[2])
		return DetectionsCounts{
			Detected: detected,
			Checks:   total,
		}
	}
	
	return DetectionsCounts{
		Detected: 0,
		Checks:   0,
	}
}

// GetURLVoidData is a convenience function for the main scraper
func GetURLVoidData(domain string) URLVoidResult {
	scraper := NewURLVoidScraper()
	return scraper.ScrapeURLVoid(domain)
}
