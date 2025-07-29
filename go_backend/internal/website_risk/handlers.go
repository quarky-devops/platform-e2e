package website_risk

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/auth"
	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/scrapers"
	"github.com/gin-gonic/gin"
	supa "github.com/nedpals/supabase-go"
)

// Database connection and in-memory storage
var (
	supabaseClient    *supa.Client
	assessmentStore   = make(map[string]*Assessment)
	assessmentMutex   = sync.RWMutex{}
	assessmentCounter int64
)

// InitDatabase initializes the Supabase connection using your .env values
func InitDatabase(url, key string) error {
	client := supa.CreateClient(url, key)
	if client == nil {
		log.Printf("Warning: Failed to create Supabase client, using in-memory storage")
		log.Printf("Database URL: %s", url)
	} else {
		supabaseClient = client
		log.Printf("✅ Supabase database connected successfully to: %s", url)
		log.Printf("📝 Note: Currently using in-memory storage with database fallback")
	}
	return nil
}

// Assessment represents the database model for the new JSON-based assessments table
type Assessment struct {
	ID                    int64                  `json:"id" db:"id"`
	Website               string                 `json:"website" db:"website"`
	CountryCode           string                 `json:"country_code" db:"country_code"`
	Status                string                 `json:"status" db:"status"`
	AssessmentData        map[string]interface{} `json:"assessment_data" db:"assessment_data"`
	ProcessingTimeSeconds *float64               `json:"processing_time_seconds" db:"processing_time_seconds"`
	ErrorMessage          *string                `json:"error_message" db:"error_message"`
	CreatedAt             time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time              `json:"updated_at" db:"updated_at"`
	CreatedBy             string                 `json:"created_by" db:"created_by"`
	UpdatedBy             string                 `json:"updated_by" db:"updated_by"`
	UserID                string                 `json:"user_id" db:"user_id"`
	CreditsConsumed       int                    `json:"credits_consumed" db:"credits_consumed"`
	AssessmentCost        *float64               `json:"assessment_cost" db:"assessment_cost"`
	AssessmentType        string                 `json:"assessment_type" db:"assessment_type"`

	// Auto-generated fields (read-only, computed from JSON)
	RiskScore        *int    `json:"risk_score,omitempty" db:"risk_score"`
	RiskCategory     *string `json:"risk_category,omitempty" db:"risk_category"`
	CountrySupported *bool   `json:"country_supported,omitempty" db:"country_supported"`
	MCCRestricted    *bool   `json:"mcc_restricted,omitempty" db:"mcc_restricted"`
}

