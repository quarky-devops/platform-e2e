package auth

import (
	"fmt"
	"log"
	"strings"
	"time"
)

// InitializeUserCreditsAndSubscription sets up free plan and credits for new user (exported)
func InitializeUserCreditsAndSubscription(userID, email string) error {
	return initializeUserCreditsAndSubscription(userID, email)
}

// initializeUserCreditsAndSubscription sets up free plan and credits for new user
func initializeUserCreditsAndSubscription(userID, email string) error {
	if supabaseClient == nil {
		return fmt.Errorf("supabase client not initialized")
	}

	log.Printf("💳 initializeUserCreditsAndSubscription: Setting up credits for %s", email)

	// 1. Get Free plan ID
	var plans []SubscriptionPlan
	err := supabaseClient.DB.From("subscription_plans").
		Select("*").
		Eq("plan_name", "Free").
		Eq("is_active", "true").
		Execute(&plans)

	if err != nil || len(plans) == 0 {
		return fmt.Errorf("failed to get Free plan: %v", err)
	}

	freePlan := plans[0]
	log.Printf("✅ initializeUserCreditsAndSubscription: Found Free plan (ID: %d)", freePlan.ID)

	// 2. Create subscription if it doesn't exist
	subscriptionData := map[string]interface{}{
		"user_id":           userID,
		"plan_id":           freePlan.ID,
		"billing_cycle":     "monthly",
		"status":            "active",
		"start_date":        time.Now().Format(time.RFC3339),
		"auto_renew":        true,
	}

	var subscriptionResults []map[string]interface{}
	err = supabaseClient.DB.From("user_subscriptions").
		Insert(subscriptionData).
		Execute(&subscriptionResults)

	if err != nil {
		if !strings.Contains(err.Error(), "duplicate") {
			log.Printf("⚠️ initializeUserCreditsAndSubscription: Failed to create subscription: %v", err)
		} else {
			log.Printf("⚠️ initializeUserCreditsAndSubscription: Subscription already exists")
		}
	} else {
		log.Printf("✅ initializeUserCreditsAndSubscription: Created Free subscription")
	}

	// 3. Initialize credits
	creditsData := map[string]interface{}{
		"user_id":               userID,
		"monthly_allocation":    freePlan.MonthlyCredits,
		"subscription_credits":  freePlan.MonthlyCredits,
		"recharged_credits":     0,
		"bonus_credits":         0,
		"used_credits":          0,
	}

	var creditsResults []map[string]interface{}
	err = supabaseClient.DB.From("user_credits").
		Insert(creditsData).
		Execute(&creditsResults)

	if err != nil {
		if !strings.Contains(err.Error(), "duplicate") {
			log.Printf("⚠️ initializeUserCreditsAndSubscription: Failed to create credits: %v", err)
		} else {
			log.Printf("⚠️ initializeUserCreditsAndSubscription: Credits already exist")
		}
	} else {
		log.Printf("✅ initializeUserCreditsAndSubscription: Initialized %d credits", freePlan.MonthlyCredits)

		// 4. Log the credit transaction
		transactionData := map[string]interface{}{
			"user_id":         userID,
			"transaction_type": "subscription_allocation",
			"credit_change":    freePlan.MonthlyCredits,
			"balance_before":   0,
			"balance_after":    freePlan.MonthlyCredits,
			"description":      "Initial Free plan credits",
		}

		var transactionResults []map[string]interface{}
		err = supabaseClient.DB.From("credit_transactions").
			Insert(transactionData).
			Execute(&transactionResults)

		if err != nil {
			log.Printf("⚠️ initializeUserCreditsAndSubscription: Failed to log credit transaction: %v", err)
		} else {
			log.Printf("✅ initializeUserCreditsAndSubscription: Logged initial credit transaction")
		}
	}

	return nil
}

// UserProfile represents a user profile in the database
type UserProfile struct {
	ID                  string    `json:"id" db:"id"`
	Email               string    `json:"email" db:"email"`
	Phone               string    `json:"phone" db:"phone"`
	FullName            string    `json:"full_name" db:"full_name"`
	CompanyName         *string   `json:"company_name" db:"company_name"`
	CompanySize         *string   `json:"company_size" db:"company_size"`
	Industry            *string   `json:"industry" db:"industry"`
	Country             *string   `json:"country" db:"country"`
	Timezone            *string   `json:"timezone" db:"timezone"`
	AvatarURL           *string   `json:"avatar_url" db:"avatar_url"`
	PhoneVerified       bool      `json:"phone_verified" db:"phone_verified"`
	EmailVerified       bool      `json:"email_verified" db:"email_verified"`
	OnboardingCompleted bool      `json:"onboarding_completed" db:"onboarding_completed"`
	SignupMethod        string    `json:"signup_method" db:"signup_method"`
	CreatedAt           time.Time `json:"created_at" db:"created_at"`
	UpdatedAt           time.Time `json:"updated_at" db:"updated_at"`
	LastLoginAt         *time.Time `json:"last_login_at" db:"last_login_at"`
	Status              string    `json:"status" db:"status"`
}

