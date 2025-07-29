package scrapers

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// HTTPSChecker checks if a website uses HTTPS and retrieves basic information
type HTTPSChecker struct {
	client *http.Client
}

// NewHTTPSChecker creates a new HTTPS checker
func NewHTTPSChecker() *HTTPSChecker {
	return &HTTPSChecker{
		client: &http.Client{
			Timeout: 10 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				// Allow up to 10 redirects
				if len(via) >= 10 {
					return fmt.Errorf("too many redirects")
				}
				return nil
			},
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					InsecureSkipVerify: false,
				},
			},
		},
	}
}

// Check performs HTTPS check on a domain
func (h *HTTPSChecker) Check(domain string) HTTPSResult {
	// Clean domain
	domain = cleanDomain(domain)
	
	// Try HTTPS first
	httpsURL := fmt.Sprintf("https://%s", domain)
	result := h.checkURL(httpsURL)
	
	// If HTTPS fails, try HTTP
	if !result.HasHTTPS || result.Error != "" {
		httpURL := fmt.Sprintf("http://%s", domain)
		httpResult := h.checkURL(httpURL)
		
		// If HTTP works but HTTPS doesn't, it doesn't have HTTPS
		if httpResult.Error == "" && result.Error != "" {
			result.HasHTTPS = false
			result.Protocol = "http"
			result.Status = httpResult.Status
			result.PageTitle = httpResult.PageTitle
			result.Error = ""
		}
	}
	
	return result
}

// checkURL checks a specific URL
func (h *HTTPSChecker) checkURL(urlStr string) HTTPSResult {
	result := HTTPSResult{
		HasHTTPS: false,
		Protocol: "http",
	}
	
	// Parse URL
	u, err := url.Parse(urlStr)
	if err != nil {
		result.Error = fmt.Sprintf("invalid URL: %v", err)
		return result
	}
	
	// Make request
	resp, err := h.client.Get(urlStr)
	if err != nil {
		result.Error = fmt.Sprintf("request failed: %v", err)
		return result
	}
	defer resp.Body.Close()
	
	// Check protocol
	if u.Scheme == "https" {
		result.HasHTTPS = true
		result.Protocol = "https"
	}
	
	// Set status
	result.Status = resp.Status
	
	// Parse HTML to get title
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err == nil {
		title := doc.Find("title").First().Text()
		result.PageTitle = strings.TrimSpace(title)
	}
	
	return result
}

// HTTPSResult represents the result of HTTPS check
type HTTPSResult struct {
	HasHTTPS  bool   `json:"has_https"`
	Protocol  string `json:"protocol,omitempty"`
	Status    string `json:"status,omitempty"`
	PageTitle string `json:"page_title,omitempty"`
	Error     string `json:"error,omitempty"`
}

// cleanDomain removes protocol and trailing slashes
func cleanDomain(domain string) string {
	// Remove protocol
	domain = strings.TrimPrefix(domain, "http://")
	domain = strings.TrimPrefix(domain, "https://")
	
	// Remove trailing slash
	domain = strings.TrimSuffix(domain, "/")
	
	// Remove path if present
	if idx := strings.Index(domain, "/"); idx != -1 {
		domain = domain[:idx]
	}
	
	return domain
}