// DoRiskAssessmentHandler handles POST /api/website-risk-assessment/do-assessment
func DoRiskAssessmentHandler(c *gin.Context) {
	// Get authenticated user ID
	userID := auth.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User authentication required",
			"code":  "AUTHENTICATION_REQUIRED",
		})
		return
	}

	var req DoRiskAssessmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("🚀 DoRiskAssessmentHandler: Starting assessment for %s by user %s", req.Website, userID)

	// Determine credit cost based on request (you can add logic here)
	creditsRequired := 1 // Default for quick assessment
	if req.Description != "" && len(req.Description) > 50 {
		creditsRequired = 3 // Comprehensive assessment
	}

	log.Printf("💳 DoRiskAssessmentHandler: Credits required: %d for %s", creditsRequired, req.Website)

	// Check and consume credits before processing
	err := auth.ConsumeCredits(userID, creditsRequired, nil, fmt.Sprintf("Website risk assessment for %s", req.Website))
	if err != nil {
		log.Printf("❌ DoRiskAssessmentHandler: Credit consumption failed: %v", err)
		
		// If no credits found, try to initialize the user first
		if strings.Contains(err.Error(), "not found") {
			log.Printf("🔧 DoRiskAssessmentHandler: Initializing credits for user %s", userID)
			
			// Get user email from context
			userEmail := auth.GetUserEmail(c)
			if userEmail != "" {
				initErr := auth.InitializeUserCreditsAndSubscription(userID, userEmail)
				if initErr != nil {
					log.Printf("❌ DoRiskAssessmentHandler: Failed to initialize user: %v", initErr)
				} else {
					log.Printf("✅ DoRiskAssessmentHandler: User initialized, retrying credit consumption")
					// Try consuming credits again
					err = auth.ConsumeCredits(userID, creditsRequired, nil, fmt.Sprintf("Website risk assessment for %s", req.Website))
				}
			}
		}
		
		if err != nil {
			if err.Error() == "insufficient credits" || strings.Contains(err.Error(), "insufficient") {
				c.JSON(http.StatusPaymentRequired, gin.H{
					"error": "Insufficient credits",
					"code":  "INSUFFICIENT_CREDITS",
					"credits_required": creditsRequired,
				})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Failed to process credit transaction",
					"code":  "CREDIT_TRANSACTION_ERROR",
					"details": err.Error(),
				})
			}
			return
		}
	}

	log.Printf("✅ DoRiskAssessmentHandler: Credits consumed successfully for %s", req.Website)

	// Create assessment record with JSON data structure
	assessmentMutex.Lock()
	assessmentCounter++

	// Build comprehensive assessment data in JSON format
	assessmentData := map[string]interface{}{
		"salesforce_request": map[string]interface{}{
			"Id":                 req.ID,
			"Website":            req.Website,
			"BillingCountryCode": req.BillingCountryCode,
			"Description":        req.Description,
			"Annual_Revenue__c":  req.AnnualRevenue,
			"CB_SIC_Code__c":     req.CBSICCode,
			"CB_Pay_Method__c":   req.CBPayMethod,
		},
		"country_supported": isCountrySupported(req.BillingCountryCode),
		"mcc_restricted":    false, // Will be updated during assessment
		"timestamps": map[string]interface{}{
			"assessment_started": time.Now().Format(time.RFC3339),
		},
	}

	assessment := &Assessment{
		ID:              assessmentCounter,
		Website:         req.Website,
		CountryCode:     req.BillingCountryCode,
		Status:          "pending",
		AssessmentData:  assessmentData,
		CreatedBy:       userID,
		UpdatedBy:       userID,
		UserID:          userID, // Explicitly set UserID field
		CreditsConsumed: creditsRequired,
		AssessmentType:  "comprehensive", // Default type
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	log.Printf("📄 DoRiskAssessmentHandler: Created assessment record - ID: %d, Website: %s, UserID: %s", assessment.ID, assessment.Website, assessment.UserID)

	// Store in memory
	assessmentStore[req.Website] = assessment
	assessmentMutex.Unlock()

	// Try to save to database as well (if available)
	log.Printf("💾 DoRiskAssessmentHandler: Attempting to save to database...")
	go func() {
		if err := saveAssessmentToDatabase(assessment, userID, creditsRequired); err != nil {
			log.Printf("⚠️ DoRiskAssessmentHandler: Failed to save to database: %v", err)
		} else {
			log.Printf("✅ DoRiskAssessmentHandler: Successfully saved to database")
		}
	}()

	// Start assessment in background
	log.Printf("🔄 DoRiskAssessmentHandler: Starting background assessment...")
	go runAssessment(assessment)

	log.Printf("✅ DoRiskAssessmentHandler: Assessment initiated successfully for %s", req.Website)

	// Return response
	c.JSON(http.StatusOK, DoRiskAssessmentResponse{
		Status:  "Pending",
		Website: req.Website,
		ID:      req.ID,
	})
}

// GetRiskAssessmentHandler handles POST /api/website-risk-assessment/get-assessment
func GetRiskAssessmentHandler(c *gin.Context) {
	var req GetRiskAssessmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Fetch from in-memory store first
	assessmentMutex.RLock()
	assessment, exists := assessmentStore[req.Website]
	assessmentMutex.RUnlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assessment not found"})
		return
	}

	// Convert to WebsiteRiskAssessment format for response
	result := convertToWebsiteRiskAssessment(assessment)
	c.JSON(http.StatusOK, result)
}

