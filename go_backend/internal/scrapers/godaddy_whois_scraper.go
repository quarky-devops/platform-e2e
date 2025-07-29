package scrapers

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// GoDaddyWhoisResult represents the result from GoDaddy WHOIS lookup
type GoDaddyWhoisResult struct {
	Name             string   `json:"name"`
	RegistryDomainID string   `json:"registry_domain_id"`
	RegisteredOn     string   `json:"registered_on"`
	ExpiresOn        string   `json:"expires_on"`
	UpdatedOn        string   `json:"updated_on"`
	DomainStatus     string   `json:"domain_status"`
	NameServers      []string `json:"name_servers"`
	Error            string   `json:"error,omitempty"`
}

// GoDaddyWhoisScraper handles GoDaddy WHOIS lookups
type GoDaddyWhoisScraper struct {
	client *http.Client
}

// NewGoDaddyWhoisScraper creates a new GoDaddy WHOIS scraper
func NewGoDaddyWhoisScraper() *GoDaddyWhoisScraper {
	return &GoDaddyWhoisScraper{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ScrapeGoDaddyWhois performs WHOIS lookup using GoDaddy's service
func (s *GoDaddyWhoisScraper) ScrapeGoDaddyWhois(domain string) GoDaddyWhoisResult {
	result := GoDaddyWhoisResult{
		Name:             "unknown",
		RegistryDomainID: "unknown",
		RegisteredOn:     "unknown",
		ExpiresOn:        "unknown",
		UpdatedOn:        "unknown",
		DomainStatus:     "unknown",
		NameServers:      []string{},
	}

	// Clean the domain name
	domain = strings.TrimSpace(domain)
	domain = strings.Replace(domain, "http://", "", -1)
	domain = strings.Replace(domain, "https://", "", -1)
	domain = strings.Replace(domain, "www.", "", -1)

	// Construct the GoDaddy WHOIS URL
	url := fmt.Sprintf("https://in.godaddy.com/whois/results.aspx?itc=dlp_domain_whois&domainName=%s", domain)

	// Create request with headers to mimic browser
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to create request: %v", err)
		return result
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("Accept-Encoding", "gzip, deflate, br")
	req.Header.Set("Referer", "https://in.godaddy.com/")

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

	// Extract information from the contact-info-container
	container := doc.Find(".contact-info-container")
	if container.Length() == 0 {
		// Try alternative parsing if main container not found
		result = s.parseAlternativeFormat(doc, result)
	} else {
		result = s.parseMainFormat(container, result)
	}

	return result
}

// parseMainFormat parses the main GoDaddy WHOIS format
func (s *GoDaddyWhoisScraper) parseMainFormat(container *goquery.Selection, result GoDaddyWhoisResult) GoDaddyWhoisResult {
	// Extract Name
	nameElement := container.Find("span#title-domainName + span.contact-label")
	if nameElement.Length() > 0 {
		result.Name = strings.TrimSpace(nameElement.Text())
	}

	// Extract Registry Domain ID
	idElement := container.Find("span#title-registryDomainId + span.contact-label")
	if idElement.Length() > 0 {
		result.RegistryDomainID = strings.TrimSpace(idElement.Text())
	}

	// Extract Registered On
	regElement := container.Find("span#title-creationDate + span.contact-label")
	if regElement.Length() > 0 {
		result.RegisteredOn = strings.TrimSpace(regElement.Text())
	}

	// Extract Expires On
	expElement := container.Find("span#title-expiresOn + span.contact-label")
	if expElement.Length() > 0 {
		result.ExpiresOn = strings.TrimSpace(expElement.Text())
	}

	// Extract Updated On
	updElement := container.Find("span#title-updatedOn + span.contact-label")
	if updElement.Length() > 0 {
		result.UpdatedOn = strings.TrimSpace(updElement.Text())
	}

	// Extract Domain Status
	statusElement := container.Find("div#contact-labels p.contact-label")
	if statusElement.Length() > 0 {
		result.DomainStatus = strings.TrimSpace(statusElement.Text())
	}

	// Extract Name Servers
	nameServerElements := container.Find("span#title-nameservers + div#contact-labels p.contact-label")
	nameServerElements.Each(func(i int, s *goquery.Selection) {
		ns := strings.TrimSpace(s.Text())
		if ns != "" {
			result.NameServers = append(result.NameServers, ns)
		}
	})

	return result
}

// parseAlternativeFormat tries to parse using alternative selectors
func (s *GoDaddyWhoisScraper) parseAlternativeFormat(doc *goquery.Document, result GoDaddyWhoisResult) GoDaddyWhoisResult {
	// Try to find WHOIS data in text format
	whoisText := doc.Find("pre, .whois-data, .raw-whois").Text()
	if whoisText != "" {
		result = s.parseWhoisText(whoisText, result)
	}

	// Try to find data in table format
	doc.Find("table tr").Each(func(i int, row *goquery.Selection) {
		cells := row.Find("td")
		if cells.Length() >= 2 {
			key := strings.ToLower(strings.TrimSpace(cells.Eq(0).Text()))
			value := strings.TrimSpace(cells.Eq(1).Text())

			switch {
			case strings.Contains(key, "domain name"):
				result.Name = value
			case strings.Contains(key, "registry domain id"):
				result.RegistryDomainID = value
			case strings.Contains(key, "creation date") || strings.Contains(key, "registered"):
				result.RegisteredOn = value
			case strings.Contains(key, "expiration date") || strings.Contains(key, "expires"):
				result.ExpiresOn = value
			case strings.Contains(key, "updated date"):
				result.UpdatedOn = value
			case strings.Contains(key, "status"):
				result.DomainStatus = value
			}
		}
	})

	return result
}

// parseWhoisText parses WHOIS data from raw text format
func (s *GoDaddyWhoisScraper) parseWhoisText(text string, result GoDaddyWhoisResult) GoDaddyWhoisResult {
	lines := strings.Split(text, "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "%") || strings.HasPrefix(line, ">>>") {
			continue
		}

		if strings.Contains(line, ":") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) != 2 {
				continue
			}

			key := strings.ToLower(strings.TrimSpace(parts[0]))
			value := strings.TrimSpace(parts[1])

			switch {
			case strings.Contains(key, "domain name"):
				result.Name = value
			case strings.Contains(key, "registry domain id"):
				result.RegistryDomainID = value
			case strings.Contains(key, "creation date") || strings.Contains(key, "created"):
				result.RegisteredOn = value
			case strings.Contains(key, "expiration date") || strings.Contains(key, "expires"):
				result.ExpiresOn = value
			case strings.Contains(key, "updated date"):
				result.UpdatedOn = value
			case strings.Contains(key, "domain status") || strings.Contains(key, "status"):
				result.DomainStatus = value
			case strings.Contains(key, "name server"):
				if value != "" {
					result.NameServers = append(result.NameServers, value)
				}
			}
		}
	}

	return result
}

// GetGoDaddyWhoisData is a convenience function for the main scraper
func GetGoDaddyWhoisData(domain string) GoDaddyWhoisResult {
	scraper := NewGoDaddyWhoisScraper()
	return scraper.ScrapeGoDaddyWhois(domain)
}
