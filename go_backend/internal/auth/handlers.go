package auth

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// UserProfileResponse represents user profile API response
type UserProfileResponse struct {
	ID                  string  `json:"id"`
	Email               string  `json:"email"`
	Phone               string  `json:"phone"`
	FullName            string  `json:"full_name"`
	CompanyName         *string `json:"company_name"`
	CompanySize         *string `json:"company_size"`
	Industry            *string `json:"industry"`
	Country             *string `json:"country"`
	PhoneVerified       bool    `json:"phone_verified"`
	EmailVerified       bool    `json:"email_verified"`
	OnboardingCompleted bool    `json:"onboarding_completed"`
	Status              string  `json:"status"`
	Plan                *SubscriptionPlan `json:"current_plan,omitempty"`
	Credits             *UserCredits     `json:"credits,omitempty"`
}

// GetProfileHandler handles GET /api/auth/profile
func GetProfileHandler(c *gin.Context) {
	userID := GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User authentication required",
			"code":  "AUTHENTICATION_REQUIRED",
		})
		return
	}

	userEmail := GetUserEmail(c)
	log.Printf("🔍 GetProfileHandler: Fetching profile for user %s (%s)", userEmail, userID)

	// Get user profile
	profile, err := GetUserProfile(userID)
	if err != nil {
		log.Printf("❌ GetProfileHandler: User profile not found: %v", err)
		
		// If it's just a "not found" error, try to create the profile
		if userEmail != "" && err.Error() == "user profile not found" {
			err := CreateUserProfile(userID, userEmail, "", "")
			if err != nil {
				// If creation fails due to duplicate key, try to fetch again
				if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
					log.Printf("⚠️ GetProfileHandler: Profile already exists, retrying fetch")
					// Try to fetch again - there might be a race condition
					profile, err = GetUserProfile(userID)
					if err != nil {
						log.Printf("❌ GetProfileHandler: Still failed to get user profile after duplicate key error: %v", err)
						c.JSON(http.StatusInternalServerError, gin.H{
							"error": "Failed to retrieve user profile",
							"code":  "PROFILE_RETRIEVAL_ERROR",
						})
						return
					}
				} else {
					log.Printf("❌ GetProfileHandler: Failed to create user profile: %v", err)
					c.JSON(http.StatusNotFound, gin.H{
						"error": "User profile not found and could not be created",
						"code":  "PROFILE_NOT_FOUND",
						"details": err.Error(),
					})
					return
				}
			} else {
				log.Printf("✅ GetProfileHandler: Created basic profile for %s", userEmail)
				
				// Try to fetch the profile again
				profile, err = GetUserProfile(userID)
				if err != nil {
					log.Printf("❌ GetProfileHandler: Still failed to get user profile after creation: %v", err)
					c.JSON(http.StatusInternalServerError, gin.H{
						"error": "Failed to retrieve user profile",
						"code":  "PROFILE_RETRIEVAL_ERROR",
					})
					return
				}
			}
		} else {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User profile not found",
				"code":  "PROFILE_NOT_FOUND",
				"details": err.Error(),
			})
			return
		}
	}

	log.Printf("✅ GetProfileHandler: Found profile for %s", profile.Email)

	// Get user subscription and plan
	_, plan, err := GetUserSubscription(userID)
	if err != nil {
		log.Printf("⚠️ GetProfileHandler: No subscription found for user %s: %v", userID, err)
		plan = nil // User might not have a subscription yet
	}

	// Get user credits
	credits, err := GetUserCredits(userID)
	if err != nil {
		log.Printf("⚠️ GetProfileHandler: No credits found for user %s: %v", userID, err)
		credits = nil // User might not have credits initialized
		
		// Try to initialize credits for the user
		if profile != nil {
			err := initializeUserCreditsAndSubscription(userID, profile.Email)
			if err != nil {
				log.Printf("⚠️ GetProfileHandler: Failed to setup user credits: %v", err)
			} else {
				log.Printf("✅ GetProfileHandler: Initialized credits for user %s", profile.Email)
				// Try to get credits again
				credits, _ = GetUserCredits(userID)
			}
		}
	}

	response := UserProfileResponse{
		ID:                  profile.ID,
		Email:               profile.Email,
		Phone:               profile.Phone,
		FullName:            profile.FullName,
		CompanyName:         profile.CompanyName,
		CompanySize:         profile.CompanySize,
		Industry:            profile.Industry,
		Country:             profile.Country,
		PhoneVerified:       profile.PhoneVerified,
		EmailVerified:       profile.EmailVerified,
		OnboardingCompleted: profile.OnboardingCompleted,
		Status:              profile.Status,
		Plan:                plan,
		Credits:             credits,
	}

	c.JSON(http.StatusOK, response)
}

