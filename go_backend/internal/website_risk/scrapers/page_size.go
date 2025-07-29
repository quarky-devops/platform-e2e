package scrapers

import (
	"fmt"
	"io"
	"net/http"
	"time"
)

// PageSizeChecker checks the size of a web page
type PageSizeChecker struct {
	client *http.Client
}

// NewPageSizeChecker creates a new page size checker
func NewPageSizeChecker() *PageSizeChecker {
	return &PageSizeChecker{
		client: &http.Client{
			Timeout: 30 * time.Second,
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 10 {
					return fmt.Errorf("too many redirects")
				}
				return nil
			},
		},
	}
}

// Check measures the page size of a domain
func (p *PageSizeChecker) Check(domain string) PageSizeResult {
	domain = cleanDomain(domain)
	
	result := PageSizeResult{}
	
	// Try HTTPS first
	url := fmt.Sprintf("https://%s", domain)
	size, err := p.getPageSize(url)
	
	if err != nil {
		// Try HTTP if HTTPS fails
		url = fmt.Sprintf("http://%s", domain)
		size, err = p.getPageSize(url)
		if err != nil {
			result.Error = fmt.Sprintf("failed to get page size: %v", err)
			return result
		}
	}
	
	result.PageURL = url
	result.PageSizeBytes = size
	result.PageSizeKB = float64(size) / 1024.0
	
	return result
}

// getPageSize fetches a page and returns its size
func (p *PageSizeChecker) getPageSize(url string) (int, error) {
	resp, err := p.client.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("status code: %d", resp.StatusCode)
	}
	
	// Read the entire body to get the size
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}
	
	return len(body), nil
}

// PageSizeResult represents the result of page size check
type PageSizeResult struct {
	PageSizeKB    interface{} `json:"Page Size (KB)"`
	PageSizeBytes interface{} `json:"Page Size (Bytes)"`
	PageURL       string      `json:"Page URL,omitempty"`
	LoadTime      string      `json:"load_time,omitempty"`
	Error         string      `json:"error,omitempty"`
}