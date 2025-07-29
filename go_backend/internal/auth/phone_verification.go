package auth

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// PhoneVerificationRequest represents phone verification request
type PhoneVerificationRequest struct {
	Phone string `json:"phone" binding:"required"`
}

// VerifyPhoneCodeRequest represents phone code verification request  
type VerifyPhoneCodeRequest struct {
	Phone string `json:"phone" binding:"required"`
	Code  string `json:"code" binding:"required"`
}

// PhoneVerificationResponse represents phone verification response
type PhoneVerificationResponse struct {
	Message   string `json:"message"`
	CodeSent  bool   `json:"code_sent"`
	ExpiresAt string `json:"expires_at"`
}

// SendPhoneVerificationHandler handles POST /api/auth/send-phone-verification
func SendPhoneVerificationHandler(c *gin.Context) {
	userID := GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User authentication required",
			"code":  "AUTHENTICATION_REQUIRED",
		})
		return
	}

	var req PhoneVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid phone number format",
			"code":  "INVALID_PHONE_FORMAT",
		})
		return
	}

	// Validate phone number format
	if err := validatePhoneNumber(req.Phone); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
			"code":  "INVALID_PHONE_FORMAT",
		})
		return
	}

	// Check if phone number is already verified by another user
	if err := validatePhoneNotInUse(req.Phone, userID); err != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": err.Error(),
			"code":  "PHONE_ALREADY_IN_USE",
		})
		return
	}

	// Generate 6-digit verification code
	verificationCode := generateVerificationCode()
	expiresAt := time.Now().Add(10 * time.Minute) // 10 minutes expiry

	// Store verification code in database
	if err := storePhoneVerification(userID, req.Phone, verificationCode, expiresAt); err != nil {
		log.Printf("❌ SendPhoneVerificationHandler: Failed to store verification: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to send verification code",
			"code":  "VERIFICATION_STORAGE_ERROR",
		})
		return
	}

	// Send SMS using AWS SNS
	err := sendSMSCode(req.Phone, verificationCode)
	if err != nil {
		log.Printf("❌ SendPhoneVerificationHandler: Failed to send SMS: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to send verification code",
			"code":  "SMS_SEND_ERROR",
		})
		return
	}

	response := PhoneVerificationResponse{
		Message:   "Verification code sent to your phone",
		CodeSent:  true,
		ExpiresAt: expiresAt.Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

// VerifyPhoneCodeHandler handles POST /api/auth/verify-phone-code
func VerifyPhoneCodeHandler(c *gin.Context) {
	userID := GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User authentication required",
			"code":  "AUTHENTICATION_REQUIRED",
		})
		return
	}

	var req VerifyPhoneCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"code":  "INVALID_REQUEST_FORMAT",
		})
		return
	}

	// Verify the code
	verified, err := verifyPhoneCode(userID, req.Phone, req.Code)
	if err != nil {
		log.Printf("❌ VerifyPhoneCodeHandler: Verification failed: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
			"code":  "VERIFICATION_FAILED",
		})
		return
	}

	if !verified {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid or expired verification code",
			"code":  "INVALID_CODE",
		})
		return
	}

	// Update user profile with verified phone and completed onboarding
	if err := updatePhoneVerificationStatus(userID, req.Phone); err != nil {
		log.Printf("❌ VerifyPhoneCodeHandler: Failed to update profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update phone verification status",
			"code":  "PROFILE_UPDATE_ERROR",
		})
		return
	}

	log.Printf("✅ Phone verification successful for user %s", userID)
	
	c.JSON(http.StatusOK, gin.H{
		"message":             "Phone number verified successfully",
		"phone_verified":      true,
		"onboarding_completed": true,
	})
}

// UpdatePhoneHandler handles PUT /api/auth/phone
func UpdatePhoneHandler(c *gin.Context) {
	userID := GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User authentication required",
			"code":  "AUTHENTICATION_REQUIRED",
		})
		return
	}

	var req PhoneVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid phone number format",
			"code":  "INVALID_PHONE_FORMAT",
		})
		return
	}

	// Check if phone number is already in use
	if err := validatePhoneNotInUse(req.Phone, userID); err != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": err.Error(),
			"code":  "PHONE_ALREADY_IN_USE",
		})
		return
	}

	// Update phone number (will require verification)
	updateData := map[string]interface{}{
		"phone":          req.Phone,
		"phone_verified": false, // Reset verification status
		"onboarding_completed": false, // Reset onboarding
		"updated_at":     time.Now().Format(time.RFC3339),
	}

	var result []map[string]interface{}
	err := supabaseClient.DB.From("user_profiles").
		Update(updateData).
		Eq("id", userID).
		Execute(&result)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update phone number",
			"code":  "PHONE_UPDATE_ERROR",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Phone number updated. Please verify your new number.",
		"phone":        req.Phone,
		"phone_verified": false,
	})
}

// Helper functions

// generateVerificationCode generates a 6-digit verification code
func generateVerificationCode() string {
	rand.Seed(time.Now().UnixNano())
	code := rand.Intn(900000) + 100000 // 100000 to 999999
	return strconv.Itoa(code)
}