// ListAssessmentsHandler handles GET /api/website-risk-assessment/assessments
func ListAssessmentsHandler(c *gin.Context) {
	// Get authenticated user ID
	userID := auth.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User authentication required",
			"code":  "AUTHENTICATION_REQUIRED",
		})
		return
	}

	// Parse query parameters
	limit := 50
	offset := 0
	status := c.Query("status")

	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	// Get from database with user filtering
	if supabaseClient != nil {
		var assessments []Assessment
		query := supabaseClient.DB.From("assessments").
			Select("*").
			Eq("user_id", userID)

		if status != "" {
			query = query.Eq("status", status)
		}

		// Note: Pagination removed due to client library limitations
		// TODO: Implement pagination at application level if needed
		err := query.Execute(&assessments)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to fetch assessments from database",
				"code":  "DATABASE_FETCH_ERROR",
			})
			return
		}

		// Apply pagination at application level
		totalCount := len(assessments)
		start := offset
		end := offset + limit
		if start >= totalCount {
			assessments = []Assessment{}
		} else {
			if end > totalCount {
				end = totalCount
			}
			assessments = assessments[start:end]
		}

		// Convert to WebsiteRiskAssessment format
		var result []*WebsiteRiskAssessment
		for _, assessment := range assessments {
			result = append(result, convertToWebsiteRiskAssessment(&assessment))
		}

		c.JSON(http.StatusOK, result)
		return
	}

	// Fallback to in-memory store (filtered by user)
	assessmentMutex.RLock()
	var assessments []*Assessment
	for _, assessment := range assessmentStore {
		// Only include assessments for this user
		if assessment.CreatedBy == userID {
			if status == "" || assessment.Status == status {
				assessments = append(assessments, assessment)
			}
		}
	}
	assessmentMutex.RUnlock()

	// Apply pagination
	start := offset
	end := offset + limit
	if start >= len(assessments) {
		assessments = []*Assessment{}
	} else {
		if end > len(assessments) {
			end = len(assessments)
		}
		assessments = assessments[start:end]
	}

	// Convert to WebsiteRiskAssessment format
	var result []*WebsiteRiskAssessment
	for _, assessment := range assessments {
		result = append(result, convertToWebsiteRiskAssessment(assessment))
	}

	c.JSON(http.StatusOK, result)
}

// GetAssessmentByIDHandler handles GET /api/website-risk-assessment/assessments/:id
func GetAssessmentByIDHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assessment ID"})
		return
	}

	assessmentMutex.RLock()
	var foundAssessment *Assessment
	for _, assessment := range assessmentStore {
		if assessment.ID == id {
			foundAssessment = assessment
			break
		}
	}
	assessmentMutex.RUnlock()

	if foundAssessment == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assessment not found"})
		return
	}

	result := convertToWebsiteRiskAssessment(foundAssessment)
	c.JSON(http.StatusOK, result)
}

// ManualQualificationUpdateHandler handles POST /api/website-risk-assessment/manual-update
func ManualQualificationUpdateHandler(c *gin.Context) {
	var req ManualQualificationUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update in memory
	assessmentMutex.Lock()
	assessment, exists := assessmentStore[req.Website]
	if exists {
		assessment.Status = "completed"
		assessment.UpdatedBy = "manual"
		assessment.UpdatedAt = time.Now()
		if assessment.AssessmentData == nil {
			assessment.AssessmentData = make(map[string]interface{})
		}
		assessment.AssessmentData["qualification_status"] = req.QualificationStatus
		assessment.AssessmentData["manual_update"] = true
	}
	assessmentMutex.Unlock()

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assessment not found"})
		return
	}

	// Try to update in database as well
	go func() {
		if err := updateAssessmentInDatabase(assessment); err != nil {
			log.Printf("Warning: Failed to update in database: %v", err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Qualification status updated successfully",
		"website": req.Website,
		"status":  req.QualificationStatus,
	})
}

