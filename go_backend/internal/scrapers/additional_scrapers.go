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

// IPVoidResult represents the result of IPVoid scan

// IPVoidScraper handles IPVoid IP reputation scanning
type IPVoidScraper struct {
	client *http.Client
}

// NewIPVoidScraper creates a new IPVoid scraper
func NewIPVoidScraper() *IPVoidScraper {
	return &IPVoidScraper{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ScrapeIPVoid scrapes IPVoid for IP reputation information
func (s *IPVoidScraper) ScrapeIPVoid(ipAddress string) IPVoidResult {
	result := IPVoidResult{
		IPAddress: ipAddress,
	}
	
	// IPVoid check URL
	url := fmt.Sprintf("https://www.ipvoid.com/ip-blacklist-check/%s/", ipAddress)
	
	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()
	
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to create request: %v", err)
		return result
	}
	
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	
	resp, err := s.client.Do(req)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to fetch IPVoid: %v", err)
		return result
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		result.Error = fmt.Sprintf("IPVoid returned status %d", resp.StatusCode)
		return result
	}
	
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to parse HTML: %v", err)
		return result
	}
	
	// Parse IPVoid results
	result = s.parseIPVoidResponse(doc, result)
	
	return result
}

// parseIPVoidResponse parses the IPVoid HTML response
func (s *IPVoidScraper) parseIPVoidResponse(doc *goquery.Document, result IPVoidResult) IPVoidResult {
	// Extract basic information
	doc.Find("table tr").Each(func(i int, row *goquery.Selection) {
		cells := row.Find("td")
		if cells.Length() >= 2 {
			key := strings.TrimSpace(cells.Eq(0).Text())
			value := strings.TrimSpace(cells.Eq(1).Text())
			
			switch strings.ToLower(key) {
			case "country":
				result.CountryName = value
				// Extract country code from value like "United States (US)"
				if matches := regexp.MustCompile(`\(([A-Z]{2})\)`).FindStringSubmatch(value); len(matches) > 1 {
					result.CountryCode = matches[1]
				}
			case "isp":
				result.ISP = value
			case "asn":
				result.ASN = value
			case "reverse hostname":
				result.ReverseHostname = value
			}
		}
	})
	
	// Extract detection counts
	detectionText := doc.Find(".alert-success, .alert-danger").Text()
	result.DetectionsCount = s.parseDetectionCounts(detectionText)
	
	// Extract blacklist status
	result.BlacklistStatus = s.parseBlacklistStatus(doc)
	
	return result
}

// parseDetectionCounts parses detection counts from text
func (s *IPVoidScraper) parseDetectionCounts(text string) DetectionsCounts {
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

// parseBlacklistStatus extracts blacklist status information
func (s *IPVoidScraper) parseBlacklistStatus(doc *goquery.Document) map[string]string {
	blacklistStatus := make(map[string]string)
	
	doc.Find("table.table-striped tr").Each(func(i int, row *goquery.Selection) {
		cells := row.Find("td")
		if cells.Length() >= 2 {
			blacklist := strings.TrimSpace(cells.Eq(0).Text())
			status := strings.TrimSpace(cells.Eq(1).Text())
			if blacklist != "" && status != "" {
				blacklistStatus[blacklist] = status
			}
		}
	})
	
	return blacklistStatus
}

// GetIPVoidData is a convenience function for the main scraper
func GetIPVoidData(ipAddress string) IPVoidResult {
	scraper := NewIPVoidScraper()
	return scraper.ScrapeIPVoid(ipAddress)
}

// CheckPageSize checks the page size of a website
func CheckPageSize(domain string) PageSizeResult {
	result := PageSizeResult{}
	
	url := "https://" + domain
	
	client := &http.Client{
		Timeout: 15 * time.Second,
	}
	
	startTime := time.Now()
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to create request: %v", err)
		return result
	}
	
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	
	resp, err := client.Do(req)
	if err != nil {
		// Try HTTP fallback
		url = "http://" + domain
		req, err = http.NewRequest("GET", url, nil)
		if err != nil {
			result.Error = fmt.Sprintf("Failed to create HTTP request: %v", err)
			return result
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
		
		resp, err = client.Do(req)
		if err != nil {
			result.Error = fmt.Sprintf("Failed to fetch page: %v", err)
			return result
		}
	}
	defer resp.Body.Close()
	
	loadTime := time.Since(startTime)
	result.LoadTime = loadTime.String()
	
	if resp.StatusCode != http.StatusOK {
		result.Error = fmt.Sprintf("HTTP status: %d", resp.StatusCode)
		return result
	}
	
	// Read response body to calculate size
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to parse HTML: %v", err)
		return result
	}
	
	html, err := doc.Html()
	if err != nil {
		result.Error = fmt.Sprintf("Failed to get HTML: %v", err)
		return result
	}
	
	sizeBytes := len(html)
	result.PageSizeBytes = sizeBytes
	result.PageSizeKB = sizeBytes / 1024
	
	return result
}

// CheckTrafficVolume checks website traffic volume (placeholder implementation)
func CheckTrafficVolume(domain string) TrafficVolumeResult {
	// This is a placeholder implementation
	// In reality, you would need to integrate with services like SimilarWeb, Alexa, etc.
	result := TrafficVolumeResult{
		GlobalRank:       "N/A",
		CountryRank:      "N/A",
		MonthlyVisits:    "N/A",
		BounceRate:       "N/A",
		PagesPerVisit:    "N/A",
		AvgVisitDuration: "N/A",
	}
	
	return result
}

// CheckPopupAds checks for popups and ads on a website
func CheckPopupAds(domain string) PopupAdsResult {
	result := PopupAdsResult{}
	
	url := "https://" + domain
	
	client := &http.Client{
		Timeout: 15 * time.Second,
	}
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to create request: %v", err)
		return result
	}
	
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	
	resp, err := client.Do(req)
	if err != nil {
		// Try HTTP fallback
		url = "http://" + domain
		req, err = http.NewRequest("GET", url, nil)
		if err != nil {
			result.Error = fmt.Sprintf("Failed to create HTTP request: %v", err)
			return result
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
		
		resp, err = client.Do(req)
		if err != nil {
			result.Error = fmt.Sprintf("Failed to fetch page: %v", err)
			return result
		}
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		result.Error = fmt.Sprintf("HTTP status: %d", resp.StatusCode)
		return result
	}
	
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to parse HTML: %v", err)
		return result
	}
	
	// Check for popup indicators
	popupIndicators := []string{
		"popup", "modal", "overlay", "lightbox", "fancybox",
		"window.open", "alert(", "confirm(", "prompt(",
	}
	
	html, _ := doc.Html()
	htmlLower := strings.ToLower(html)
	
	for _, indicator := range popupIndicators {
		if strings.Contains(htmlLower, indicator) {
			result.HasPopups = true
			break
		}
	}
	
	// Check for ad indicators
	adIndicators := []string{
		"google-ads", "doubleclick", "adsystem", "advertisement",
		"adnxs", "adsense", "adserver", "ad-slot", "ad-banner",
		"sponsored", "promotion", "affiliate",
	}
	
	for _, indicator := range adIndicators {
		if strings.Contains(htmlLower, indicator) {
			result.HasAds = true
			break
		}
	}
	
	// Check for common ad networks in script tags
	doc.Find("script").Each(func(i int, s *goquery.Selection) {
		src, exists := s.Attr("src")
		if exists {
			srcLower := strings.ToLower(src)
			for _, indicator := range adIndicators {
				if strings.Contains(srcLower, indicator) {
					result.HasAds = true
					return
				}
			}
		}
	})
	
	return result
}
