package scrapers

import (
	"context"
	"crypto/tls"
	"net/http"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// CheckHTTPS checks if a website supports HTTPS or falls back to HTTP
func CheckHTTPS(domain string) HTTPSResult {
	httpsURL := "https://" + domain
	httpURL := "http://" + domain

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	// Try HTTPS first
	if title, err := fetchPageTitle(client, httpsURL); err == nil {
		return HTTPSResult{
			HasHTTPS:  true,
			Protocol:  "HTTPS",
			Status:    "Accessible",
			PageTitle: title,
		}
	}

	// Fallback to HTTP
	if title, err := fetchPageTitle(client, httpURL); err == nil {
		return HTTPSResult{
			HasHTTPS:  false,
			Protocol:  "HTTP",
			Status:    "Accessible",
			PageTitle: title,
			Error:     "HTTPS failed, but HTTP is accessible",
		}
	}

	return HTTPSResult{
		HasHTTPS: false,
		Protocol: "None",
		Status:   "Inaccessible",
		Error:    "Both HTTPS and HTTP failed",
	}
}

// fetchPageTitle fetches the page title from a given URL
func fetchPageTitle(client *http.Client, url string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", nil
	}

	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return "", err
	}

	title := doc.Find("title").First().Text()
	return title, nil
}