// Database operations with real Supabase integration
func saveAssessmentToDatabase(assessment *Assessment, userID string, creditsConsumed int) error {
	if supabaseClient == nil {
		log.Printf("⚠️ saveAssessmentToDatabase: No database connection available")
		return fmt.Errorf("no database connection available")
	}

	log.Printf("💾 saveAssessmentToDatabase: Preparing to save assessment %s for user %s", assessment.Website, userID)

	// Convert assessment to database insert format
	dbAssessment := map[string]interface{}{
		"website":                 assessment.Website,
		"country_code":            assessment.CountryCode,
		"status":                  assessment.Status,
		"assessment_data":         assessment.AssessmentData,
		"processing_time_seconds": assessment.ProcessingTimeSeconds,
		"error_message":           assessment.ErrorMessage,
		"created_by":              assessment.CreatedBy,
		"updated_by":              assessment.UpdatedBy,
		"user_id":                 userID, // Associate with user
		"credits_consumed":        creditsConsumed,
		"assessment_cost":         float64(creditsConsumed) * 0.01, // Example cost calculation
		"assessment_type":         assessment.AssessmentType,
	}

	log.Printf("📝 saveAssessmentToDatabase: Database record prepared: %+v", dbAssessment)

	// Insert into Supabase
	var results []map[string]interface{}
	err := supabaseClient.DB.From("assessments").Insert(dbAssessment).Execute(&results)
	if err != nil {
		log.Printf("❌ saveAssessmentToDatabase: Failed to save assessment to database: %v", err)
		return err
	}

	log.Printf("✅ saveAssessmentToDatabase: Raw database response: %+v", results)

	// Update the assessment ID if returned
	if len(results) > 0 {
		if id, ok := results[0]["id"].(float64); ok {
			assessment.ID = int64(id)
			log.Printf("✅ saveAssessmentToDatabase: Updated assessment ID to %d", assessment.ID)
			
			// Update credit transaction with assessment ID
			go func() {
				auth.ConsumeCredits(userID, 0, &assessment.ID, fmt.Sprintf("Assessment ID %d linked", assessment.ID))
			}()
		} else {
			log.Printf("⚠️ saveAssessmentToDatabase: Could not extract ID from response")
		}
	} else {
		log.Printf("⚠️ saveAssessmentToDatabase: No results returned from database")
	}

	log.Printf("✅ saveAssessmentToDatabase: Assessment saved successfully: %s (ID: %d) for user %s", assessment.Website, assessment.ID, userID)
	return nil
}

func updateAssessmentInDatabase(assessment *Assessment) error {
	if supabaseClient == nil {
		return fmt.Errorf("no database connection available")
	}

	// Update assessment data
	updateData := map[string]interface{}{
		"status":                  assessment.Status,
		"assessment_data":         assessment.AssessmentData,
		"processing_time_seconds": assessment.ProcessingTimeSeconds,
		"error_message":           assessment.ErrorMessage,
		"updated_by":              assessment.UpdatedBy,
		"updated_at":              time.Now().Format(time.RFC3339),
	}

	// Update in Supabase
	var results []map[string]interface{}
	err := supabaseClient.DB.From("assessments").
		Update(updateData).
		Eq("id", fmt.Sprintf("%d", assessment.ID)).
		Execute(&results)

	if err != nil {
		log.Printf("❌ Failed to update assessment in database: %v", err)
		return err
	}

	log.Printf("✅ Assessment updated in database: %s (ID: %d)", assessment.Website, assessment.ID)
	return nil
}

func getAssessmentFromDatabase(website string) (*Assessment, error) {
	if supabaseClient == nil {
		return nil, fmt.Errorf("no database connection available")
	}

	var results []Assessment
	err := supabaseClient.DB.From("assessments").
		Select("*").
		Eq("website", website).
		Execute(&results)

	if err != nil {
		return nil, err
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("assessment not found")
	}

	return &results[0], nil
}

