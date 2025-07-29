package mcc

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/sashabaranov/go-openai"
)

// MCCResult represents the result of MCC classification
type MCCResult struct {
	MCCCode        string  `json:"mcc_code"`
	Description    string  `json:"description"`
	Confidence     float64 `json:"confidence"`
	ReasonForScore string  `json:"reason_of_confidence_score"`
	MCCRestricted  bool    `json:"mcc_restricted"`
	Error          string  `json:"error,omitempty"`
}

// MCCClassifier handles MCC classification using OpenAI
type MCCClassifier struct {
	client     *openai.Client
	httpClient *http.Client
}

// NewMCCClassifier creates a new MCC classifier
func NewMCCClassifier() *MCCClassifier {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return &MCCClassifier{
			httpClient: &http.Client{Timeout: 30 * time.Second},
		}
	}

	return &MCCClassifier{
		client:     openai.NewClient(apiKey),
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// RestrictedMCCCodes contains the list of restricted MCC codes
var RestrictedMCCCodes = []string{
	"0742", "4411", "4511", "4722", "4812", "4814", "4816", "4829", "5047", "5094", "5099", "5499", "5699",
	"5734", "5912", "5921", "5933", "5966", "5968", "5969", "5971", "5993", "5995", "5999", "6012", "6051",
	"6211", "6282", "6300", "6531", "7011", "7273", "7276", "7297", "7299", "7322", "7372", "7375", "7389",
	"7393", "7399", "7512", "7841", "7994", "7995", "7996", "7999", "8011", "8099", "8299", "8398", "8399",
	"8651", "8999", "9223", "9399",
}

// ClassifyMCC classifies a domain's business using MCC codes
func (c *MCCClassifier) ClassifyMCC(domain string) MCCResult {
	result := MCCResult{
		MCCCode:       "0000",
		Description:   "Unknown",
		Confidence:    0.0,
		MCCRestricted: false,
	}

	// Extract text from the website
	websiteText, err := c.extractTextFromURL(domain)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to extract website content: %v", err)
		return result
	}

	if c.client == nil {
		result.Error = "OpenAI API key not configured"
		return result
	}

	// Classify using OpenAI
	classificationResult, err := c.classifyWithOpenAI(domain, websiteText)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to classify with OpenAI: %v", err)
		return result
	}

	// Check if MCC is restricted
	classificationResult.MCCRestricted = c.isRestrictedMCC(classificationResult.MCCCode)

	return classificationResult
}

// extractTextFromURL extracts visible text content from a website
func (c *MCCClassifier) extractTextFromURL(domain string) (string, error) {
	// Ensure domain has protocol
	url := domain
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		url = "https://" + url
	}

	// Create request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")

	// Execute request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to fetch URL: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP error: %d", resp.StatusCode)
	}

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %v", err)
	}

	// Parse HTML and extract text
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(body)))
	if err != nil {
		return "", fmt.Errorf("failed to parse HTML: %v", err)
	}

	// Remove script and style elements
	doc.Find("script, style, noscript").Remove()

	// Extract text content
	text := doc.Text()

	// Clean up text (remove extra whitespace, limit length)
	lines := strings.Split(text, "\n")
	var cleanedLines []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			cleanedLines = append(cleanedLines, line)
		}
	}

	cleanedText := strings.Join(cleanedLines, "\n")

	// Limit to 5000 characters to avoid API limits
	if len(cleanedText) > 5000 {
		cleanedText = cleanedText[:5000]
	}

	return cleanedText, nil
}

// classifyWithOpenAI uses OpenAI to classify the website content into MCC categories
func (c *MCCClassifier) classifyWithOpenAI(domain, websiteText string) (MCCResult, error) {
	prompt := fmt.Sprintf(`
You are an expert in Merchant Category Codes (MCC) classification. Your task is to analyze the provided website content and determine the most accurate MCC code based on industry standards. 

### **Classification Rules:**
1. **Identify the Merchant's Core Business Activity**  
- Analyze the extracted content to determine the primary services/products offered.  
- Focus on the business's **main revenue-generating activity** rather than supplementary services.

2. **Assign the Most Relevant MCC Code**  
- Ensure the MCC aligns with financial industry classifications.

**Website Domain:** %s

**Extracted Website Content:**
%s

**Example Response Format:**
{
    "mcc_code": "7273",
    "description": "Dating and Escort Services",
    "confidence": 0.90,
    "reason_of_confidence_score": "The website %s provides psychology-based relationship guidance, matchmaking services, and compatibility assessments. These services are characteristic of the Dating and Escort Services category, as they facilitate romantic connections and personal matchmaking. Therefore, the most appropriate MCC classification is 7273."
}

Ensure that the classification follows industry standards and remains consistent when the API is called multiple times.
`, domain, websiteText, domain)

	resp, err := c.client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4o,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleSystem,
					Content: "You are an expert in Merchant Category Codes (MCC), ensuring factual accuracy and consistency.",
				},
				{
					Role:    openai.ChatMessageRoleUser,
					Content: prompt,
				},
			},
			Temperature: 0, // Ensures consistent MCC categorization
		},
	)

	if err != nil {
		return MCCResult{}, fmt.Errorf("OpenAI API error: %v", err)
	}

	if len(resp.Choices) == 0 {
		return MCCResult{}, fmt.Errorf("empty response from OpenAI API")
	}

	// Parse the JSON response
	responseContent := resp.Choices[0].Message.Content

	// Clean JSON response (remove markdown code blocks if present)
	responseContent = strings.TrimSpace(responseContent)
	responseContent = strings.TrimPrefix(responseContent, "```json")
	responseContent = strings.TrimSuffix(responseContent, "```")
	responseContent = strings.TrimSpace(responseContent)

	var result MCCResult
	if err := json.Unmarshal([]byte(responseContent), &result); err != nil {
		return MCCResult{}, fmt.Errorf("failed to parse JSON response: %v", err)
	}

	return result, nil
}

// isRestrictedMCC checks if an MCC code is in the restricted list
func (c *MCCClassifier) isRestrictedMCC(mccCode string) bool {
	for _, restrictedCode := range RestrictedMCCCodes {
		if restrictedCode == mccCode {
			return true
		}
	}
	return false
}

// FindMCC is a convenience function that matches the Python interface
func FindMCC(domain string) MCCResult {
	classifier := NewMCCClassifier()
	return classifier.ClassifyMCC(domain)
}
