package scrapers

import (
	"fmt"
	"net"
	"regexp"
	"strings"
	"time"
)

// WhoisChecker performs WHOIS lookups
type WhoisChecker struct {
	timeout time.Duration
}

// NewWhoisChecker creates a new WHOIS checker
func NewWhoisChecker() *WhoisChecker {
	return &WhoisChecker{
		timeout: 10 * time.Second,
	}
}

// Check performs WHOIS lookup for a domain
func (w *WhoisChecker) Check(domain string) WhoisResult {
	domain = cleanDomain(domain)
	
	result := WhoisResult{
		DomainName: domain,
	}
	
	// Get WHOIS server for the domain
	whoisServer := w.getWhoisServer(domain)
	if whoisServer == "" {
		result.Error = "unable to determine WHOIS server"
		return result
	}
	
	// Query WHOIS server
	whoisData, err := w.queryWhois(domain, whoisServer)
	if err != nil {
		result.Error = fmt.Sprintf("WHOIS query failed: %v", err)
		return result
	}
	
	// Parse WHOIS data
	w.parseWhoisData(whoisData, &result)
	
	return result
}

// getWhoisServer determines the appropriate WHOIS server for a domain
func (w *WhoisChecker) getWhoisServer(domain string) string {
	// Extract TLD
	parts := strings.Split(domain, ".")
	if len(parts) < 2 {
		return ""
	}
	
	tld := parts[len(parts)-1]
	
	// Common WHOIS servers by TLD
	whoisServers := map[string]string{
		"com":   "whois.verisign-grs.com",
		"net":   "whois.verisign-grs.com",
		"org":   "whois.pir.org",
		"info":  "whois.afilias.net",
		"biz":   "whois.biz",
		"edu":   "whois.educause.edu",
		"gov":   "whois.dotgov.gov",
		"io":    "whois.nic.io",
		"co":    "whois.nic.co",
		"uk":    "whois.nic.uk",
		"ca":    "whois.cira.ca",
		"au":    "whois.auda.org.au",
		"de":    "whois.denic.de",
		"fr":    "whois.afnic.fr",
		"it":    "whois.nic.it",
		"nl":    "whois.sidn.nl",
		"ru":    "whois.tcinet.ru",
		"br":    "whois.registro.br",
		"jp":    "whois.jprs.jp",
		"cn":    "whois.cnnic.cn",
		"in":    "whois.inregistry.net",
		"eu":    "whois.eu",
		"us":    "whois.nic.us",
		"me":    "whois.nic.me",
		"tv":    "whois.nic.tv",
		"cc":    "whois.nic.cc",
		"ws":    "whois.website.ws",
		"be":    "whois.dns.be",
		"es":    "whois.nic.es",
		"ch":    "whois.nic.ch",
		"se":    "whois.iis.se",
		"no":    "whois.norid.no",
		"dk":    "whois.dk-hostmaster.dk",
		"ai":    "whois.nic.ai",
		"app":   "whois.nic.google",
		"dev":   "whois.nic.google",
		"tech":  "whois.nic.tech",
		"xyz":   "whois.nic.xyz",
		"online": "whois.nic.online",
		"store": "whois.nic.store",
		"shop":  "whois.nic.shop",
		"site":  "whois.nic.site",
	}
	
	if server, ok := whoisServers[tld]; ok {
		return server
	}
	
	// Default to IANA for unknown TLDs
	return "whois.iana.org"
}

// queryWhois queries the WHOIS server
func (w *WhoisChecker) queryWhois(domain, server string) (string, error) {
	// Connect to WHOIS server
	conn, err := net.DialTimeout("tcp", server+":43", w.timeout)
	if err != nil {
		return "", err
	}
	defer conn.Close()
	
	// Send query
	_, err = conn.Write([]byte(domain + "\r\n"))
	if err != nil {
		return "", err
	}
	
	// Read response
	var response []byte
	buffer := make([]byte, 1024)
	for {
		conn.SetReadDeadline(time.Now().Add(w.timeout))
		n, err := conn.Read(buffer)
		if err != nil {
			break
		}
		response = append(response, buffer[:n]...)
	}
	
	return string(response), nil
}

