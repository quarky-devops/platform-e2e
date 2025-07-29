package scrapers

import (
	"crypto/sha256"
	"crypto/tls"
	"fmt"
	"net"
	"time"
)

// GetSSLFingerprint retrieves the SHA-256 fingerprint of an SSL certificate
func GetSSLFingerprint(domain string) SSLFingerprintResult {
	result := SSLFingerprintResult{
		Domain: domain,
	}

	// Try to get SSL certificate
	dialer := &net.Dialer{
		Timeout: 5 * time.Second,
	}

	conn, err := tls.DialWithDialer(dialer, "tcp", domain+":443", &tls.Config{
		InsecureSkipVerify: true,
	})
	if err != nil {
		result.Error = fmt.Sprintf("Failed to connect to %s:443: %v", domain, err)
		result.HasSHA256 = false
		return result
	}
	defer conn.Close()

	// Get the certificate
	certs := conn.ConnectionState().PeerCertificates
	if len(certs) == 0 {
		result.Error = "No certificates found"
		result.HasSHA256 = false
		return result
	}

	// Calculate SHA-256 fingerprint
	cert := certs[0]
	fingerprint := sha256.Sum256(cert.Raw)
	
	result.SHA256Fingerprint = fmt.Sprintf("%x", fingerprint)
	result.HasSHA256 = true
	
	return result
}
