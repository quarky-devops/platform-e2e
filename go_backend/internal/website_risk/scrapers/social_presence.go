package scrapers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// SocialPresenceChecker checks for social media presence
type SocialPresenceChecker struct {
	client *http.Client
}

// NewSocialPresenceChecker creates a new social presence checker
func NewSocialPresenceChecker() *SocialPresenceChecker {
	return &SocialPresenceChecker{
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

// Check performs social media presence check
func (s *SocialPresenceChecker) Check(domain string) SocialPresenceResult {
	domain = cleanDomain(domain)
	
	result := SocialPresenceResult{
		SocialPresence: SocialPresence{},
	}
	
	// Check website for social media links
	websiteURL := fmt.Sprintf("https://%s", domain)
	doc, err := s.fetchPage(websiteURL)
	if err != nil {
		// Try HTTP if HTTPS fails
		websiteURL = fmt.Sprintf("http://%s", domain)
		doc, err = s.fetchPage(websiteURL)
		if err != nil {
			return result
		}
	}
	
	// Extract social media links
	result.SocialPresence = s.extractSocialLinks(doc, domain)
	
	// Check LinkedIn specifically
	if result.SocialPresence.LinkedIn.Presence {
		// Try to get LinkedIn company details
		result.LinkedInCompanyDetails = s.getLinkedInCompanyDetails(result.SocialPresence.LinkedIn.Link)
	}
	
	return result
}

// fetchPage fetches and parses a web page
func (s *SocialPresenceChecker) fetchPage(url string) (*goquery.Document, error) {
	resp, err := s.client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status code: %d", resp.StatusCode)
	}
	
	return goquery.NewDocumentFromReader(resp.Body)
}

// extractSocialLinks extracts social media links from the page
func (s *SocialPresenceChecker) extractSocialLinks(doc *goquery.Document, domain string) SocialPresence {
	presence := SocialPresence{}
	
	// Social media patterns
	socialPatterns := map[string][]string{
		"linkedin": {
			"linkedin.com/company/",
			"linkedin.com/in/",
			"linkedin.com/showcase/",
		},
		"facebook": {
			"facebook.com/",
			"fb.com/",
		},
		"twitter": {
			"twitter.com/",
			"x.com/",
		},
		"instagram": {
			"instagram.com/",
		},
		"youtube": {
			"youtube.com/channel/",
			"youtube.com/c/",
			"youtube.com/user/",
			"youtube.com/@",
		},
	}
	
	// Search for social media links
	doc.Find("a[href]").Each(func(i int, sel *goquery.Selection) {
		href, exists := sel.Attr("href")
		if !exists {
			return
		}
		
		href = strings.ToLower(href)
		
		// Check LinkedIn
		for _, pattern := range socialPatterns["linkedin"] {
			if strings.Contains(href, pattern) && !strings.Contains(href, "/share") {
				presence.LinkedIn.Presence = true
				presence.LinkedIn.Link = s.cleanSocialURL(href)
				break
			}
		}
		
		// Check Facebook
		for _, pattern := range socialPatterns["facebook"] {
			if strings.Contains(href, pattern) && !strings.Contains(href, "/sharer") {
				presence.Facebook.Presence = true
				presence.Facebook.Link = s.cleanSocialURL(href)
				break
			}
		}
		
		// Check Twitter/X
		for _, pattern := range socialPatterns["twitter"] {
			if strings.Contains(href, pattern) && !strings.Contains(href, "/share") && !strings.Contains(href, "/intent") {
				presence.Twitter.Presence = true
				presence.Twitter.Link = s.cleanSocialURL(href)
				break
			}
		}
		
		// Check Instagram
		for _, pattern := range socialPatterns["instagram"] {
			if strings.Contains(href, pattern) && !strings.Contains(href, "/share") {
				presence.Instagram.Presence = true
				presence.Instagram.Link = s.cleanSocialURL(href)
				break
			}
		}
		
		// Check YouTube
		for _, pattern := range socialPatterns["youtube"] {
			if strings.Contains(href, pattern) && !strings.Contains(href, "/share") {
				presence.YouTube.Presence = true
				presence.YouTube.Link = s.cleanSocialURL(href)
				break
			}
		}
	})
	
	return presence
}

// cleanSocialURL cleans up a social media URL
func (s *SocialPresenceChecker) cleanSocialURL(url string) string {
	// Ensure URL has protocol
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		url = "https://" + url
	}
	
	// Remove trailing slashes
	url = strings.TrimSuffix(url, "/")
	
	// Remove query parameters for cleaner URLs
	if idx := strings.Index(url, "?"); idx != -1 {
		url = url[:idx]
	}
	
	return url
}

// getLinkedInCompanyDetails attempts to extract LinkedIn company details
func (s *SocialPresenceChecker) getLinkedInCompanyDetails(linkedinURL string) map[string]interface{} {
	// Note: LinkedIn requires authentication for detailed scraping
	// This is a placeholder that returns basic info
	details := make(map[string]interface{})
	
	if linkedinURL != "" {
		details["website"] = linkedinURL
		// In a real implementation, you might use LinkedIn API or other methods
		// to get more details like company size, industry, etc.
	}
	
	return details
}

// SocialPresenceResult represents social media presence check
type SocialPresenceResult struct {
	SocialPresence         SocialPresence         `json:"social_presence"`
	Employees              []map[string]interface{} `json:"employees,omitempty"`
	LinkedInCompanyDetails map[string]interface{}   `json:"linkedin_company_details,omitempty"`
}

// SocialPresence contains social media platform presence
type SocialPresence struct {
	LinkedIn  SocialPlatform `json:"linkedin"`
	Facebook  SocialPlatform `json:"facebook,omitempty"`
	Instagram SocialPlatform `json:"instagram,omitempty"`
	Twitter   SocialPlatform `json:"twitter,omitempty"`
	YouTube   SocialPlatform `json:"youtube,omitempty"`
}

// SocialPlatform represents presence on a social platform
type SocialPlatform struct {
	Presence bool   `json:"presence"`
	Link     string `json:"link,omitempty"`
}