// GetCreditsHandler handles GET /api/auth/credits
func GetCreditsHandler(c *gin.Context) {
	userID := GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User authentication required",
			"code":  "AUTHENTICATION_REQUIRED",
		})
		return
	}

	credits, err := GetUserCredits(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User credits not found",
			"code":  "CREDITS_NOT_FOUND",
		})
		return
	}

	c.JSON(http.StatusOK, credits)
}

// GetSubscriptionPlansHandler handles GET /api/auth/plans
func GetSubscriptionPlansHandler(c *gin.Context) {
	plans, err := GetAllSubscriptionPlans()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch subscription plans",
			"code":  "PLANS_FETCH_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, plans)
}

// UpdateProfileHandler handles PUT /api/auth/profile
func UpdateProfileHandler(c *gin.Context) {
	userID := GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User authentication required",
			"code":  "AUTHENTICATION_REQUIRED",
		})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Add updated_at timestamp
	updateData["updated_at"] = "NOW()"

	// Update in database
	var result []map[string]interface{}
	err := supabaseClient.DB.From("user_profiles").
		Update(updateData).
		Eq("id", userID).
		Execute(&result)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update profile",
			"code":  "PROFILE_UPDATE_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// CreateUserHandler handles POST /api/auth/users (for new user creation)
func CreateUserHandler(c *gin.Context) {
	var req struct {
		UserID   string `json:"user_id" binding:"required"`
		Email    string `json:"email" binding:"required"`
		Phone    string `json:"phone"`
		FullName string `json:"full_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("🚀 CreateUserHandler: Setting up user %s (%s)", req.Email, req.UserID)

	// Create user profile first
	err := CreateUserProfile(req.UserID, req.Email, req.Phone, req.FullName)
	if err != nil {
		// If duplicate key error, user already exists - that's OK
		if !strings.Contains(err.Error(), "duplicate key") && !strings.Contains(err.Error(), "23505") {
			log.Printf("❌ CreateUserHandler: Failed to create user profile: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to create user profile",
				"code":  "PROFILE_CREATION_ERROR",
				"details": err.Error(),
			})
			return
		} else {
			log.Printf("⚠️ CreateUserHandler: User profile already exists for %s", req.Email)
		}
	}

	// Initialize user with free plan and credits
	err = initializeUserCreditsAndSubscription(req.UserID, req.Email)
	if err != nil {
		log.Printf("❌ CreateUserHandler: Failed to initialize credits and subscription: %v", err)
		// Don't fail the request, just log the warning
		log.Printf("⚠️ CreateUserHandler: User profile created but credits/subscription initialization failed")
	}

	log.Printf("✅ CreateUserHandler: User setup completed for %s", req.Email)

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user_id": req.UserID,
		"email": req.Email,
	})
}

// LoginHandler handles POST /api/auth/login (placeholder - Supabase handles auth)
func LoginHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Use Supabase client for authentication",
		"info":    "This endpoint is for documentation only",
	})
}

// RegisterHandler handles POST /api/auth/register (placeholder - Supabase handles auth)
func RegisterHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Use Supabase client for registration",
		"info":    "This endpoint is for documentation only",
	})
}

// LogoutHandler handles POST /api/auth/logout
func LogoutHandler(c *gin.Context) {
	// For JWT tokens, logout is handled client-side by removing the token
	c.JSON(http.StatusOK, gin.H{
		"message": "Logout successful",
		"info":    "Remove JWT token from client storage",
	})
}

// VerifyTokenHandler handles GET /api/auth/verify
func VerifyTokenHandler(c *gin.Context) {
	userID := GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"valid": false,
			"error": "Invalid or expired token",
		})
		return
	}

	// Update last login
	UpdateLastLogin(userID)

	c.JSON(http.StatusOK, gin.H{
		"valid":   true,
		"user_id": userID,
		"email":   GetUserEmail(c),
	})
}