// storePhoneVerification stores verification code in database
func storePhoneVerification(userID, phone, code string, expiresAt time.Time) error {
	if supabaseClient == nil {
		return fmt.Errorf("supabase client not initialized")
	}

	log.Printf("📱 Storing verification for user %s, phone %s, code %s", userID, phone, code)

	// Clear any existing verifications for this user/phone
	var deleteResult []map[string]interface{}
	err := supabaseClient.DB.From("phone_verifications").
		Delete().
		Eq("user_id", userID).
		Execute(&deleteResult)

	if err != nil {
		log.Printf("⚠️ Failed to clear old verifications: %v", err)
		// Don't fail, just log warning
	}

	// Insert new verification
	verification := map[string]interface{}{
		"user_id":           userID,
		"phone":             phone,
		"verification_code": code,
		"attempts":          0,
		"expires_at":        expiresAt.Format(time.RFC3339),
	}

	log.Printf("📱 Inserting verification record: %+v", verification)

	var result []map[string]interface{}
	err = supabaseClient.DB.From("phone_verifications").
		Insert(verification).
		Execute(&result)

	if err != nil {
		log.Printf("❌ Failed to insert verification: %v", err)
		return fmt.Errorf("failed to store verification: %v", err)
	}

	log.Printf("✅ Verification stored successfully: %+v", result)
	return nil
}

// verifyPhoneCode verifies the provided code
func verifyPhoneCode(userID, phone, code string) (bool, error) {
	if supabaseClient == nil {
		return false, fmt.Errorf("supabase client not initialized")
	}

	log.Printf("🔍 Looking for verification: user=%s, phone=%s, code=%s", userID, phone, code)

	// Get verification record
	var verifications []map[string]interface{}
	err := supabaseClient.DB.From("phone_verifications").
		Select("*").
		Eq("user_id", userID).
		Eq("phone", phone).
		Execute(&verifications)

	if err != nil {
		log.Printf("❌ Failed to fetch verification: %v", err)
		return false, fmt.Errorf("failed to fetch verification: %v", err)
	}

	log.Printf("📊 Found %d verification records", len(verifications))

	if len(verifications) == 0 {
		return false, fmt.Errorf("no verification found for this phone number")
	}

	verification := verifications[0]

	// Check if expired
	expiresAtStr, ok := verification["expires_at"].(string)
	if !ok {
		return false, fmt.Errorf("invalid expiry time format")
	}

	expiresAt, err := time.Parse(time.RFC3339, expiresAtStr)
	if err != nil {
		return false, fmt.Errorf("failed to parse expiry time")
	}

	if time.Now().After(expiresAt) {
		return false, fmt.Errorf("verification code has expired")
	}

	// Check attempts (max 3)
	attempts, ok := verification["attempts"].(float64)
	if !ok {
		attempts = 0
	}

	if attempts >= 3 {
		return false, fmt.Errorf("maximum verification attempts exceeded")
	}

	// Check code
	storedCode, ok := verification["verification_code"].(string)
	if !ok {
		return false, fmt.Errorf("invalid stored verification code")
	}

	if storedCode != code {
		// Increment attempts
		updateData := map[string]interface{}{
			"attempts": int(attempts) + 1,
		}

		var updateResult []map[string]interface{}
		err = supabaseClient.DB.From("phone_verifications").
			Update(updateData).
			Eq("user_id", userID).
			Eq("phone", phone).
			Execute(&updateResult)

		if err != nil {
			log.Printf("⚠️ Failed to update attempts: %v", err)
		}

		return false, fmt.Errorf("incorrect verification code")
	}

	// Mark as verified
	updateData := map[string]interface{}{
		"verified_at": time.Now().Format(time.RFC3339),
	}

	var updateResult []map[string]interface{}
	err = supabaseClient.DB.From("phone_verifications").
		Update(updateData).
		Eq("user_id", userID).
		Eq("phone", phone).
		Execute(&updateResult)

	if err != nil {
		log.Printf("⚠️ Failed to mark verification as completed: %v", err)
	}

	return true, nil
}

// updatePhoneVerificationStatus updates user profile after successful verification
func updatePhoneVerificationStatus(userID, phone string) error {
	if supabaseClient == nil {
		return fmt.Errorf("supabase client not initialized")
	}

	updateData := map[string]interface{}{
		"phone":               phone,
		"phone_verified":      true,
		"onboarding_completed": true,
		"updated_at":          time.Now().Format(time.RFC3339),
	}

	var result []map[string]interface{}
	err := supabaseClient.DB.From("user_profiles").
		Update(updateData).
		Eq("id", userID).
		Execute(&result)

	if err != nil {
		return fmt.Errorf("failed to update profile: %v", err)
	}

	return nil
}

// validatePhoneNotInUse checks if phone is already verified by another user
func validatePhoneNotInUse(phone, currentUserID string) error {
	if supabaseClient == nil {
		return fmt.Errorf("supabase client not initialized")
	}

	var profiles []UserProfile
	err := supabaseClient.DB.From("user_profiles").
		Select("id,email").
		Eq("phone", phone).
		Eq("phone_verified", "true").
		Execute(&profiles)

	if err != nil {
		return fmt.Errorf("failed to check phone availability: %v", err)
	}

	// If found users with this verified phone
	for _, profile := range profiles {
		if profile.ID != currentUserID {
			return fmt.Errorf("phone number is already verified by another user")
		}
	}

	return nil
}

