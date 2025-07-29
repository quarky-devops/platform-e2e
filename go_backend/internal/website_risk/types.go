package website_risk

import (
	"time"
)

// Request and Response types
type DoRiskAssessmentRequest struct {
	Website            string `json:"Website" binding:"required"`
	ID                 string `json:"Id" binding:"required"` // Salesforce ID
	BillingCountryCode string `json:"BillingCountryCode" binding:"required"`
	Description        string `json:"Description,omitempty"`
	AnnualRevenue      string `json:"Annual_Revenue__c,omitempty"`
	CBSICCode          string `json:"CB_SIC_Code__c,omitempty"`
	CBPayMethod        string `json:"CB_Pay_Method__c,omitempty"`
}

type GetRiskAssessmentRequest struct {
	Website string `json:"website" binding:"required"`
}

type ManualQualificationUpdateRequest struct {
	Website             string `json:"website" binding:"required"`
	QualificationStatus string `json:"qualification_status" binding:"required,oneof=Qualified 'Not Qualified'"`
}

type DoRiskAssessmentResponse struct {
	Status  string `json:"status"`
	Website string `json:"website"`
	ID      string `json:"id"`
}

// WebsiteRiskAssessment represents a complete website risk assessment
type WebsiteRiskAssessment struct {
	ID                  string                 `json:"id"`
	Domain              string                 `json:"domain_name"`
	Website             string                 `json:"website"`
	BillingCountryCode  string                 `json:"billing_country_code"`
	SalesforceID        string                 `json:"salesforce_id"`
	Status              string                 `json:"status"`
	QualificationStatus string                 `json:"qualification_status,omitempty"`
	RiskScore           int                    `json:"risk_score"`
	RiskCategory        string                 `json:"risk_category"`
	RiskBreakdown       map[string]int         `json:"risk_breakdown"`
	MCCDetails          MCCDetails             `json:"mcc_details"`
	MerchantBusiness    MerchantBusiness       `json:"merchant_business"`
	PrivacyAndTerms     PrivacyTermsResult     `json:"privacy_and_terms"`
	HTTPSCheck          HTTPSResult            `json:"https_check"`
	SSLFingerprint      SSLFingerprintResult   `json:"ssl_sha_256_fingerprint"`
	SocialPresence      SocialPresenceResult   `json:"social_presence"`
	Whois               WhoisResult            `json:"whois"`
	GoDaddyWhois        map[string]interface{} `json:"godaddy_whois,omitempty"`
	URLVoid             URLVoidResult          `json:"urlvoid"`
	IPVoid              IPVoidResult           `json:"ipvoid,omitempty"`
	SSLTrustBlacklist   map[string]interface{} `json:"ssltrust_blacklist,omitempty"`
	SSLOrgReport        map[string]interface{} `json:"ssl_org_report,omitempty"`
	GoogleSafeBrowsing  map[string]interface{} `json:"google_safe_browsing,omitempty"`
	TrancoList          map[string]interface{} `json:"tranco_list,omitempty"`
	MXToolbox           map[string]interface{} `json:"mxtoolbox,omitempty"`
	PageSize            PageSizeResult         `json:"page_size"`
	TrafficVolume       TrafficVolumeResult    `json:"traffic_vol"`
	PopupAndAds         PopupAdsResult         `json:"popup_and_ads"`
	IsRiskyGeopolitical GeopoliticalRisk       `json:"is_risky_geopolitical"`
	SalesforceRequest   map[string]interface{} `json:"salesforce_request"`
	Version             string                 `json:"version,omitempty"`
	CreatedAt           time.Time              `json:"created_at"`
	UpdatedAt           time.Time              `json:"updated_at"`
}

// MerchantBusiness represents merchant business details
type MerchantBusiness struct {
	CountryCode      string `json:"country_code"`
	CountrySupported bool   `json:"country_supported"`
}

// MCCDetails represents MCC classification details
type MCCDetails struct {
	MCCCode                 string  `json:"mcc_code"`
	Description             string  `json:"description,omitempty"`
	MCCRestricted           bool    `json:"mcc_restricted"`
	Confidence              float64 `json:"confidence,omitempty"`
	ReasonOfConfidenceScore string  `json:"reason of confidence Score,omitempty"`
}