// parseWhoisData parses WHOIS response
func (w *WhoisChecker) parseWhoisData(data string, result *WhoisResult) {
	lines := strings.Split(data, "\n")
	
	// Regular expressions for common WHOIS fields
	registrarRe := regexp.MustCompile(`(?i)registrar:\s*(.+)`)
	createdRe := regexp.MustCompile(`(?i)(?:created|creation date|registered on):\s*(.+)`)
	expiresRe := regexp.MustCompile(`(?i)(?:expires|expiry date|expiration date):\s*(.+)`)
	updatedRe := regexp.MustCompile(`(?i)(?:updated|last modified|last updated):\s*(.+)`)
	nameServerRe := regexp.MustCompile(`(?i)(?:name server|nserver|ns):\s*(.+)`)
	statusRe := regexp.MustCompile(`(?i)(?:status|domain status):\s*(.+)`)
	
	for _, line := range lines {
		line = strings.TrimSpace(line)
		
		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "%") || strings.HasPrefix(line, "#") {
			continue
		}
		
		// Registrar
		if match := registrarRe.FindStringSubmatch(line); match != nil {
			result.Registrar = strings.TrimSpace(match[1])
		}
		
		// Creation date
		if match := createdRe.FindStringSubmatch(line); match != nil {
			if date, err := parseWhoisDate(strings.TrimSpace(match[1])); err == nil {
				result.CreationDate = date
			}
		}
		
		// Expiration date
		if match := expiresRe.FindStringSubmatch(line); match != nil {
			if date, err := parseWhoisDate(strings.TrimSpace(match[1])); err == nil {
				result.ExpirationDate = date
			}
		}
		
		// Updated date
		if match := updatedRe.FindStringSubmatch(line); match != nil {
			if date, err := parseWhoisDate(strings.TrimSpace(match[1])); err == nil {
				result.UpdatedDate = date
			}
		}
		
		// Name servers
		if match := nameServerRe.FindStringSubmatch(line); match != nil {
			ns := strings.TrimSpace(match[1])
			// Remove any trailing dots
			ns = strings.TrimSuffix(ns, ".")
			result.NameServers = append(result.NameServers, ns)
		}
		
		// Status
		if match := statusRe.FindStringSubmatch(line); match != nil {
			status := strings.TrimSpace(match[1])
			result.Status = append(result.Status, status)
		}
	}
}

// parseWhoisDate attempts to parse various date formats from WHOIS
func parseWhoisDate(dateStr string) (time.Time, error) {
	// Common WHOIS date formats
	formats := []string{
		"2006-01-02T15:04:05Z",
		"2006-01-02 15:04:05",
		"2006-01-02",
		"02-Jan-2006",
		"02/01/2006",
		"2006.01.02",
		"2006-01-02T15:04:05.000Z",
		"Mon Jan 02 15:04:05 MST 2006",
		"02-Jan-2006 15:04:05 UTC",
		"2006-01-02T15:04:05-07:00",
	}
	
	for _, format := range formats {
		if date, err := time.Parse(format, dateStr); err == nil {
			return date, nil
		}
	}
	
	return time.Time{}, fmt.Errorf("unable to parse date: %s", dateStr)
}

// WhoisResult represents WHOIS data
type WhoisResult struct {
	DomainName     string    `json:"domain_name,omitempty"`
	Registrar      string    `json:"registrar,omitempty"`
	CreationDate   time.Time `json:"creation_date,omitempty"`
	ExpirationDate time.Time `json:"expiration_date,omitempty"`
	UpdatedDate    time.Time `json:"updated_date,omitempty"`
	NameServers    []string  `json:"name_servers,omitempty"`
	Status         []string  `json:"status,omitempty"`
	Error          string    `json:"error,omitempty"`
}