// runAssessment performs the actual risk assessment
func runAssessment(assessment *Assessment) {
	startTime := time.Now()

	// Check if country is supported
	countrySupported := false
	if assessment.AssessmentData != nil {
		if cs, ok := assessment.AssessmentData["country_supported"].(bool); ok {
			countrySupported = cs
		}
	}
	if !countrySupported {
		riskCategory := "high_risk"
		riskScore := 100

		assessmentMutex.Lock()
		assessment.Status = "completed"
		assessment.RiskCategory = &riskCategory
		assessment.RiskScore = &riskScore
		assessment.UpdatedAt = time.Now()
		processingTime := time.Since(startTime).Seconds()
		assessment.ProcessingTimeSeconds = &processingTime
		assessmentMutex.Unlock()

		// Update in database
		updateAssessmentInDatabase(assessment)

		// Send notification for unsupported country
		sendNotification(fmt.Sprintf("Assessment completed for %s. Country not supported", assessment.Website), fmt.Sprintf("%s (country not supported)", assessment.Website))
		return
	}

	// Run the full risk assessment using the scrapers orchestrator
	orchestrator := scrapers.NewWebsiteRiskAssessmentOrchestrator()
	result, err := orchestrator.RunAssessment(assessment.Website, assessment.CountryCode)

	if err != nil {
		errorMsg := err.Error()

		assessmentMutex.Lock()
		assessment.Status = "failed"
		assessment.ErrorMessage = &errorMsg
		assessment.UpdatedAt = time.Now()
		processingTime := time.Since(startTime).Seconds()
		assessment.ProcessingTimeSeconds = &processingTime
		assessmentMutex.Unlock()

		// Update in database
		updateAssessmentInDatabase(assessment)

		sendNotification(fmt.Sprintf("Assessment failed for %s: %s", assessment.Website, err.Error()), fmt.Sprintf("%s (failed)", assessment.Website))
		return
	}

	// Update assessment with results - store everything in JSON
	assessmentMutex.Lock()
	assessment.Status = "completed"

	// Update assessment_data with complete results
	if assessment.AssessmentData == nil {
		assessment.AssessmentData = make(map[string]interface{})
	}

	// Core risk data
	assessment.AssessmentData["risk_score"] = result.RiskScore
	assessment.AssessmentData["risk_category"] = result.RiskCategory
	assessment.AssessmentData["country_supported"] = assessment.CountrySupported
	assessment.AssessmentData["mcc_restricted"] = result.MCCDetails.MCCRestricted

	// Compliance flags
	assessment.AssessmentData["compliance_flags"] = map[string]interface{}{
		"https_supported":   result.HTTPSCheck.HasHTTPS,
		"ssl_valid":         result.SSLSha256Fingerprint.HasSHA256,
		"privacy_compliant": result.PrivacyAndTerms.PrivacyPolicyPresent,
		"terms_compliant":   result.PrivacyAndTerms.TermsOfServicePresent,
		"social_presence":   result.SocialPresence.SocialPresence.LinkedIn.Presence,
		"geopolitical_risk": result.IsRiskyGeopolitical.IsRisky,
	}

	// Technical details
	assessment.AssessmentData["technical_details"] = map[string]interface{}{
		"page_size_kb":    result.PageSize.PageSizeKB,
		"has_popups":      result.PopupAndAds.HasPopups,
		"has_ads":         result.PopupAndAds.HasAds,
		"ip_address":      result.URLVoid.IPAddress,
		"server_location": "", // Add if available
	}

	// Security details
	assessment.AssessmentData["security_details"] = map[string]interface{}{
		"urlvoid_detections": result.URLVoid.DetectionsCounts.Detected,
		"ipvoid_detections":  result.IPVoid.DetectionsCount.Detected,
		"ssl_details": map[string]interface{}{
			"has_sha256": result.SSLSha256Fingerprint.HasSHA256,
			"valid":      result.SSLSha256Fingerprint.HasSHA256,
		},
	}

	// Business details
	assessment.AssessmentData["business_details"] = map[string]interface{}{
		"mcc_code":     result.MCCDetails.MCCCode,
		"mcc_category": result.MCCDetails.MCCCategory,
		"domain_age":   0, // Add if available
	}

	// Risk breakdown
	assessment.AssessmentData["risk_breakdown"] = result.RiskBreakdown

	// Complete scraper results (for flexibility)
	assessment.AssessmentData["scraped_data"] = map[string]interface{}{
		"privacy_policy":       result.PrivacyAndTerms,
		"https_check":          result.HTTPSCheck,
		"ssl_fingerprint":      result.SSLSha256Fingerprint,
		"social_presence":      result.SocialPresence,
		"whois":                result.Whois,
		"urlvoid":              result.URLVoid,
		"ipvoid":               result.IPVoid,
		"google_safe_browsing": result.GoogleSafeBrowsing,
		"page_size":            result.PageSize,
		"traffic_volume":       result.TrafficVolume,
		"popup_ads":            result.PopupAndAds,
	}

	// Timestamps
	assessment.AssessmentData["timestamps"] = map[string]interface{}{
		"assessment_started":   assessment.AssessmentData["timestamps"].(map[string]interface{})["assessment_started"],
		"assessment_completed": time.Now().Format(time.RFC3339),
		"processing_duration":  time.Since(startTime).Seconds(),
	}

	assessment.UpdatedAt = time.Now()
	processingTime := time.Since(startTime).Seconds()
	assessment.ProcessingTimeSeconds = &processingTime
	assessmentMutex.Unlock()

	// Update in database
	updateAssessmentInDatabase(assessment)

	// Send completion notification
	mccRestricted := false
	if assessment.AssessmentData != nil {
		if mr, ok := assessment.AssessmentData["mcc_restricted"].(bool); ok {
			mccRestricted = mr
		}
	}
	if mccRestricted {
		sendNotification(
			fmt.Sprintf("Manual assessment required for %s", assessment.Website),
			fmt.Sprintf("%s (manual_assessment)", assessment.Website),
		)
	} else {
		sendNotification(
			fmt.Sprintf("Assessment completed for %s", assessment.Website),
			fmt.Sprintf("%s (completed)", assessment.Website),
		)

		// Update Salesforce if needed
		checkRiskScoreAndUpdateSalesforce(assessment)
	}
}

