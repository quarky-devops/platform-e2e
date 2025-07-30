package main

import (
	"fmt"
	"log"

	"bitbucket.org/quarkfin/platform-e2e/go_backend/api"
	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/auth"
	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/business_risk"
	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/config"
	"bitbucket.org/quarkfin/platform-e2e/go_backend/internal/website_risk"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found: %v", err)
	}

	// Load production configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Set production mode if specified
	if cfg.IsProduction() {
		log.Printf("🚀 Starting in PRODUCTION mode")
		log.Printf("📊 Database: PostgreSQL=%s, MongoDB=%s", cfg.PostgresHost, cfg.MongoHost)
	} else {
		log.Printf("🔧 Starting in DEVELOPMENT mode")
	}

	// Initialize services with configuration
	if cfg.SupabaseURL == "" || cfg.SupabaseServiceKey == "" {
		log.Printf("Warning: Supabase configuration not available")
		log.Printf("The server will start but database operations may fail")
	} else {
		// Initialize authentication system
		if err := auth.InitAuth(cfg.SupabaseURL, cfg.SupabaseServiceKey); err != nil {
			log.Printf("Warning: Failed to initialize auth system: %v", err)
		} else {
			log.Printf("✅ Authentication system initialized")
		}

		// Initialize SMS service
		if err := auth.InitSMS(); err != nil {
			log.Printf("Warning: Failed to initialize SMS service: %v", err)
			log.Printf("Phone verification will use development mode")
		} else {
			log.Printf("✅ SMS service initialized")
		}

		// Initialize website risk assessment database
		if err := website_risk.InitDatabase(cfg.SupabaseURL, cfg.SupabaseServiceKey); err != nil {
			log.Printf("Warning: Failed to initialize website risk database: %v", err)
			log.Printf("Website risk assessments will use in-memory storage")
		} else {
			log.Printf("✅ Website risk assessment database initialized")
		}

		// Initialize business risk assessment database
		if err := business_risk.InitDatabase(cfg.SupabaseURL, cfg.SupabaseServiceKey); err != nil {
			log.Printf("Warning: Failed to initialize business risk database: %v", err)
			log.Printf("Business risk assessments will use mock data")
		} else {
			log.Printf("✅ Business risk assessment database initialized")
		}

		// Log production database connections
		if cfg.IsProduction() {
			log.Printf("✅ PostgreSQL: %s", cfg.PostgresConnectionString())
			log.Printf("✅ MongoDB: %s", cfg.MongoConnectionString())
			log.Printf("✅ Redis: %s", cfg.RedisConnectionString())
		}
	}

	// Create server
	server, err := api.NewServer()
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	// Start server
	address := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 QuarkFin Platform E2E Backend starting on port %s", cfg.Port)
	if cfg.IsProduction() {
		log.Printf("📍 Production URLs:")
		log.Printf("  🌐 Frontend: https://app.quarkfinai.com")
		log.Printf("  🔗 API: https://api.quarkfinai.com")
		log.Printf("  🏥 Health: https://api.quarkfinai.com/ping")
	} else {
		log.Printf("📍 Development URLs:")
		log.Printf("  🏥 Health check: http://localhost%s/ping", address)
		log.Printf("  📖 API docs: http://localhost%s/", address)
	}

	if err := server.Start(address); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
