package scrapers

import (
	"bufio"
	"fmt"
	"net"
	"regexp"
	"strings"
	"time"
)

// GetWhoisData retrieves WHOIS information for a domain
func GetWhoisData(domain string) WhoisResult {
	result := WhoisResult{}

	// Remove protocol and www prefix if present
	domain = strings.TrimPrefix(domain, "http://")
	domain = strings.TrimPrefix(domain, "https://")
	domain = strings.TrimPrefix(domain, "www.")

	// Get WHOIS server for the domain
	whoisServer := getWhoisServer(domain)
	if whoisServer == "" {
		result.Error = "Could not determine WHOIS server for domain"
		return result
	}

	// Query WHOIS server
	conn, err := net.DialTimeout("tcp", whoisServer+":43", 10*time.Second)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to connect to WHOIS server: %v", err)
		return result
	}
	defer conn.Close()

	// Set read/write timeout
	conn.SetDeadline(time.Now().Add(10 * time.Second))

	// Send domain query
	_, err = conn.Write([]byte(domain + "\r\n"))
	if err != nil {
		result.Error = fmt.Sprintf("Failed to send query: %v", err)
		return result
	}

	// Read response
	var response strings.Builder
	scanner := bufio.NewScanner(conn)
	for scanner.Scan() {
		response.WriteString(scanner.Text() + "\n")
	}

	if err := scanner.Err(); err != nil {
		result.Error = fmt.Sprintf("Failed to read response: %v", err)
		return result
	}

	// Parse WHOIS response
	return parseWhoisResponse(response.String(), domain)
}

// getWhoisServer determines the appropriate WHOIS server for a domain
func getWhoisServer(domain string) string {
	// Common WHOIS servers mapping
	whoisServers := map[string]string{
		"com":    "whois.verisign-grs.com",
		"net":    "whois.verisign-grs.com",
		"org":    "whois.pir.org",
		"info":   "whois.afilias.net",
		"biz":    "whois.neulevel.biz",
		"name":   "whois.nic.name",
		"us":     "whois.nic.us",
		"uk":     "whois.nic.uk",
		"de":     "whois.denic.de",
		"fr":     "whois.nic.fr",
		"it":     "whois.nic.it",
		"nl":     "whois.domain-registry.nl",
		"be":     "whois.dns.be",
		"es":     "whois.nic.es",
		"ca":     "whois.cira.ca",
		"au":     "whois.auda.org.au",
		"jp":     "whois.jprs.jp",
		"cn":     "whois.cnnic.net.cn",
		"in":     "whois.inregistry.net",
		"io":     "whois.nic.io",
		"co":     "whois.nic.co",
		"me":     "whois.nic.me",
		"tv":     "whois.nic.tv",
		"cc":     "whois.nic.cc",
		"ly":     "whois.nic.ly",
		"ru":     "whois.ripn.net",
		"pl":     "whois.dns.pl",
		"cz":     "whois.nic.cz",
		"sk":     "whois.sk-nic.sk",
		"hu":     "whois.nic.hu",
		"ro":     "whois.rotld.ro",
		"bg":     "whois.register.bg",
		"hr":     "whois.dns.hr",
		"si":     "whois.arnes.si",
		"lt":     "whois.domreg.lt",
		"lv":     "whois.nic.lv",
		"ee":     "whois.tld.ee",
		"fi":     "whois.fi",
		"se":     "whois.iis.se",
		"no":     "whois.norid.no",
		"dk":     "whois.dk-hostmaster.dk",
		"at":     "whois.nic.at",
		"ch":     "whois.nic.ch",
		"li":     "whois.nic.li",
		"lu":     "whois.dns.lu",
		"ie":     "whois.domainregistry.ie",
		"is":     "whois.isnic.is",
		"pt":     "whois.dns.pt",
		"gr":     "whois.nic.gr",
		"tr":     "whois.nic.tr",
		"il":     "whois.isoc.org.il",
		"za":     "whois.registry.net.za",
		"br":     "whois.registro.br",
		"ar":     "whois.nic.ar",
		"cl":     "whois.nic.cl",
		"co.uk":  "whois.nic.uk",
		"org.uk": "whois.nic.uk",
		"ac.uk":  "whois.nic.uk",
		"gov.uk": "whois.nic.uk",
		"com.au": "whois.auda.org.au",
		"net.au": "whois.auda.org.au",
		"org.au": "whois.auda.org.au",
		"edu.au": "whois.auda.org.au",
		"gov.au": "whois.auda.org.au",
		"asn.au": "whois.auda.org.au",
		"id.au":  "whois.auda.org.au",
	}

	// Get TLD from domain
	parts := strings.Split(domain, ".")
	if len(parts) < 2 {
		return ""
	}

	// Check for two-part TLD (e.g., co.uk)
	if len(parts) >= 3 {
		twoPartTLD := parts[len(parts)-2] + "." + parts[len(parts)-1]
		if server, exists := whoisServers[twoPartTLD]; exists {
			return server
		}
	}

	// Check for single-part TLD
	tld := parts[len(parts)-1]
	if server, exists := whoisServers[tld]; exists {
		return server
	}

	return ""
}

