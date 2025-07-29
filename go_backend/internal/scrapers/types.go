package scrapers

import "time"

// ScraperResult represents the result of any scraper operation
type ScraperResult struct {
	Success bool          `json:"success"`
	Data    interface{}   `json:"data"`
	Error   string        `json:"error,omitempty"`
	Timing  time.Duration `json:"timing,omitempty"`
}

// HTTPSResult represents the result of HTTPS check
type HTTPSResult struct {
	HasHTTPS  bool   `json:"has_https"`
	Protocol  string `json:"protocol"`
	Status    string `json:"status"`
	PageTitle string `json:"page_title,omitempty"`
	Error     string `json:"error,omitempty"`
}

// SSLFingerprintResult represents SSL fingerprint check result
type SSLFingerprintResult struct {
	Domain            string `json:"domain"`
	SHA256Fingerprint string `json:"sha256_fingerprint,omitempty"`
	HasSHA256         bool   `json:"has_sha256"`
	Error             string `json:"error,omitempty"`
}

// WhoisResult represents WHOIS data
type WhoisResult struct {
	DomainName     string    `json:"domain_name,omitempty"`
	Registrar      string    `json:"registrar,omitempty"`
	CreationDate   time.Time `json:"creation_date,omitempty"`
	ExpirationDate time.Time `json:"expiration_date,omitempty"`
	UpdatedDate    time.Time `json:"updated_date,omitempty"`
	NameServers    []string  `json:"name_servers,omitempty"`
	Error          string    `json:"error,omitempty"`
}

// PrivacyTermsResult represents privacy and terms check result
type PrivacyTermsResult struct {
	IsAccessible          bool   `json:"is_accessible"`
	SSLValid              bool   `json:"ssl_valid"`
	TermsOfServicePresent bool   `json:"terms_of_service_present"`
	PrivacyPolicyPresent  bool   `json:"privacy_policy_present"`
	LegalName             string `json:"legal_name,omitempty"`
}

// URLVoidResult represents URLVoid scan result
type URLVoidResult struct {
	WebsiteAddress    string           `json:"website_address,omitempty"`
	LastAnalysis      string           `json:"last_analysis,omitempty"`
	DetectionsCounts  DetectionsCounts `json:"detections_counts,omitempty"`
	RegisteredOn      string           `json:"registered_on,omitempty"`
	RegisteredSince   string           `json:"registered_since,omitempty"`
	IPAddress         string           `json:"ip_address,omitempty"`
	ReverseDNS        string           `json:"reverse_dns,omitempty"`
	ASN               string           `json:"asn,omitempty"`
	ServerLocation    string           `json:"server_location,omitempty"`
	LatitudeLongitude string           `json:"latitude_longitude,omitempty"`
	City              string           `json:"city,omitempty"`
	Region            string           `json:"region,omitempty"`
	Error             string           `json:"error,omitempty"`
}

// IPVoidResult represents the result of IPVoid scan
type IPVoidResult struct {
	IPAddress       string            `json:"ip_address"`
	CountryCode     string            `json:"country_code"`
	CountryName     string            `json:"country_name"`
	ISP             string            `json:"isp"`
	ASN             string            `json:"asn"`
	DetectionsCount DetectionsCounts  `json:"detections_count"`
	ReverseHostname string            `json:"reverse_hostname"`
	BlacklistStatus map[string]string `json:"blacklist_status,omitempty"`
	Error           string            `json:"error,omitempty"`
}

// PageSizeResult represents the result of page size check
type PageSizeResult struct {
	PageSizeKB    int    `json:"page_size_kb"`
	PageSizeBytes int    `json:"page_size_bytes"`
	LoadTime      string `json:"load_time,omitempty"`
	Error         string `json:"error,omitempty"`
}

// TrafficVolumeResult represents traffic volume data
type TrafficVolumeResult struct {
	GlobalRank       string `json:"global_rank"`
	CountryRank      string `json:"country_rank"`
	MonthlyVisits    string `json:"monthly_visits"`
	BounceRate       string `json:"bounce_rate"`
	PagesPerVisit    string `json:"pages_per_visit"`
	AvgVisitDuration string `json:"avg_visit_duration"`
	Error            string `json:"error,omitempty"`
}

// PopupAdsResult represents popup and ads detection
type PopupAdsResult struct {
	HasPopups bool   `json:"has_popups"`
	HasAds    bool   `json:"has_ads"`
	Error     string `json:"error,omitempty"`
}

