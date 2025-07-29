package assessment

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/db"
	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/scrapers"
	"github.com/gin-gonic/gin"
	"github.com/supabase-community/postgrest-go"
)

// Assessment represents the assessment data model
type Assessment struct {
	Id          int64     `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	Website     string    `json:"website"`
	CountryCode string    `json:"country_code"`
	Status      string    `json:"status"`
	Results     string    `json:"results,omitempty"`
	RiskScore   int       `json:"risk_score,omitempty"`
	RiskCategory string   `json:"risk_category,omitempty"`
}

// AssessmentInsert represents the data for inserting a new assessment
type AssessmentInsert struct {
	Website     string `json:"website"`
	CountryCode string `json:"country_code"`
	Status      string `json:"status"`
	Results     string `json:"results,omitempty"`
	RiskScore   int    `json:"risk_score,omitempty"`
	RiskCategory string `json:"risk_category,omitempty"`
}

// CreateAssessmentRequest represents the request to create a new assessment
type CreateAssessmentRequest struct {
	Website     string `json:"website" binding:"required"`
	CountryCode string `json:"country_code" binding:"required"`
}

// AssessmentResponse represents the response for assessment operations
type AssessmentResponse struct {
	Id          int64                  `json:"id"`
	CreatedAt   time.Time              `json:"created_at"`
	Website     string                 `json:"website"`
	CountryCode string                 `json:"country_code"`
	Status      string                 `json:"status"`
	RiskScore   int                    `json:"risk_score,omitempty"`
	RiskCategory string                `json:"risk_category,omitempty"`
	Results     *scrapers.RiskAssessment `json:"results,omitempty"`
	Summary     map[string]interface{} `json:"summary,omitempty"`
	Recommendations []string           `json:"recommendations,omitempty"`
}

// CreateAssessmentHandler handles POST /api/v1/assessments
func CreateAssessmentHandler(c *gin.Context) {
	var req CreateAssessmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create database client
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_KEY")

	dbClient, err := db.CreateClient(supabaseURL, supabaseKey)
	if err != nil {
		log.Printf("Failed to create database client: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create database client"})
		return
	}

	// Create initial assessment record
	newAssessment := AssessmentInsert{
		Website:     req.Website,
		CountryCode: req.CountryCode,
		Status:      "pending",
	}

	var results []Assessment
	body, _, err := dbClient.From("assessments").Insert(newAssessment, true, "", "", "").Execute()
	if err != nil {
		log.Printf("DB Execute Error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create assessment record"})
		return
	}

	err = json.Unmarshal(body, &results)
	if err != nil {
		log.Printf("DB Unmarshal Error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse database response"})
		return
	}

	if len(results) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Assessment created but no data returned"})
		return
	}

	createdAssessment := results[0]

	// Start risk assessment in background
	go runRiskAssessment(createdAssessment.Id, req.Website, req.CountryCode, dbClient)

	// Return the created assessment
	response := AssessmentResponse{
		Id:          createdAssessment.Id,
		CreatedAt:   createdAssessment.CreatedAt,
		Website:     createdAssessment.Website,
		CountryCode: createdAssessment.CountryCode,
		Status:      createdAssessment.Status,
	}

	c.JSON(http.StatusCreated, response)
}

// GetAssessmentHandler handles GET /api/v1/assessments/:id
func GetAssessmentHandler(c *gin.Context) {
	id := c.Param("id")
	
	// Create database client
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_KEY")

	dbClient, err := db.CreateClient(supabaseURL, supabaseKey)
	if err != nil {
		log.Printf("Failed to create database client: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create database client"})
		return
	}

	// Query assessment by ID
	var results []Assessment
	body, _, err := dbClient.From("assessments").Select("*", "", false).Eq("id", id).Execute()
	if err != nil {
		log.Printf("DB Query Error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query assessment"})
		return
	}

	err = json.Unmarshal(body, &results)
	if err != nil {
		log.Printf("DB Unmarshal Error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse database response"})
		return
	}

	if len(results) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Assessment not found"})
		return
	}

	assessment := results[0]

	// Build response
	response := AssessmentResponse{
		Id:          assessment.Id,
		CreatedAt:   assessment.CreatedAt,
		Website:     assessment.Website,
		CountryCode: assessment.CountryCode,
		Status:      assessment.Status,
		RiskScore:   assessment.RiskScore,
		RiskCategory: assessment.RiskCategory,
	}

	// Parse results if available
	if assessment.Results != "" {
		var riskAssessment scrapers.RiskAssessment
		if err := json.Unmarshal([]byte(assessment.Results), &riskAssessment); err == nil {
			response.Results = &riskAssessment
			
			// Add summary and recommendations
			orchestrator := scrapers.NewWebsiteRiskAssessmentOrchestrator()
			response.Summary = orchestrator.GetAssessmentSummary(&riskAssessment)
			response.Recommendations = orchestrator.GetRecommendations(&riskAssessment)
		}
	}

	c.JSON(http.StatusOK, response)
}

// ListAssessmentsHandler handles GET /api/v1/assessments
func ListAssessmentsHandler(c *gin.Context) {
	// Create database client
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_KEY")

	dbClient, err := db.CreateClient(supabaseURL, supabaseKey)
	if err != nil {
		log.Printf("Failed to create database client: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create database client"})
		return
	}

	// Query all assessments
	var results []Assessment
	body, _, err := dbClient.From("assessments").Select("*", "", false).Order("created_at", &postgrest.OrderOpts{Ascending: false}).Execute()
	if err != nil {
		log.Printf("DB Query Error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query assessments"})
		return
	}

	err = json.Unmarshal(body, &results)
	if err != nil {
		log.Printf("DB Unmarshal Error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse database response"})
		return
	}

	// Convert to response format
	var responses []AssessmentResponse
	for _, assessment := range results {
		response := AssessmentResponse{
			Id:          assessment.Id,
			CreatedAt:   assessment.CreatedAt,
			Website:     assessment.Website,
			CountryCode: assessment.CountryCode,
			Status:      assessment.Status,
			RiskScore:   assessment.RiskScore,
			RiskCategory: assessment.RiskCategory,
		}
		responses = append(responses, response)
	}

	c.JSON(http.StatusOK, responses)
}

// runRiskAssessment runs the risk assessment process in the background
func runRiskAssessment(assessmentId int64, website, countryCode string, dbClient *db.Client) {
	log.Printf("Starting risk assessment for assessment ID: %d, website: %s", assessmentId, website)

	// Update status to "processing"
	updateAssessmentStatus(assessmentId, "processing", dbClient)

	// Create orchestrator and run assessment
	orchestrator := scrapers.NewWebsiteRiskAssessmentOrchestrator()
	riskAssessment, err := orchestrator.RunAssessment(website, countryCode)
	if err != nil {
		log.Printf("Risk assessment failed for %s: %v", website, err)
		updateAssessmentStatus(assessmentId, "failed", dbClient)
		return
	}

	// Convert results to JSON
	resultsJSON, err := riskAssessment.ToJSON()
	if err != nil {
		log.Printf("Failed to serialize risk assessment results: %v", err)
		updateAssessmentStatus(assessmentId, "failed", dbClient)
		return
	}

	// Update assessment with results
	updateAssessmentResults(assessmentId, "completed", resultsJSON, riskAssessment.RiskScore, riskAssessment.RiskCategory, dbClient)

	log.Printf("Risk assessment completed for assessment ID: %d", assessmentId)
}

// updateAssessmentStatus updates the status of an assessment
func updateAssessmentStatus(assessmentId int64, status string, dbClient *db.Client) {
	update := map[string]interface{}{
		"status": status,
	}

	_, _, err := dbClient.From("assessments").Update(update, "", "").Eq("id", fmt.Sprintf("%d", assessmentId)).Execute()
	if err != nil {
		log.Printf("Failed to update assessment status: %v", err)
	}
}

// updateAssessmentResults updates the assessment with completed results
func updateAssessmentResults(assessmentId int64, status, results string, riskScore int, riskCategory string, dbClient *db.Client) {
	update := map[string]interface{}{
		"status":        status,
		"results":       results,
		"risk_score":    riskScore,
		"risk_category": riskCategory,
	}

	_, _, err := dbClient.From("assessments").Update(update, "", "").Eq("id", fmt.Sprintf("%d", assessmentId)).Execute()
	if err != nil {
		log.Printf("Failed to update assessment results: %v", err)
	}
}
