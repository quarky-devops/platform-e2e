package auth

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	supa "github.com/nedpals/supabase-go"
)

var supabaseClient *supa.Client

// InitAuth initializes the authentication system
func InitAuth(supabaseURL, supabaseKey string) error {
	client := supa.CreateClient(supabaseURL, supabaseKey)
	if client == nil {
		return fmt.Errorf("failed to create Supabase client for auth")
	}
	supabaseClient = client
	return nil
}

// AuthMiddleware validates JWT tokens and extracts user context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.Printf("❌ AuthMiddleware: Missing Authorization header")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
				"code":  "MISSING_AUTH_HEADER",
			})
			c.Abort()
			return
		}

		// Extract Bearer token
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			log.Printf("❌ AuthMiddleware: Invalid auth header format: %s", authHeader)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format",
				"code":  "INVALID_AUTH_FORMAT",
			})
			c.Abort()
			return
		}

		token := tokenParts[1]
		log.Printf("🔑 AuthMiddleware: Validating token for path %s", c.Request.URL.Path)

		// Validate token with Supabase
		user, err := supabaseClient.Auth.User(context.Background(), token)
		if err != nil {
			log.Printf("❌ AuthMiddleware: Token validation failed: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
				"code":  "INVALID_TOKEN",
			})
			c.Abort()
			return
		}

		log.Printf("✅ AuthMiddleware: Token valid for user %s (%s)", user.Email, user.ID)

		// Set user context
		c.Set("user_id", user.ID)
		c.Set("user_email", user.Email)
		c.Set("user", user)

		c.Next()
	}
}

// GetUserID extracts user ID from context
func GetUserID(c *gin.Context) string {
	if userID, exists := c.Get("user_id"); exists {
		return userID.(string)
	}
	return ""
}

// GetUserEmail extracts user email from context
func GetUserEmail(c *gin.Context) string {
	if userEmail, exists := c.Get("user_email"); exists {
		return userEmail.(string)
	}
	return ""
}

// OptionalAuthMiddleware - for endpoints that work with or without auth
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			tokenParts := strings.Split(authHeader, " ")
			if len(tokenParts) == 2 && tokenParts[0] == "Bearer" {
				token := tokenParts[1]
				if user, err := supabaseClient.Auth.User(context.Background(), token); err == nil {
					c.Set("user_id", user.ID)
					c.Set("user_email", user.Email)
					c.Set("user", user)
				}
			}
		}
		c.Next()
	}
}
