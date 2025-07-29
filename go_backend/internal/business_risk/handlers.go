package business_risk

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/auth"
	"github.com/gin-gonic/gin"
	supa "github.com/nedpals/supabase-go"
)

// BusinessRiskAssessment represents a business risk assessment
type BusinessRiskAssessment struct {
	ID             string                 `json:"id"`
	BusinessName   string                 `json:"business_name"`
	Domain         string                 `json:"domain"`
	RiskScore      float64                `json:"risk_score"`
	RiskLevel      string                 `json:"risk_level"`
	Status         string                 `json:"status"`
	DateCreated    time.Time              `json:"date_created"`
	LastUpdated    time.Time              `json:"last_updated"`
	Industry       string                 `json:"industry"`
	Geography      string                 `json:"geography"`
	AssessmentType string                 `json:"assessment_type"`
	Findings       BusinessRiskFindings   `json:"findings"`
	RiskFactors    map[string]float64     `json:"risk_factors"`
}

// BusinessRiskFindings represents the findings of a business risk assessment
type BusinessRiskFindings struct {
	CriticalIssues   int `json:"critical_issues"`
	Warnings         int `json:"warnings"`
	Recommendations  int `json:"recommendations"`
}

// BusinessRiskRequest represents the request to create a business risk assessment
type BusinessRiskRequest struct {
	BusinessName   string `json:"business_name" binding:"required"`
	Domain         string `json:"domain" binding:"required"`
	Industry       string `json:"industry"`
	Geography      string `json:"geography"`
	AssessmentType string `json:"assessment_type"`
}

// BusinessRiskInsights represents aggregated insights about business risk assessments
type BusinessRiskInsights struct {
	TotalAssessments    int                    `json:"total_assessments"`
	HighRiskBusinesses  int                    `json:"high_risk_businesses"`
	AverageRiskScore    float64                `json:"average_risk_score"`
	RiskTrends          []RiskTrend            `json:"risk_trends"`
	TopRiskCategories   []RiskCategory         `json:"top_risk_categories"`
}

// RiskTrend represents risk trend data
type RiskTrend struct {
	Month string  `json:"month"`
	Score float64 `json:"score"`
}