// HTTPSResult represents the result of HTTPS check
type HTTPSResult struct {
	HasHTTPS  bool   `json:"has_https"`
	Protocol  string `json:"protocol,omitempty"`
	Status    string `json:"status,omitempty"`
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

// PrivacyTermsResult represents privacy and terms check result
type PrivacyTermsResult struct {
	IsAccessible          bool   `json:"is_accessible"`
	SSLValid              bool   `json:"ssl_valid"`
	TermsOfServicePresent bool   `json:"terms_of_service_present"`
	PrivacyPolicyPresent  bool   `json:"privacy_policy_present"`
	LegalName             string `json:"legal_name,omitempty"`
}

// SocialPresenceResult represents social media presence check
type SocialPresenceResult struct {
	SocialPresence         SocialPresence           `json:"social_presence"`
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

// URLVoidResult represents URLVoid scan result
type URLVoidResult struct {
	WebsiteAddress     string           `json:"website_address,omitempty"`
	LastAnalysis       string           `json:"last_analysis,omitempty"`
	DetectionsCounts   DetectionsCounts `json:"detections_counts,omitempty"`
	BlacklistTests     TestResult       `json:"blacklist_tests,omitempty"`
	CombinedListTests  TestResult       `json:"combinedlist_tests,omitempty"`
	WhitelistTests     TestResult       `json:"whitelist_tests,omitempty"`
	InformationalTests TestResult       `json:"informationallist_tests,omitempty"`
	RegisteredOn       string           `json:"registered_on,omitempty"`
	RegisteredSince    string           `json:"registered_since,omitempty"`
	IPAddress          string           `json:"ip_address,omitempty"`
	ReverseDNS         string           `json:"reverse_dns,omitempty"`
	ASN                string           `json:"asn,omitempty"`
	ServerLocation     string           `json:"server_location,omitempty"`
	LatitudeLongitude  string           `json:"latitude_longitude,omitempty"`
	City               string           `json:"city,omitempty"`
	Region             string           `json:"region,omitempty"`
	Error              string           `json:"error,omitempty"`
}

// TestResult represents test results from security scanners
type TestResult struct {
	Blacklisted int `json:"blacklisted"`
	NotListed   int `json:"not_listed"`
	TotalTests  int `json:"total_tests"`
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

// DetectionsCounts represents detection counts from security scanners
type DetectionsCounts struct {
	Detected int `json:"detected"`
	Checks   int `json:"checks"`
}

// PageSizeResult represents the result of page size check
type PageSizeResult struct {
	PageSizeKB    interface{} `json:"Page Size (KB)"`
	PageSizeBytes interface{} `json:"Page Size (Bytes)"`
	PageURL       string      `json:"Page URL,omitempty"`
	LoadTime      string      `json:"load_time,omitempty"`
	Error         string      `json:"error,omitempty"`
}

// TrafficVolumeResult represents traffic volume data
type TrafficVolumeResult struct {
	LastMonthTraffic     interface{} `json:"last_month_traffic,omitempty"`
	PreviousMonthTraffic interface{} `json:"previous_month_traffic,omitempty"`
	YearAgoTraffic       interface{} `json:"year_ago_traffic,omitempty"`
	GlobalRank           string      `json:"global_rank,omitempty"`
	CountryRank          string      `json:"country_rank,omitempty"`
	MonthlyVisits        string      `json:"monthly_visits,omitempty"`
	BounceRate           string      `json:"bounce_rate,omitempty"`
	PagesPerVisit        string      `json:"pages_per_visit,omitempty"`
	AvgVisitDuration     string      `json:"avg_visit_duration,omitempty"`
	Error                string      `json:"error,omitempty"`
}

// PopupAdsResult represents popup and ads detection
type PopupAdsResult struct {
	HasPopups bool   `json:"has_popups"`
	HasAds    bool   `json:"has_ads"`
	Error     string `json:"error,omitempty"`
}

// GeopoliticalRisk represents geopolitical risk assessment
type GeopoliticalRisk struct {
	IsRisky bool `json:"is_risky"`
}

// Constants for risk assessment
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
