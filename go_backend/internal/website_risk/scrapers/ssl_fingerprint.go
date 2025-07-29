package scrapers

import (
	"crypto/sha256"
	"crypto/tls"
	"encoding/hex"
	"fmt"
	"net"
	"strings"
	"time"
)

// SSLFingerprintChecker checks SSL certificate fingerprint
type SSLFingerprintChecker struct {
	timeout time.Duration
}

// NewSSLFingerprintChecker creates a new SSL fingerprint checker
func NewSSLFingerprintChecker() *SSLFingerprintChecker {
	return &SSLFingerprintChecker{
		timeout: 10 * time.Second,
	}
}

// Check retrieves SSL certificate fingerprint for a domain
func (s *SSLFingerprintChecker) Check(domain string) SSLFingerprintResult {
	domain = cleanDomain(domain)
	
	result := SSLFingerprintResult{
		Domain:    domain,
		HasSHA256: false,
	}
	
	// Connect to the domain on port 443
	conn, err := tls.DialWithDialer(&net.Dialer{
		Timeout: s.timeout,
	}, "tcp", fmt.Sprintf("%s:443", domain), &tls.Config{
		InsecureSkipVerify: true, // We want to get the cert even if it's invalid
	})
	
	if err != nil {
		result.Error = fmt.Sprintf("failed to connect: %v", err)
		return result
	}
	defer conn.Close()
	
	// Get the certificate chain
	certs := conn.ConnectionState().PeerCertificates
	if len(certs) == 0 {
		result.Error = "no certificates found"
		return result
	}
	
	// Get the first certificate (server certificate)
	cert := certs[0]
	
	// Calculate SHA256 fingerprint
	fingerprint := sha256.Sum256(cert.Raw)
	fingerprintHex := hex.EncodeToString(fingerprint[:])
	
	// Format fingerprint with colons
	formattedFingerprint := formatFingerprint(fingerprintHex)
	
	result.SHA256Fingerprint = formattedFingerprint
	result.HasSHA256 = true
	
	return result
}

// formatFingerprint formats the fingerprint with colons
func formatFingerprint(fingerprint string) string {
	fingerprint = strings.ToUpper(fingerprint)
	
	// Insert colons every 2 characters
	var formatted []string
	for i := 0; i < len(fingerprint); i += 2 {
		end := i + 2
		if end > len(fingerprint) {
			end = len(fingerprint)
		}
		formatted = append(formatted, fingerprint[i:end])
	}
	
	return strings.Join(formatted, ":")
}

// SSLFingerprintResult represents SSL fingerprint check result
type SSLFingerprintResult struct {
	Domain            string `json:"domain"`
	SHA256Fingerprint string `json:"sha256_fingerprint,omitempty"`
	HasSHA256         bool   `json:"has_sha256"`
	Error             string `json:"error,omitempty"`
}