// parseWhoisResponse parses the WHOIS response and extracts relevant information
func parseWhoisResponse(response, domain string) WhoisResult {
	result := WhoisResult{}

	// Regular expressions for common WHOIS fields
	patterns := map[string]*regexp.Regexp{
		"registrar":      regexp.MustCompile(`(?i)registrar:\s*(.+)`),
		"creation_date":  regexp.MustCompile(`(?i)(?:creation date|registered|created):\s*(.+)`),
		"expiration_date": regexp.MustCompile(`(?i)(?:expir|expires):\s*(.+)`),
		"updated_date":   regexp.MustCompile(`(?i)(?:updated|last updated):\s*(.+)`),
		"name_servers":   regexp.MustCompile(`(?i)name server:\s*(.+)`),
	}

	lines := strings.Split(response, "\n")
	
	for _, line := range lines {
		line = strings.TrimSpace(line)
		
		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "%") || strings.HasPrefix(line, "#") {
			continue
		}

		// Check registrar
		if match := patterns["registrar"].FindStringSubmatch(line); match != nil {
			result.Registrar = strings.TrimSpace(match[1])
		}

		// Check creation date
		if match := patterns["creation_date"].FindStringSubmatch(line); match != nil {
			if date, err := parseWhoisDate(strings.TrimSpace(match[1])); err == nil {
				result.CreationDate = date
			}
		}

		// Check expiration date
		if match := patterns["expiration_date"].FindStringSubmatch(line); match != nil {
			if date, err := parseWhoisDate(strings.TrimSpace(match[1])); err == nil {
				result.ExpirationDate = date
			}
		}

		// Check updated date
		if match := patterns["updated_date"].FindStringSubmatch(line); match != nil {
			if date, err := parseWhoisDate(strings.TrimSpace(match[1])); err == nil {
				result.UpdatedDate = date
			}
		}

		// Check name servers
		if match := patterns["name_servers"].FindStringSubmatch(line); match != nil {
			ns := strings.TrimSpace(match[1])
			if ns != "" {
				result.NameServers = append(result.NameServers, ns)
			}
		}
	}

	result.DomainName = domain
	
	return result
}

// parseWhoisDate parses various WHOIS date formats
func parseWhoisDate(dateStr string) (time.Time, error) {
	// Common WHOIS date formats
	formats := []string{
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05.000Z",
		"2006-01-02T15:04:05-07:00",
		"2006-01-02 15:04:05",
		"2006-01-02",
		"02-Jan-2006",
		"January 2, 2006",
		"2006/01/02",
		"01/02/2006",
		"2006.01.02",
		"20060102",
	}

	// Clean up the date string
	dateStr = strings.TrimSpace(dateStr)
	dateStr = strings.Split(dateStr, " ")[0] // Take only the first part (date)
	
	for _, format := range formats {
		if date, err := time.Parse(format, dateStr); err == nil {
			return date, nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse date: %s", dateStr)
}
