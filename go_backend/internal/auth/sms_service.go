package auth

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sns/types"
)

var snsClient *sns.Client

// InitSMS initializes AWS SNS for SMS sending
func InitSMS() error {
	// Skip SMS initialization if disabled
	if os.Getenv("ENABLE_SMS") != "true" {
		log.Printf("📱 SMS disabled in environment - using development mode")
		return nil
	}

	// Load AWS configuration
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(os.Getenv("AWS_REGION")),
	)
	if err != nil {
		return fmt.Errorf("failed to load AWS config: %v", err)
	}

	// Create SNS client
	snsClient = sns.New(sns.Options{
		Region:      cfg.Region,
		Credentials: cfg.Credentials,
	})

	log.Printf("✅ AWS SNS initialized for region: %s", cfg.Region)
	return nil
}

// sendSMSCode sends verification code via AWS SNS
func sendSMSCode(phone, code string) error {
	// If SMS disabled, just log (development mode)
	if os.Getenv("ENABLE_SMS") != "true" || snsClient == nil {
		log.Printf("📱 [DEV MODE] SMS to %s: Your QuarkfinAI verification code is: %s", phone, code)
		return nil
	}

	// Format phone number (ensure it starts with +)
	if phone[0] != '+' {
		phone = "+" + phone
	}

	// Create SMS message
	message := fmt.Sprintf("Your QuarkfinAI verification code is: %s. Valid for 10 minutes. Do not share this code.", code)

	// Send SMS via AWS SNS
	input := &sns.PublishInput{
		Message:     aws.String(message),
		PhoneNumber: aws.String(phone),
		MessageAttributes: map[string]types.MessageAttributeValue{
			"AWS.SNS.SMS.SenderID": {
				DataType:    aws.String("String"),
				StringValue: aws.String("QuarkfinAI"),
			},
			"AWS.SNS.SMS.SMSType": {
				DataType:    aws.String("String"),
				StringValue: aws.String("Transactional"),
			},
		},
	}

	result, err := snsClient.Publish(context.TODO(), input)
	if err != nil {
		log.Printf("❌ Failed to send SMS to %s: %v", phone, err)
		return fmt.Errorf("failed to send SMS: %v", err)
	}

	log.Printf("✅ SMS sent successfully to %s (MessageID: %s)", phone, *result.MessageId)
	return nil
}

// validatePhoneNumber performs basic phone number validation
func validatePhoneNumber(phone string) error {
	// Remove spaces and special characters for validation
	cleaned := phone
	for _, char := range []string{" ", "-", "(", ")", "."} {
		cleaned = strings.ReplaceAll(cleaned, char, "")
	}

	// Check length (should be 10-15 digits plus optional +)
	if len(cleaned) < 10 || len(cleaned) > 16 {
		return fmt.Errorf("phone number must be 10-15 digits")
	}

	// Check if it starts with + and contains only digits after that
	if cleaned[0] == '+' {
		for _, char := range cleaned[1:] {
			if char < '0' || char > '9' {
				return fmt.Errorf("phone number contains invalid characters")
			}
		}
	} else {
		// If no +, should be all digits
		for _, char := range cleaned {
			if char < '0' || char > '9' {
				return fmt.Errorf("phone number contains invalid characters")
			}
		}
	}

	return nil
}
