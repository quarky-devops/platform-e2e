package scrapers

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// TrancoListResult represents the result from Tranco List ranking
type TrancoListResult struct {
	Domain     string `json:"domain"`
	TrancoRank string `json:"tranco_rank"`
	Error      string `json:"error,omitempty"`
}

// TrancoListScraper handles Tranco List ranking checks
type TrancoListScraper struct {
	client *http.Client
}

// NewTrancoListScraper creates a new Tranco List scraper
func NewTrancoListScraper() *TrancoListScraper {
	return &TrancoListScraper{
		client: &http.Client{
			Timeout: 45 * time.Second,
		},
	}
}

// ScrapeTrancoList checks a domain's ranking in the Tranco List
func (s *TrancoListScraper) ScrapeTrancoList(domain string) TrancoListResult {
	result := TrancoListResult{
		Domain:     domain,
		TrancoRank: "--",
	}

	// Clean the domain name
	domain = strings.TrimSpace(domain)
	domain = strings.Replace(domain, "http://", "", -1)
	domain = strings.Replace(domain, "https://", "", -1)
	domain = strings.Replace(domain, "www.", "", -1)

	// First, get the query page to prepare for search
	queryURL := "https://tranco-list.eu/query"

	// Create initial request to get the page
	req, err := http.NewRequest("GET", queryURL, nil)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to create request: %v", err)
		return result
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("Referer", "https://tranco-list.eu/")

	// Execute request to get the query page
	resp, err := s.client.Do(req)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to fetch query page: %v", err)
		return result
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		result.Error = fmt.Sprintf("HTTP error on query page: %d", resp.StatusCode)
		return result
	}

	// Now make a POST request to get the ranking
	form := url.Values{}
	form.Add("domain", domain)

	postReq, err := http.NewRequest("POST", queryURL, strings.NewReader(form.Encode()))
	if err != nil {
		result.Error = fmt.Sprintf("Failed to create POST request: %v", err)
		return result
	}

	postReq.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	postReq.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
	postReq.Header.Set("Accept-Language", "en-US,en;q=0.5")
	postReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	postReq.Header.Set("Referer", queryURL)

	// Execute POST request
	postResp, err := s.client.Do(postReq)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to fetch ranking data: %v", err)
		return result
	}
	defer postResp.Body.Close()

	if postResp.StatusCode != http.StatusOK {
		result.Error = fmt.Sprintf("HTTP error on ranking request: %d", postResp.StatusCode)
		return result
	}

	// Read response body
	body, err := io.ReadAll(postResp.Body)
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

	// Extract the ranking using multiple approaches
	result = s.extractRanking(doc, domain, result)

	return result
}

// extractRanking attempts to extract the Tranco ranking from various possible locations
func (s *TrancoListScraper) extractRanking(doc *goquery.Document, domain string, result TrancoListResult) TrancoListResult {
	// Try to find the rank in various possible elements
	rankSelectors := []string{
		"#rank",
		".rank",
		"[id*='rank']",
		"[class*='rank']",
		"td.rank",
		"span.rank",
		"div.rank",
	}

	for _, selector := range rankSelectors {
		element := doc.Find(selector)
		if element.Length() > 0 {
			rankText := strings.TrimSpace(element.Text())
			if rankText != "" && rankText != "--" && rankText != "0" {
				// Validate if it's a number
				if _, err := strconv.Atoi(rankText); err == nil {
					result.TrancoRank = rankText
					return result
				}
			}
		}
	}

	// Try to find domain confirmation first
	domainSelectors := []string{
		"#domain",
		".domain",
		"[id*='domain']",
		"[class*='domain']",
	}

	domainFound := false
	for _, selector := range domainSelectors {
		element := doc.Find(selector)
		if element.Length() > 0 {
			domainText := strings.TrimSpace(element.Text())
			if strings.Contains(domainText, domain) {
				domainFound = true
				break
			}
		}
	}

	// If domain is confirmed, look for rank in the result area
	if domainFound {
		// Look for numeric values in result sections
		doc.Find("div, span, td, p").Each(func(i int, s *goquery.Selection) {
			text := strings.TrimSpace(s.Text())
			if len(text) > 0 && len(text) < 10 {
				if rank, err := strconv.Atoi(text); err == nil && rank > 0 && rank < 10000000 {
					result.TrancoRank = text
					return
				}
			}
		})
	}

	// Try alternative approach: look for results table
	table := doc.Find("table")
	if table.Length() > 0 {
		table.Find("tr").Each(func(i int, row *goquery.Selection) {
			cells := row.Find("td")
			if cells.Length() >= 2 {
				// Check if one cell contains the domain
				domainCell := ""
				rankCell := ""

				cells.Each(func(j int, cell *goquery.Selection) {
					cellText := strings.TrimSpace(cell.Text())
					if strings.Contains(cellText, domain) {
						domainCell = cellText
					}
					if _, err := strconv.Atoi(cellText); err == nil && cellText != "0" {
						rankCell = cellText
					}
				})

				if domainCell != "" && rankCell != "" {
					result.TrancoRank = rankCell
					return
				}
			}
		})
	}

	// Last resort: look for any pattern that might indicate ranking
	pageText := doc.Text()
	lines := strings.Split(pageText, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.Contains(line, domain) {
			// Look for numbers in the same line or nearby lines
			words := strings.Fields(line)
			for _, word := range words {
				if rank, err := strconv.Atoi(word); err == nil && rank > 0 && rank < 10000000 {
					result.TrancoRank = word
					return result
				}
			}
		}
	}

	// Check if the domain was not found (no ranking available)
	pageTextLower := strings.ToLower(pageText)
	if strings.Contains(pageTextLower, "not found") ||
		strings.Contains(pageTextLower, "no result") ||
		strings.Contains(pageTextLower, "not in list") {
		result.TrancoRank = "--"
	}

	return result
}

// GetTrancoListData is a convenience function for the main scraper
func GetTrancoListData(domain string) TrancoListResult {
	scraper := NewTrancoListScraper()
	return scraper.ScrapeTrancoList(domain)
}