// UserCredits represents user credit balance
type UserCredits struct {
	ID                 string    `json:"id" db:"id"`
	UserID             string    `json:"user_id" db:"user_id"`
	MonthlyAllocation  int       `json:"monthly_allocation" db:"monthly_allocation"`
	SubscriptionCredits int      `json:"subscription_credits" db:"subscription_credits"`
	RechargedCredits   int       `json:"recharged_credits" db:"recharged_credits"`
	BonusCredits       int       `json:"bonus_credits" db:"bonus_credits"`
	UsedCredits        int       `json:"used_credits" db:"used_credits"`
	TotalCredits       int       `json:"total_credits" db:"total_credits"`
	AvailableCredits   int       `json:"available_credits" db:"available_credits"`
	LastResetDate      *time.Time `json:"last_reset_date" db:"last_reset_date"`
	NextResetDate      *time.Time `json:"next_reset_date" db:"next_reset_date"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

// SubscriptionPlan represents a subscription plan
type SubscriptionPlan struct {
	ID                   int     `json:"id" db:"id"`
	PlanName             string  `json:"plan_name" db:"plan_name"`
	PlanType             string  `json:"plan_type" db:"plan_type"`
	MonthlyCredits       int     `json:"monthly_credits" db:"monthly_credits"`
	YearlyCredits        *int    `json:"yearly_credits" db:"yearly_credits"`
	MonthlyPrice         float64 `json:"monthly_price" db:"monthly_price"`
	YearlyPrice          *float64 `json:"yearly_price" db:"yearly_price"`
	OveragePricePerCredit float64 `json:"overage_price_per_credit" db:"overage_price_per_credit"`
	Features             []string `json:"features" db:"features"`
	IsActive             bool    `json:"is_active" db:"is_active"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

// UserSubscription represents a user's subscription
type UserSubscription struct {
	ID                 string    `json:"id" db:"id"`
	UserID             string    `json:"user_id" db:"user_id"`
	PlanID             int       `json:"plan_id" db:"plan_id"`
	BillingCycle       string    `json:"billing_cycle" db:"billing_cycle"`
	Status             string    `json:"status" db:"status"`
	StartDate          time.Time `json:"start_date" db:"start_date"`
	EndDate            *time.Time `json:"end_date" db:"end_date"`
	NextBillingDate    *time.Time `json:"next_billing_date" db:"next_billing_date"`
	AutoRenew          bool      `json:"auto_renew" db:"auto_renew"`
	CancellationReason *string   `json:"cancellation_reason" db:"cancellation_reason"`
	CancelledAt        *time.Time `json:"cancelled_at" db:"cancelled_at"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

// GetUserProfile fetches a user profile by ID
func GetUserProfile(userID string) (*UserProfile, error) {
	if supabaseClient == nil {
		return nil, fmt.Errorf("supabase client not initialized")
	}

	var profiles []UserProfile
	err := supabaseClient.DB.From("user_profiles").
		Select("*").
		Eq("id", userID).
		Execute(&profiles)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch user profile: %v", err)
	}

	if len(profiles) == 0 {
		return nil, fmt.Errorf("user profile not found")
	}

	return &profiles[0], nil
}

// GetUserCredits fetches user credit balance
func GetUserCredits(userID string) (*UserCredits, error) {
	if supabaseClient == nil {
		return nil, fmt.Errorf("supabase client not initialized")
	}

	var creditsList []UserCredits
	err := supabaseClient.DB.From("user_credits").
		Select("*").
		Eq("user_id", userID).
		Execute(&creditsList)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch user credits: %v", err)
	}

	if len(creditsList) == 0 {
		return nil, fmt.Errorf("user credits not found")
	}

	return &creditsList[0], nil
}

// GetUserSubscription fetches user's active subscription
func GetUserSubscription(userID string) (*UserSubscription, *SubscriptionPlan, error) {
	if supabaseClient == nil {
		return nil, nil, fmt.Errorf("supabase client not initialized")
	}

	// Get user subscription
	var subscriptions []UserSubscription
	err := supabaseClient.DB.From("user_subscriptions").
		Select("*").
		Eq("user_id", userID).
		Eq("status", "active").
		Execute(&subscriptions)

	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch user subscription: %v", err)
	}

	if len(subscriptions) == 0 {
		return nil, nil, fmt.Errorf("no active subscription found")
	}

	subscription := &subscriptions[0]

	// Get plan details
	var plans []SubscriptionPlan
	err = supabaseClient.DB.From("subscription_plans").
		Select("*").
		Eq("id", fmt.Sprintf("%d", subscription.PlanID)).
		Execute(&plans)

	if err != nil {
		return subscription, nil, fmt.Errorf("failed to fetch subscription plan: %v", err)
	}

	if len(plans) == 0 {
		return subscription, nil, fmt.Errorf("subscription plan not found")
	}

	return subscription, &plans[0], nil
}

// ConsumeCredits deducts credits from user balance
func ConsumeCredits(userID string, creditsToConsume int, assessmentID *int64, description string) error {
	if supabaseClient == nil {
		return fmt.Errorf("supabase client not initialized")
	}

	if creditsToConsume == 0 {
		return nil // No credits to consume
	}

	log.Printf("💳 ConsumeCredits: Attempting to consume %d credits for user %s", creditsToConsume, userID)

	// Get current credits
	credits, err := GetUserCredits(userID)
	if err != nil {
		return fmt.Errorf("failed to get user credits: %v", err)
	}

	// Check if sufficient credits
	if credits.AvailableCredits < creditsToConsume {
		return fmt.Errorf("insufficient credits")
	}

	// Calculate new values
	newUsedCredits := credits.UsedCredits + creditsToConsume
	newAvailableCredits := credits.AvailableCredits - creditsToConsume

	// Update credits
	updateData := map[string]interface{}{
		"used_credits": newUsedCredits,
		"updated_at":   time.Now().Format(time.RFC3339),
	}

	var updateResults []map[string]interface{}
	err = supabaseClient.DB.From("user_credits").
		Update(updateData).
		Eq("user_id", userID).
		Execute(&updateResults)

	if err != nil {
		return fmt.Errorf("failed to update user credits: %v", err)
	}

	// Log the transaction
	transactionData := map[string]interface{}{
		"user_id":         userID,
		"transaction_type": "assessment_usage",
		"credit_change":    -creditsToConsume,
		"balance_before":   credits.AvailableCredits,
		"balance_after":    newAvailableCredits,
		"description":      description,
	}

	if assessmentID != nil {
		transactionData["assessment_id"] = *assessmentID
	}

	var transactionResults []map[string]interface{}
	err = supabaseClient.DB.From("credit_transactions").
		Insert(transactionData).
		Execute(&transactionResults)

	if err != nil {
		log.Printf("⚠️ ConsumeCredits: Failed to log transaction: %v", err)
		// Don't fail the whole operation for logging issues
	}

	log.Printf("✅ ConsumeCredits: Successfully consumed %d credits. New balance: %d", creditsToConsume, newAvailableCredits)
	return nil
}

// CreateUserProfile creates a new user profile
func CreateUserProfile(userID, email, phone, fullName string) error {
	if supabaseClient == nil {
		return fmt.Errorf("supabase client not initialized")
	}

	// For Google users or users without phone, use NULL instead of placeholder
	var phoneValue interface{}
	if phone == "" {
		phoneValue = nil // NULL in database
	} else {
		// Ensure phone is not longer than 20 characters (database constraint)
		if len(phone) > 20 {
			phone = phone[:20]
		}
		phoneValue = phone
	}

	profile := map[string]interface{}{
		"id":                  userID,
		"email":               email,
		"phone":               phoneValue, // NULL for Google users
		"full_name":           fullName,
		"email_verified":      true,
		"phone_verified":      false, // Always false initially
		"onboarding_completed": false, // False until phone is added and verified
		"signup_method":       "google",
		"status":              "active",
	}

	var result []map[string]interface{}
	err := supabaseClient.DB.From("user_profiles").
		Insert(profile).
		Execute(&result)

	if err != nil {
		return fmt.Errorf("failed to create user profile: %v", err)
	}

	log.Printf("✅ Created user profile for %s with phone: %v", email, phoneValue)
	return nil
}

// SetupNewUser initializes a new user with free plan and credits
func SetupNewUser(userID, email, phone, fullName string) error {
	if supabaseClient == nil {
		return fmt.Errorf("supabase client not initialized")
	}

	// Call the PostgreSQL function
	var result interface{}
	err := supabaseClient.DB.Rpc("setup_new_user", map[string]interface{}{
		"p_user_id":   userID,
		"p_email":     email,
		"p_phone":     phone,
		"p_full_name": fullName,
	}).Execute(&result)

	if err != nil {
		return fmt.Errorf("failed to setup new user: %v", err)
	}

	log.Printf("✅ Setup new user %s with free plan and credits", email)
	return nil
}

// UpdateLastLogin updates user's last login timestamp
func UpdateLastLogin(userID string) error {
	if supabaseClient == nil {
		return fmt.Errorf("supabase client not initialized")
	}

	update := map[string]interface{}{
		"last_login_at": time.Now(),
		"updated_at":    time.Now(),
	}

	var result []map[string]interface{}
	err := supabaseClient.DB.From("user_profiles").
		Update(update).
		Eq("id", userID).
		Execute(&result)

	if err != nil {
		return fmt.Errorf("failed to update last login: %v", err)
	}

	return nil
}

// GetAllSubscriptionPlans fetches all available subscription plans
func GetAllSubscriptionPlans() ([]SubscriptionPlan, error) {
	if supabaseClient == nil {
		return nil, fmt.Errorf("supabase client not initialized")
	}

	var plans []SubscriptionPlan
	err := supabaseClient.DB.From("subscription_plans").
		Select("*").
		Eq("is_active", "true").
		Execute(&plans)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch subscription plans: %v", err)
	}

	return plans, nil
}
