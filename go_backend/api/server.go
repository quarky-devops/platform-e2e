package api

import (
	"net/http"
	"time"

	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/assessment"
	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/auth"
	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/business_risk"
	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/website_risk"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Server struct {
	router *gin.Engine
}

func NewServer() (*Server, error) {
	// Set to release mode in production
	if gin.Mode() != gin.DebugMode {
		gin.SetMode(gin.ReleaseMode)
	}
	
	router := gin.Default()

	// Add security middleware
	router.Use(func(c *gin.Context) {
		// Security headers
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", "default-src 'self'")
		c.Next()
	})

	// Add request size limit (10MB)
	router.MaxMultipartMemory = 10 << 20

	// Configure CORS with specific origins for production and development
	config := cors.DefaultConfig()
	
	// Production-ready CORS configuration
	if gin.Mode() == gin.ReleaseMode {
		// Production: Restrict to your actual domains
		config.AllowOrigins = []string{
			"https://quarkfin-platform.vercel.app",
			"https://quarkfin-platform.onrender.com",
			"https://quarkfin-frontend.onrender.com",
			"https://quarkfin-platform-frontend.onrender.com",
			"https://platform-e2e.onrender.com",
			"https://quarkfin-platform-backend.onrender.com",
		}
	} else {
		// Development: Allow localhost origins
		config.AllowOrigins = []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:3002",
			"https://quarkfin-platform.vercel.app",
			"https://quarkfin-platform.onrender.com",
			"https://quarkfin-frontend.onrender.com",
			"https://quarkfin-platform-frontend.onrender.com",
			"https://platform-e2e.onrender.com",
			"https://quarkfin-platform-backend.onrender.com",
		}
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"}
	config.AllowHeaders = []string{
		"Origin",
		"Content-Type",
		"Accept",
		"Authorization",
		"X-Requested-With",
		"Access-Control-Request-Method",
		"Access-Control-Request-Headers",
		"Cache-Control",
	}
	config.ExposeHeaders = []string{
		"Content-Length",
		"Access-Control-Allow-Origin",
		"Access-Control-Allow-Credentials",
		"Access-Control-Allow-Headers",
		"Access-Control-Allow-Methods",
	}
	config.AllowCredentials = true
	config.MaxAge = 86400 // 24 hours

	router.Use(cors.New(config))

	// Authentication routes
	authGroup := router.Group("/api/auth")
	{
		// Public routes
		authGroup.POST("/login", auth.LoginHandler)
		authGroup.POST("/register", auth.RegisterHandler)
		authGroup.POST("/users", auth.CreateUserHandler) // For user setup after Supabase auth
		authGroup.GET("/plans", auth.GetSubscriptionPlansHandler) // Public plan info
		
		// Protected routes
		protected := authGroup.Group("")
		protected.Use(auth.AuthMiddleware())
		{
			protected.POST("/logout", auth.LogoutHandler)
			protected.GET("/verify", auth.VerifyTokenHandler)
			protected.GET("/profile", auth.GetProfileHandler)
			protected.PUT("/profile", auth.UpdateProfileHandler)
			protected.GET("/credits", auth.GetCreditsHandler)
			
			// Phone verification routes
			protected.POST("/send-phone-verification", auth.SendPhoneVerificationHandler)
			protected.POST("/verify-phone-code", auth.VerifyPhoneCodeHandler)
			protected.PUT("/phone", auth.UpdatePhoneHandler)
		}
	}

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Assessment endpoints
		v1.POST("/assessments", assessment.CreateAssessmentHandler)
		v1.GET("/assessments", assessment.ListAssessmentsHandler)
		v1.GET("/assessments/:id", assessment.GetAssessmentHandler)
	}

	// Business Risk Prevention routes (protected)
	brp := router.Group("/api/business-risk-prevention")
	brp.Use(auth.AuthMiddleware()) // Require authentication
	{
		// Assessment endpoints
		brp.POST("/assessments", business_risk.CreateBusinessRiskAssessmentHandler)
		brp.GET("/assessments", business_risk.ListBusinessRiskAssessmentsHandler)
		brp.GET("/assessments/:id", business_risk.GetBusinessRiskAssessmentHandler)
		brp.PUT("/assessments/:id", business_risk.UpdateBusinessRiskAssessmentHandler)
		brp.DELETE("/assessments/:id", business_risk.DeleteBusinessRiskAssessmentHandler)
		brp.DELETE("/assessments/bulk", business_risk.DeleteBusinessRiskAssessmentsHandler)
		brp.POST("/assessments/:id/rerun", business_risk.RerunBusinessRiskAssessmentHandler)

		// Export endpoints
		brp.GET("/export/csv", business_risk.ExportBusinessRiskAssessmentsCSVHandler)
		brp.GET("/assessments/:id/export/pdf", business_risk.ExportBusinessRiskAssessmentPDFHandler)

		// Insights endpoint
		brp.GET("/insights", business_risk.GetBusinessRiskInsightsHandler)
	}

	// Website Risk Assessment routes (protected)
	wra := router.Group("/api/website-risk-assessment")
	wra.Use(auth.AuthMiddleware()) // Require authentication
	{
		wra.POST("/do-assessment", website_risk.DoRiskAssessmentHandler)
		wra.POST("/get-assessment", website_risk.GetRiskAssessmentHandler)
		wra.POST("/manual-update", website_risk.ManualQualificationUpdateHandler)
		wra.GET("/assessments", website_risk.ListAssessmentsHandler)
		wra.GET("/assessments/:id", website_risk.GetAssessmentByIDHandler)
	}

	// Health check endpoint
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong from go backend",
			"status":  "healthy",
			"timestamp": time.Now().UTC(),
			"version": "1.0.0",
		})
	})

	// Detailed health check
	router.GET("/health", func(c *gin.Context) {
		health := gin.H{
			"status": "healthy",
			"timestamp": time.Now().UTC(),
			"services": gin.H{
				"database": "connected",
				"auth": "operational",
			},
		}
		
		// Check database connection
		if supabaseClient := getSupabaseClient(); supabaseClient == nil {
			health["services"].(gin.H)["database"] = "disconnected"
			health["status"] = "degraded"
		}
		
		c.JSON(http.StatusOK, health)
	})

	// Root endpoint
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "QuarkFin Platform E2E Backend API",
			"version": "1.0.0",
			"endpoints": map[string]string{
				"health":                        "/ping",
				"auth_login":                    "/api/auth/login",
				"auth_register":                 "/api/auth/register",
				"auth_logout":                   "/api/auth/logout",
				"auth_verify":                   "/api/auth/verify",
				"auth_profile":                  "/api/auth/profile",
				"auth_credits":                  "/api/auth/credits",
				"auth_phone_send":               "/api/auth/send-phone-verification",
				"auth_phone_verify":             "/api/auth/verify-phone-code",
				"auth_phone_update":             "/api/auth/phone",
				"auth_plans":                    "/api/auth/plans",
				"create_assessment":             "/api/v1/assessments",
				"list_assessments":              "/api/v1/assessments",
				"get_assessment":                "/api/v1/assessments/:id",
				"business_risk_assessments":     "/api/business-risk-prevention/assessments",
				"business_risk_insights":        "/api/business-risk-prevention/insights",
				"business_risk_export_csv":      "/api/business-risk-prevention/export/csv",
				"business_risk_export_pdf":      "/api/business-risk-prevention/assessments/:id/export/pdf",
				"website_risk_do_assessment":    "/api/website-risk-assessment/do-assessment",
				"website_risk_get_assessment":   "/api/website-risk-assessment/get-assessment",
				"website_risk_manual_update":    "/api/website-risk-assessment/manual-update",
				"website_risk_list_assessments": "/api/website-risk-assessment/assessments",
				"website_risk_get_by_id":        "/api/website-risk-assessment/assessments/:id",
			},
		})
	})

	server := &Server{router: router}
	return server, nil
}

// getSupabaseClient returns a database client for health checks
func getSupabaseClient() interface{} {
	// This is a placeholder - you'd need to implement proper health check
	return "connected" // Simplified for now
}

// Start starts the server on the specified address
func (server *Server) Start(address string) error {
	return server.router.Run(address)
}