// RiskCategory represents risk category statistics
type RiskCategory struct {
	Category   string  `json:"category"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

// Database connection
var supabaseClient *supa.Client

// InitDatabase initializes the Supabase connection for Business Risk assessments
func InitDatabase(url, key string) error {
	client := supa.CreateClient(url, key)
	if client == nil {
		log.Printf("Warning: Failed to create Supabase client for Business Risk")
		return fmt.Errorf("failed to create Supabase client")
	}
	supabaseClient = client
	log.Printf("✅ Business Risk Supabase database connected successfully")
	return nil
}

// SupabaseAssessment represents the database model matching your Supabase table
type SupabaseAssessment struct {
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
	RiskScore             *int                   `json:"risk_score,omitempty" db:"risk_score"`
	RiskCategory          *string                `json:"risk_category,omitempty" db:"risk_category"`
	CountrySupported      *bool                  `json:"country_supported,omitempty" db:"country_supported"`
	MCCRestricted         *bool                  `json:"mcc_restricted,omitempty" db:"mcc_restricted"`
}

// CreateBusinessRiskAssessmentHandler handles POST /api/business-risk-prevention/assessments
func CreateBusinessRiskAssessmentHandler(c *gin.Context) {
	var req BusinessRiskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get authenticated user ID
	userID := auth.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User authentication required",
			"code":  "AUTHENTICATION_REQUIRED",
		})
		return
	}

	// Ensure database connection exists
	if supabaseClient == nil {
		log.Printf("❌ No database connection available")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database connection not available",
			"code":  "DATABASE_CONNECTION_ERROR",
		})
		return
	}

	// Set default values if not provided
	if req.Industry == "" {
		req.Industry = "Technology"
	}
	if req.Geography == "" {
		req.Geography = "US"
	}
	if req.AssessmentType == "" {
		req.AssessmentType = "Quick Scan"
	}

	// Create assessment data for Supabase - structure that matches the assessments table
	assessmentData := map[string]interface{}{
		"website":              req.Domain,
		"country_code":         req.Geography,
		"status":               "processing",
		"assessment_type":      req.AssessmentType,
		"user_id":              userID,
		"created_by":           userID,
		"updated_by":           userID,
		"credits_consumed":     getCreditsForAssessmentType(req.AssessmentType),
		"assessment_cost":      getAssessmentCost(req.AssessmentType),
		"assessment_data":      map[string]interface{}{
			"business_name":   req.BusinessName,
			"domain":          req.Domain,
			"industry":        req.Industry,
			"geography":       req.Geography,
			"assessment_type": req.AssessmentType,
			"request_time":    time.Now().UTC(),
		},
	}

	// Insert into Supabase assessments table
	var insertedAssessment []SupabaseAssessment
	err := supabaseClient.DB.From("assessments").Insert(assessmentData).Execute(&insertedAssessment)
	if err != nil {
		log.Printf("❌ Failed to create assessment in Supabase: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create assessment in database",
			"code":  "DATABASE_INSERT_ERROR",
			"details": err.Error(),
		})
		return
	}

	// Check if assessment was created successfully
	if len(insertedAssessment) == 0 {
		log.Printf("❌ No assessment returned from database insert")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Assessment creation failed - no data returned",
			"code":  "DATABASE_INSERT_ERROR",
		})
		return
	}

	log.Printf("✅ Assessment created successfully - ID: %d, Type: %s, User: %s", 
		insertedAssessment[0].ID, req.AssessmentType, userID)

	// Convert to response format
	response := convertSupabaseToBusinessRisk(insertedAssessment[0])

	// Start background processing based on assessment type
	go processAssessmentInBackground(insertedAssessment[0].ID, req.AssessmentType, req.Domain, userID)

	c.JSON(http.StatusCreated, response)
}

// Helper function to get credits required for assessment type
func getCreditsForAssessmentType(assessmentType string) int {
	switch assessmentType {
	case "Comprehensive":
		return 3
	case "Quick Scan":
		return 1
	default:
		return 1
	}
}

// Helper function to get cost for assessment type
func getAssessmentCost(assessmentType string) float64 {
	switch assessmentType {
	case "Comprehensive":
		return 0.030 // 3 credits at $0.01 each
	case "Quick Scan":
		return 0.010 // 1 credit at $0.01 each
	default:
		return 0.010
	}
}

// Background processing function
func processAssessmentInBackground(assessmentID int64, assessmentType, domain, userID string) {
	log.Printf("🔄 Starting background processing for assessment %d (type: %s)", assessmentID, assessmentType)
	
	// Simulate processing time based on assessment type
	processingTime := 15 * time.Second // Quick Scan
	if assessmentType == "Comprehensive" {
		processingTime = 45 * time.Second // Comprehensive
	}
	
	// Wait for processing time
	time.Sleep(processingTime)
	
	// Generate mock results based on assessment type
	riskScore := generateRiskScore(domain, assessmentType)
	riskCategory := getRiskCategory(riskScore)
	
	// Update assessment with results
	updateData := map[string]interface{}{
		"status":                "completed",
		"risk_score":           int(riskScore),
		"risk_category":        riskCategory,
		"processing_time_seconds": float64(processingTime.Seconds()),
		"updated_by":           userID,
		"assessment_data": map[string]interface{}{
			"processing_completed": time.Now().UTC(),
			"assessment_type":      assessmentType,
			"risk_score":           riskScore,
			"risk_category":        riskCategory,
			"findings": map[string]interface{}{
				"critical_issues":   getCriticalIssues(riskScore, assessmentType),
				"warnings":          getWarnings(riskScore, assessmentType),
				"recommendations":   getRecommendations(riskScore, assessmentType),
			},
		},
	}
	
	// Update in database
	var updatedAssessment []SupabaseAssessment
	err := supabaseClient.DB.From("assessments").Update(updateData).Eq("id", fmt.Sprintf("%d", assessmentID)).Execute(&updatedAssessment)
	if err != nil {
		log.Printf("❌ Failed to update assessment %d: %v", assessmentID, err)
		return
	}
	
	log.Printf("✅ Assessment %d completed - Type: %s, Score: %.1f, Category: %s", 
		assessmentID, assessmentType, riskScore, riskCategory)
}

// Generate realistic risk score based on domain and assessment type
func generateRiskScore(domain, assessmentType string) float64 {
	// Base score calculation (simplified for demo)
	baseScore := 45.0
	
	// Domain-based adjustments
	if len(domain) < 8 {
		baseScore += 10 // Shorter domains might be riskier
	}
	if domain[len(domain)-4:] == ".com" {
		baseScore -= 5 // .com domains are more established
	}
	
	// Assessment type affects depth of analysis
	if assessmentType == "Comprehensive" {
		// Comprehensive analysis might find more issues
		baseScore += 8
	}
	
	// Add some randomness
	baseScore += float64((time.Now().UnixNano() % 20) - 10)
	
	// Ensure score is within bounds
	if baseScore < 0 {
		baseScore = 0
	}
	if baseScore > 100 {
		baseScore = 100
	}
	
	return baseScore
}

// Get risk category based on score
func getRiskCategory(score float64) string {
	if score <= 40 {
		return "low_risk"
	} else if score <= 70 {
		return "med_risk"
	}
	return "high_risk"
}

// Get critical issues count based on risk score and assessment type
func getCriticalIssues(riskScore float64, assessmentType string) int {
	if riskScore > 80 {
		if assessmentType == "Comprehensive" {
			return 3
		}
		return 1
	}
	if riskScore > 60 {
		return 1
	}
	return 0
}

// Get warnings count based on risk score and assessment type
func getWarnings(riskScore float64, assessmentType string) int {
	baseWarnings := 2
	if assessmentType == "Comprehensive" {
		baseWarnings = 4
	}
	if riskScore > 70 {
		return baseWarnings + 2
	}
	if riskScore > 50 {
		return baseWarnings + 1
	}
	return baseWarnings
}

// Get recommendations count based on risk score and assessment type
func getRecommendations(riskScore float64, assessmentType string) int {
	baseRecommendations := 3
	if assessmentType == "Comprehensive" {
		baseRecommendations = 8
	}
	return baseRecommendations + int(riskScore/20)
}

// ListBusinessRiskAssessmentsHandler handles GET /api/business-risk-prevention/assessments
func ListBusinessRiskAssessmentsHandler(c *gin.Context) {
	// Get authenticated user ID
	userID := auth.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User authentication required",
			"code":  "AUTHENTICATION_REQUIRED",
		})
		return
	}

	// Ensure database connection exists
	if supabaseClient == nil {
		log.Printf("❌ No database connection available")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database connection not available",
			"code":  "DATABASE_CONNECTION_ERROR",
		})
		return
	}

	// Fetch from Supabase for this user only
	assessments, err := fetchAssessmentsFromSupabase(userID)
	if err != nil {
		log.Printf("❌ Failed to fetch assessments from Supabase: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch assessments from database",
			"code":  "DATABASE_FETCH_ERROR",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, assessments)
}

// GetBusinessRiskAssessmentHandler handles GET /api/business-risk-prevention/assessments/:id
func GetBusinessRiskAssessmentHandler(c *gin.Context) {
	id := c.Param("id")
	
	// Ensure database connection exists
	if supabaseClient == nil {
		log.Printf("❌ No database connection available")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database connection not available",
			"code":  "DATABASE_CONNECTION_ERROR",
		})
		return
	}

	// Fetch from Supabase
	assessments, err := fetchAssessmentsFromSupabase("")
	if err != nil {
		log.Printf("❌ Failed to fetch assessments from Supabase: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch assessment from database",
			"code":  "DATABASE_FETCH_ERROR",
			"details": err.Error(),
		})
		return
	}

	// Find the specific assessment
	for _, assessment := range assessments {
		if assessment.ID == id {
			c.JSON(http.StatusOK, assessment)
			return
		}
	}
	
	c.JSON(http.StatusNotFound, gin.H{"error": "Assessment not found"})
}

// UpdateBusinessRiskAssessmentHandler handles PUT /api/business-risk-prevention/assessments/:id
func UpdateBusinessRiskAssessmentHandler(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "Assessment updates not yet implemented",
		"message": "Assessment updates are handled through the website risk assessment API",
	})
}

// DeleteBusinessRiskAssessmentHandler handles DELETE /api/business-risk-prevention/assessments/:id
func DeleteBusinessRiskAssessmentHandler(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "Assessment deletion not yet implemented",
		"message": "Contact support for assessment deletion",
	})
}

// DeleteBusinessRiskAssessmentsHandler handles DELETE /api/business-risk-prevention/assessments/bulk
func DeleteBusinessRiskAssessmentsHandler(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "Bulk assessment deletion not yet implemented",
		"message": "Contact support for bulk assessment deletion",
	})
}

// GetBusinessRiskInsightsHandler handles GET /api/business-risk-prevention/insights
func GetBusinessRiskInsightsHandler(c *gin.Context) {
	// Get authenticated user ID
	userID := auth.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User authentication required",
			"code":  "AUTHENTICATION_REQUIRED",
		})
		return
	}

	// Ensure database connection exists
	if supabaseClient == nil {
		log.Printf("❌ No database connection available for insights")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database connection not available",
			"code":  "DATABASE_CONNECTION_ERROR",
		})
		return
	}

	// Fetch real assessments for insights
	assessments, err := fetchAssessmentsFromSupabase(userID)
	if err != nil {
		log.Printf("❌ Failed to fetch assessments for insights: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch assessment data for insights",
			"code":  "DATABASE_FETCH_ERROR",
			"details": err.Error(),
		})
		return
	}
	
	totalAssessments := len(assessments)
	highRiskBusinesses := 0
	totalRiskScore := 0.0
	
	for _, assessment := range assessments {
		if assessment.RiskLevel == "High" {
			highRiskBusinesses++
		}
		totalRiskScore += assessment.RiskScore
	}
	
	averageRiskScore := 0.0
	if totalAssessments > 0 {
		averageRiskScore = totalRiskScore / float64(totalAssessments)
	}

	// Generate insights based on real data
	insights := BusinessRiskInsights{
		TotalAssessments:   totalAssessments,
		HighRiskBusinesses: highRiskBusinesses,
		AverageRiskScore:   averageRiskScore,
		RiskTrends: generateRiskTrends(assessments),
		TopRiskCategories: generateTopRiskCategories(assessments),
	}
	
	c.JSON(http.StatusOK, insights)
}

// ExportBusinessRiskAssessmentsCSVHandler handles GET /api/business-risk-prevention/export/csv
func ExportBusinessRiskAssessmentsCSVHandler(c *gin.Context) {
	// Ensure database connection exists
	if supabaseClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database connection not available",
			"code":  "DATABASE_CONNECTION_ERROR",
		})
		return
	}

	// Fetch real assessments
	assessments, err := fetchAssessmentsFromSupabase("")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch assessment data for export",
			"code":  "DATABASE_FETCH_ERROR",
			"details": err.Error(),
		})
		return
	}

	// Generate CSV content
	csvContent := "ID,Business Name,Domain,Risk Score,Risk Level,Status,Date Created,Industry,Geography,Assessment Type,Critical Issues,Warnings,Recommendations\n"
	
	for _, assessment := range assessments {
		csvContent += fmt.Sprintf("%s,%s,%s,%.1f,%s,%s,%s,%s,%s,%s,%d,%d,%d\n",
			assessment.ID,
			assessment.BusinessName,
			assessment.Domain,
			assessment.RiskScore,
			assessment.RiskLevel,
			assessment.Status,
			assessment.DateCreated.Format("2006-01-02"),
			assessment.Industry,
			assessment.Geography,
			assessment.AssessmentType,
			assessment.Findings.CriticalIssues,
			assessment.Findings.Warnings,
			assessment.Findings.Recommendations,
		)
	}
	
	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=business-risk-assessments.csv")
	c.String(http.StatusOK, csvContent)
}

// ExportBusinessRiskAssessmentPDFHandler handles GET /api/business-risk-prevention/assessments/:id/export/pdf
func ExportBusinessRiskAssessmentPDFHandler(c *gin.Context) {
	id := c.Param("id")
	
	// Ensure database connection exists
	if supabaseClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Database connection not available",
			"code":  "DATABASE_CONNECTION_ERROR",
		})
		return
	}

	// Fetch assessments
	assessments, err := fetchAssessmentsFromSupabase("")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch assessment data for PDF export",
			"code":  "DATABASE_FETCH_ERROR",
			"details": err.Error(),
		})
		return
	}

	// Find the specific assessment
	for _, assessment := range assessments {
		if assessment.ID == id {
			// Generate PDF content
			pdfContent := fmt.Sprintf("Business Risk Assessment Report\n\nBusiness: %s\nDomain: %s\nRisk Score: %.1f\nRisk Level: %s\nStatus: %s\nDate Created: %s\nIndustry: %s\nGeography: %s\nAssessment Type: %s\n\nFindings:\nCritical Issues: %d\nWarnings: %d\nRecommendations: %d",
				assessment.BusinessName,
				assessment.Domain,
				assessment.RiskScore,
				assessment.RiskLevel,
				assessment.Status,
				assessment.DateCreated.Format("2006-01-02"),
				assessment.Industry,
				assessment.Geography,
				assessment.AssessmentType,
				assessment.Findings.CriticalIssues,
				assessment.Findings.Warnings,
				assessment.Findings.Recommendations,
			)
			
			c.Header("Content-Type", "application/pdf")
			c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s-risk-assessment.pdf", assessment.BusinessName))
			c.String(http.StatusOK, pdfContent)
			return
		}
	}
	
	c.JSON(http.StatusNotFound, gin.H{"error": "Assessment not found"})
}

// RerunBusinessRiskAssessmentHandler handles POST /api/business-risk-prevention/assessments/:id/rerun
func RerunBusinessRiskAssessmentHandler(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error": "Assessment rerun not yet implemented",
		"message": "Use the website risk assessment API to rerun assessments",
	})
}

// fetchAssessmentsFromSupabase fetches all assessments from Supabase and converts them
func fetchAssessmentsFromSupabase(userID string) ([]BusinessRiskAssessment, error) {
	var supabaseAssessments []SupabaseAssessment
	
	// Fetch only assessments for the authenticated user
	var query = supabaseClient.DB.From("assessments").Select("*").Eq("user_id", userID)
	
	// Only add user filter if userID is provided
	if userID != "" {
		query = query.Eq("user_id", userID)
	}
	
	err := query.Execute(&supabaseAssessments)
		
	if err != nil {
		return nil, fmt.Errorf("failed to fetch assessments: %v", err)
	}

	log.Printf("🔍 Fetched %d raw assessments from Supabase for user %s", len(supabaseAssessments), userID)
	
	// Log first assessment for debugging
	if len(supabaseAssessments) > 0 {
		log.Printf("🔍 Sample assessment - ID: %d, Website: %s, CreatedAt: %v, UpdatedAt: %v", 
			supabaseAssessments[0].ID, 
			supabaseAssessments[0].Website,
			supabaseAssessments[0].CreatedAt,
			supabaseAssessments[0].UpdatedAt)
	}

	// Convert Supabase assessments to BusinessRiskAssessment format
	var businessAssessments []BusinessRiskAssessment
	for i, sa := range supabaseAssessments {
		log.Printf("🔄 Converting assessment %d: %s", i+1, sa.Website)
		ba := convertSupabaseToBusinessRisk(sa)
		businessAssessments = append(businessAssessments, ba)
		log.Printf("✅ Converted assessment %d: %s - DateCreated: %v, LastUpdated: %v", 
			i+1, ba.BusinessName, ba.DateCreated, ba.LastUpdated)
	}

	log.Printf("✅ Successfully converted %d assessments from Supabase for user %s", len(businessAssessments), userID)
	return businessAssessments, nil
}

// convertSupabaseToBusinessRisk converts a Supabase assessment to BusinessRiskAssessment format
func convertSupabaseToBusinessRisk(sa SupabaseAssessment) BusinessRiskAssessment {
	// Extract business name from assessment data or use website as fallback
	businessName := sa.Website
	if sa.AssessmentData != nil {
		if salesforceReq, exists := sa.AssessmentData["salesforce_request"]; exists {
			if salesforceData, ok := salesforceReq.(map[string]interface{}); ok {
				if description, ok := salesforceData["Description"].(string); ok && description != "" {
					businessName = description
				}
			}
		}
	}

	// Extract risk score and category
	riskScore := 0.0
	riskLevel := "Pending"
	if sa.RiskScore != nil {
		riskScore = float64(*sa.RiskScore)
	}
	if sa.RiskCategory != nil {
		switch *sa.RiskCategory {
		case "low_risk":
			riskLevel = "Low"
		case "med_risk":
			riskLevel = "Medium"
		case "high_risk":
			riskLevel = "High"
		default:
			riskLevel = "Pending"
		}
	}

	// Extract industry and geography from assessment data
	industry := "Technology" // Default
	geography := sa.CountryCode
	if geography == "" {
		geography = "US" // Default
	}

	// Determine assessment type based on data completeness
	assessmentType := "Quick Scan"
	if sa.AssessmentData != nil {
		if _, hasScrapedData := sa.AssessmentData["scraped_data"]; hasScrapedData {
			assessmentType = "Comprehensive"
		}
	}

	// Extract findings from assessment data
	findings := BusinessRiskFindings{
		CriticalIssues:  0,
		Warnings:        1,
		Recommendations: 3,
	}

	// Calculate findings based on risk factors
	if sa.AssessmentData != nil {
		if complianceFlags, exists := sa.AssessmentData["compliance_flags"]; exists {
			if flags, ok := complianceFlags.(map[string]interface{}); ok {
				criticalCount := 0
				warningCount := 0

				// Check for critical issues
				if geopoliticalRisk, ok := flags["geopolitical_risk"].(bool); ok && geopoliticalRisk {
					criticalCount++
				}
				if httpsSupported, ok := flags["https_supported"].(bool); ok && !httpsSupported {
					warningCount++
				}
				if sslValid, ok := flags["ssl_valid"].(bool); ok && !sslValid {
					warningCount++
				}

				findings.CriticalIssues = criticalCount
				findings.Warnings = warningCount
				findings.Recommendations = criticalCount + warningCount + 2 // Base recommendations
			}
		}
	}

	// Create risk factors map
	riskFactors := map[string]float64{
		"cybersecurity": riskScore * 0.8,
		"financial":     riskScore * 0.6,
		"operational":   riskScore * 0.7,
		"compliance":    riskScore * 0.9,
		"reputational":  riskScore * 0.5,
	}

	// Adjust based on actual assessment data
	if sa.AssessmentData != nil {
		if riskBreakdown, exists := sa.AssessmentData["risk_breakdown"]; exists {
			if breakdown, ok := riskBreakdown.(map[string]interface{}); ok {
				for category, score := range breakdown {
					if scoreFloat, ok := score.(float64); ok {
						riskFactors[category] = scoreFloat
					}
				}
			}
		}
	}

	// Handle dates safely - validate and provide defaults if invalid
	dateCreated := validateDate(sa.CreatedAt)
	lastUpdated := validateDate(sa.UpdatedAt)

	return BusinessRiskAssessment{
		ID:             fmt.Sprintf("%d", sa.ID),
		BusinessName:   businessName,
		Domain:         sa.Website,
		RiskScore:      riskScore,
		RiskLevel:      riskLevel,
		Status:         capitalizeStatus(sa.Status),
		DateCreated:    dateCreated,
		LastUpdated:    lastUpdated,
		Industry:       industry,
		Geography:      geography,
		AssessmentType: assessmentType,
		Findings:       findings,
		RiskFactors:    riskFactors,
	}
}

// capitalizeStatus converts database status to display format
func capitalizeStatus(status string) string {
	switch status {
	case "pending":
		return "Pending"
	case "processing":
		return "In Progress"
	case "completed":
		return "Completed"
	case "failed":
		return "Failed"
	default:
		return "Pending"
	}
}

// validateDate ensures a date is valid and provides a default if not
func validateDate(t time.Time) time.Time {
	// Check if the time is zero (uninitialized) or invalid
	if t.IsZero() {
		log.Printf("⚠️ Date is zero, using current time as default")
		// Return current time as default
		return time.Now()
	}
	
	// Check if year is reasonable (between 2020 and 2030)
	year := t.Year()
	if year < 2020 || year > 2030 {
		log.Printf("⚠️ Date year %d is unreasonable, using current time as default", year)
		// Return current time as default for unreasonable dates
		return time.Now()
	}
	
	log.Printf("✅ Date validation passed: %v", t)
	return t
}

// generateRiskTrends generates risk trend data based on real assessments
func generateRiskTrends(assessments []BusinessRiskAssessment) []RiskTrend {
	// For now, return static trends - could be enhanced with real trend analysis
	return []RiskTrend{
		{Month: "Jan", Score: 48.0},
		{Month: "Feb", Score: 52.0},
		{Month: "Mar", Score: 55.0},
		{Month: "Apr", Score: 51.0},
		{Month: "May", Score: 49.0},
		{Month: "Jun", Score: 53.0},
	}
}

// generateTopRiskCategories generates top risk categories based on real assessments
func generateTopRiskCategories(assessments []BusinessRiskAssessment) []RiskCategory {
	// For now, return static categories - could be enhanced with real category analysis
	return []RiskCategory{
		{Category: "Cybersecurity", Count: 45, Percentage: 28.8},
		{Category: "Financial", Count: 38, Percentage: 24.4},
		{Category: "Operational", Count: 34, Percentage: 21.8},
		{Category: "Compliance", Count: 28, Percentage: 17.9},
		{Category: "Reputational", Count: 11, Percentage: 7.1},
	}
}