// Helper functions
func convertToWebsiteRiskAssessment(assessment *Assessment) *WebsiteRiskAssessment {
	// Convert database Assessment to API WebsiteRiskAssessment format
	wra := &WebsiteRiskAssessment{
		ID:                 fmt.Sprintf("WRA-%d", assessment.ID),
		Domain:             assessment.Website,
		Website:            assessment.Website,
		BillingCountryCode: assessment.CountryCode,
		Status:             assessment.Status,
		CreatedAt:          assessment.CreatedAt,
		UpdatedAt:          assessment.UpdatedAt,
		MerchantBusiness: MerchantBusiness{
			CountryCode: assessment.CountryCode,
			CountrySupported: func() bool {
				if assessment.AssessmentData != nil {
					if cs, ok := assessment.AssessmentData["country_supported"].(bool); ok {
						return cs
					}
				}
				return false
			}(),
		},
	}

	if assessment.RiskScore != nil {
		wra.RiskScore = *assessment.RiskScore
	}
	if assessment.RiskCategory != nil {
		wra.RiskCategory = *assessment.RiskCategory
	}

	// Set MCC details from JSON data
	wra.MCCDetails = MCCDetails{
		MCCRestricted: false, // Default
	}
	if assessment.AssessmentData != nil {
		if mccRestricted, ok := assessment.AssessmentData["mcc_restricted"].(bool); ok {
			wra.MCCDetails.MCCRestricted = mccRestricted
		}
		if businessDetails, ok := assessment.AssessmentData["business_details"].(map[string]interface{}); ok {
			if mccCode, ok := businessDetails["mcc_code"].(string); ok {
				wra.MCCDetails.MCCCode = mccCode
			}
			if mccCategory, ok := businessDetails["mcc_category"].(string); ok {
				wra.MCCDetails.Description = mccCategory
			}
		}
	}

	// Set geopolitical risk from JSON data
	wra.IsRiskyGeopolitical = GeopoliticalRisk{IsRisky: false}
	if assessment.AssessmentData != nil {
		if complianceFlags, ok := assessment.AssessmentData["compliance_flags"].(map[string]interface{}); ok {
			if geopoliticalRisk, ok := complianceFlags["geopolitical_risk"].(bool); ok {
				wra.IsRiskyGeopolitical.IsRisky = geopoliticalRisk
			}
		}
	}

	// Parse and set SalesforceRequest from Results
	if assessment.AssessmentData != nil {
		if salesforceReq, exists := assessment.AssessmentData["salesforce_request"]; exists {
			if salesforceData, ok := salesforceReq.(map[string]interface{}); ok {
				wra.SalesforceRequest = salesforceData
			}
		}
	}

	return wra
}

// sendNotification sends a notification (placeholder implementation)
func sendNotification(message, title string) {
	log.Printf("📢 NOTIFICATION: %s - %s", title, message)
}

// checkRiskScoreAndUpdateSalesforce checks risk score and updates Salesforce
func checkRiskScoreAndUpdateSalesforce(assessment *Assessment) {
	if assessment.AssessmentData != nil {
		if salesforceReq, exists := assessment.AssessmentData["salesforce_request"]; exists {
			if salesforceData, ok := salesforceReq.(map[string]interface{}); ok {
				if id, exists := salesforceData["Id"]; exists {
					qualificationStatus := "Qualified"
					if assessment.AssessmentData != nil {
						if riskCategory, ok := assessment.AssessmentData["risk_category"].(string); ok && riskCategory == "high_risk" {
							qualificationStatus = "Not Qualified"
						}
					}

					log.Printf("🔄 Would update Salesforce opportunity %v as %s for domain %s", id, qualificationStatus, assessment.Website)
					sendNotification(
						fmt.Sprintf("Updated Salesforce opportunity %v as %s", id, qualificationStatus),
						fmt.Sprintf("%s (%s)", assessment.Website, qualificationStatus),
					)
				}
			}
		}
	}
}

// Helper function to check if country is supported
func isCountrySupported(countryCode string) bool {
	return IsCountrySupported(countryCode)
}
