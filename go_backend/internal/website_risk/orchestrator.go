package website_risk

import (
	"sync"
	"time"

	mainScrapers "bitbucket.org/quarkfin/platform-e2e/go_backend/internal/scrapers"
	localScrapers "bitbucket.org/quarkfin/platform-e2e/go_backend/internal/website_risk/scrapers"
)

// Orchestrator manages the execution of all scrapers
type Orchestrator struct {
	httpsChecker    *localScrapers.HTTPSChecker
	sslChecker      *localScrapers.SSLFingerprintChecker
	privacyChecker  *localScrapers.PrivacyTermsChecker
	socialChecker   *localScrapers.SocialPresenceChecker
	whoisChecker    *localScrapers.WhoisChecker
	pageSizeChecker *localScrapers.PageSizeChecker
	trafficChecker  *localScrapers.TrafficVolumeChecker
	popupAdsChecker *localScrapers.PopupAdsChecker
}

// ScraperResult holds the result of a scraper execution
type ScraperResult struct {
	Name     string
	Duration time.Duration
	Error    error
}

// AssessmentResult represents the result of the assessment
type AssessmentResult struct {
	HTTPSCheck      localScrapers.HTTPSResult
	SSLFingerprint  localScrapers.SSLFingerprintResult
	PrivacyAndTerms localScrapers.PrivacyTermsResult
	SocialPresence  localScrapers.SocialPresenceResult
	Whois           localScrapers.WhoisResult
	URLVoid         URLVoidResult
	PageSize        localScrapers.PageSizeResult
	TrafficVolume   mainScrapers.TrafficVolumeResult
	PopupAndAds     mainScrapers.PopupAdsResult
}

// NewOrchestrator creates a new orchestrator
func NewOrchestrator() *Orchestrator {
	return &Orchestrator{
		httpsChecker:    localScrapers.NewHTTPSChecker(),
		sslChecker:      localScrapers.NewSSLFingerprintChecker(),
		privacyChecker:  localScrapers.NewPrivacyTermsChecker(),
		socialChecker:   localScrapers.NewSocialPresenceChecker(),
		whoisChecker:    localScrapers.NewWhoisChecker(),
		pageSizeChecker: localScrapers.NewPageSizeChecker(),
		trafficChecker:  localScrapers.NewTrafficVolumeChecker(),
		popupAdsChecker: localScrapers.NewPopupAdsChecker(),
	}
}

// RunAssessment runs all scrapers for a domain
func (o *Orchestrator) RunAssessment(domain string) AssessmentResult {
	result := AssessmentResult{}
	var wg sync.WaitGroup

	// Channel for collecting results
	resultChan := make(chan interface{}, 10)

	// Run scrapers concurrently
	scraperFuncs := []func(string, chan<- interface{}){
		o.runHTTPSCheck,
		o.runSSLFingerprint,
		o.runPrivacyTerms,
		o.runSocialPresence,
		o.runWhois,
		o.runURLVoid,
		o.runPageSize,
		o.runTrafficVolume,
		o.runPopupAds,
	}

	for _, scraperFunc := range scraperFuncs {
		wg.Add(1)
		go func(fn func(string, chan<- interface{})) {
			defer wg.Done()
			fn(domain, resultChan)
		}(scraperFunc)
	}

	// Close channel when all scrapers are done
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// Collect results
	for res := range resultChan {
		switch v := res.(type) {
		case localScrapers.HTTPSResult:
			result.HTTPSCheck = v
		case localScrapers.SSLFingerprintResult:
			result.SSLFingerprint = v
		case localScrapers.PrivacyTermsResult:
			result.PrivacyAndTerms = v
		case localScrapers.SocialPresenceResult:
			result.SocialPresence = v
		case localScrapers.WhoisResult:
			result.Whois = v
		case URLVoidResult:
			result.URLVoid = v
		case localScrapers.PageSizeResult:
			result.PageSize = v
		case mainScrapers.TrafficVolumeResult:
			result.TrafficVolume = v
		case mainScrapers.PopupAdsResult:
			result.PopupAndAds = v
		}
	}

	return result
}

// Scraper implementations using real scrapers

func (o *Orchestrator) runHTTPSCheck(domain string, resultChan chan<- interface{}) {
	result := o.httpsChecker.Check(domain)
	resultChan <- result
}

func (o *Orchestrator) runSSLFingerprint(domain string, resultChan chan<- interface{}) {
	result := o.sslChecker.Check(domain)
	resultChan <- result
}

func (o *Orchestrator) runPrivacyTerms(domain string, resultChan chan<- interface{}) {
	result := o.privacyChecker.Check(domain)
	resultChan <- result
}

func (o *Orchestrator) runSocialPresence(domain string, resultChan chan<- interface{}) {
	result := o.socialChecker.Check(domain)
	resultChan <- result
}

func (o *Orchestrator) runWhois(domain string, resultChan chan<- interface{}) {
	result := o.whoisChecker.Check(domain)
	resultChan <- result
}

func (o *Orchestrator) runURLVoid(domain string, resultChan chan<- interface{}) {
	// TODO: Implement URLVoid API integration
	// For now, return mock data
	result := URLVoidResult{
		WebsiteAddress: domain,
		LastAnalysis:   time.Now().Format("2006-01-02"),
		DetectionsCounts: DetectionsCounts{
			Detected: 0,
			Checks:   30,
		},
		BlacklistTests: TestResult{
			Blacklisted: 0,
			NotListed:   30,
			TotalTests:  30,
		},
	}
	resultChan <- result
}

func (o *Orchestrator) runPageSize(domain string, resultChan chan<- interface{}) {
	result := o.pageSizeChecker.Check(domain)
	resultChan <- result
}

func (o *Orchestrator) runTrafficVolume(domain string, resultChan chan<- interface{}) {
	result := o.trafficChecker.Check(domain)
	resultChan <- result
}

func (o *Orchestrator) runPopupAds(domain string, resultChan chan<- interface{}) {
	result := o.popupAdsChecker.Check(domain)
	resultChan <- result
}