// DetectionsCounts represents detection counts from security scanners
type DetectionsCounts struct {
	Detected int `json:"detected"`
	Checks   int `json:"checks"`
}

// SocialPresenceResult represents social media presence check
type SocialPresenceResult struct {
	SocialPresence SocialPresence `json:"social_presence"`
}

// SocialPresence contains social media platform presence
type SocialPresence struct {
	LinkedIn LinkedInPresence `json:"linkedin"`
}

// LinkedInPresence represents LinkedIn presence data
type LinkedInPresence struct {
	Presence bool   `json:"presence"`
	URL      string `json:"url,omitempty"`
}

// RiskAssessment represents the complete risk assessment result
type RiskAssessment struct {
	DomainName           string                   `json:"domain_name"`
	MerchantBusiness     MerchantBusiness         `json:"merchant_business"`
	MCCDetails           MCCDetails               `json:"mcc_details"`
	PrivacyAndTerms      PrivacyTermsResult       `json:"privacy_and_terms"`
	HTTPSCheck           HTTPSResult              `json:"https_check"`
	SSLSha256Fingerprint SSLFingerprintResult     `json:"ssl_sha_256_fingerprint"`
	SocialPresence       SocialPresenceResult     `json:"social_presence"`
	Whois                WhoisResult              `json:"whois"`
	GoDaddyWhois         GoDaddyWhoisResult       `json:"godaddy_whois"`
	URLVoid              URLVoidResult            `json:"urlvoid"`
	IPVoid               IPVoidResult             `json:"ipvoid"`
	GoogleSafeBrowsing   GoogleSafeBrowsingResult `json:"google_safe_browsing"`
	TrancoList           TrancoListResult         `json:"tranco_list"`
	PageSize             PageSizeResult           `json:"page_size"`
	TrafficVolume        TrafficVolumeResult      `json:"traffic_volume"`
	PopupAndAds          PopupAdsResult           `json:"popup_and_ads"`
	IsRiskyGeopolitical  GeopoliticalRisk         `json:"is_risky_geopolitical"`
	RiskScore            int                      `json:"risk_score"`
	RiskCategory         string                   `json:"risk_category"`
	RiskBreakdown        map[string]int           `json:"risk_breakdown"`
	CreatedAt            time.Time                `json:"created_at"`
}

// MerchantBusiness represents merchant business details
type MerchantBusiness struct {
	CountryCode      string `json:"country_code"`
	CountrySupported bool   `json:"country_supported"`
}

// MCCDetails represents MCC classification details
type MCCDetails struct {
	MCCCode       string `json:"mcc_code"`
	MCCCategory   string `json:"mcc_category"`
	MCCRestricted bool   `json:"mcc_restricted"`
}

// GeopoliticalRisk represents geopolitical risk assessment
type GeopoliticalRisk struct {
	IsRisky bool `json:"is_risky"`
}

// Constants for risk categories and countries
var (
	RiskyCountries = []string{
		"CU", "IR", "KP", "SY", "RU", "BY", "MM", "VE", "YE", "ZW",
		"SD", "SS", "LY", "SO", "CF", "CD", "UA",
	}

	OnboardingSupportedCountries = []string{
		"BE", "DE", "ES", "FR", "GB", "NL", "IT", "US",
	}

	RestrictedMCCCodes = []string{
		"0742", "4411", "4511", "4722", "4812", "4814", "4816", "4829", "5047", "5094", "5099", "5499", "5699",
		"5734", "5912", "5921", "5933", "5966", "5968", "5969", "5971", "5993", "5995", "5999", "6012", "6051",
		"6211", "6282", "6300", "6531", "7011", "7273", "7276", "7297", "7299", "7322", "7372", "7375", "7389",
		"7393", "7399", "7512", "7841", "7994", "7995", "7996", "7999", "8011", "8099", "8299", "8398", "8399",
		"8651", "8999", "9223", "9399",
	}

	RiskCategories = map[string][2]int{
		"low_risk":  {0, 45},
		"med_risk":  {45, 81},
		"high_risk": {81, 100},
	}
)

// Helper functions
func IsRiskyCountry(countryCode string) bool {
	for _, country := range RiskyCountries {
		if country == countryCode {
			return true
		}
	}
	return false
}

func IsCountrySupported(countryCode string) bool {
	for _, country := range OnboardingSupportedCountries {
		if country == countryCode {
			return true
		}
	}
	return false
}

func IsRestrictedMCC(mccCode string) bool {
	for _, mcc := range RestrictedMCCCodes {
		if mcc == mccCode {
			return true
		}
	}
	return false
}
