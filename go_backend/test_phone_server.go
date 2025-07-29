package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/auth"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	// Initialize auth and SMS
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_KEY")

	if err := auth.InitAuth(supabaseURL, supabaseKey); err != nil {
		log.Printf("Warning: Failed to initialize auth: %v", err)
	}

	if err := auth.InitSMS(); err != nil {
		log.Printf("Warning: Failed to initialize SMS: %v", err)
	}

	// Create Gin router
	router := gin.Default()

	// Add phone verification routes directly
	router.POST("/api/auth/send-phone-verification", auth.AuthMiddleware(), auth.SendPhoneVerificationHandler)
	router.POST("/api/auth/verify-phone-code", auth.AuthMiddleware(), auth.VerifyPhoneCodeHandler)

	// Health check
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Phone verification test server",
			"endpoints": map[string]string{
				"send_sms": "/api/auth/send-phone-verification",
				"verify":   "/api/auth/verify-phone-code",
			},
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🧪 Test server starting on port %s", port)
	log.Printf("📱 Phone verification endpoints ready")
	
	router.Run(":" + port)
}
