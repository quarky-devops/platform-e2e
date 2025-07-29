package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

type Config struct {
	// Server configuration
	Port    string
	GinMode string

	// Database configuration
	PostgresHost     string
	PostgresPort     string
	PostgresDB       string
	PostgresUser     string
	PostgresPassword string

	MongoHost     string
	MongoPort     string
	MongoDB       string
	MongoUser     string
	MongoPassword string

	// Supabase configuration
	SupabaseURL        string
	SupabaseServiceKey string
	SupabaseAnonKey    string

	// AWS configuration
	AWSRegion          string
	AWSAccessKeyID     string
	AWSSecretAccessKey string
	EnableSMS          bool

	// Redis configuration
	RedisHost string
	RedisPort string

	// Environment
	Environment string
}

func LoadConfig() (*Config, error) {
	cfg := &Config{
		// Server defaults
		Port:        getEnv("PORT", "8080"),
		GinMode:     getEnv("GIN_MODE", "debug"),
		Environment: getEnv("ENVIRONMENT", "development"),

		// Database defaults
		PostgresPort: getEnv("POSTGRES_PORT", "5432"),
		PostgresDB:   getEnv("POSTGRES_DB", "quarkfin"),
		PostgresUser: getEnv("POSTGRES_USER", "quarkfin_app"),

		MongoPort: getEnv("MONGODB_PORT", "27017"),
		MongoDB:   getEnv("MONGODB_DB", "quarkfin"),
		MongoUser: getEnv("MONGODB_USER", "quarkfin_app"),

		// AWS defaults
		AWSRegion: getEnv("AWS_REGION", "us-east-1"),
		EnableSMS: getEnvBool("ENABLE_SMS", false),

		// Redis defaults
		RedisPort: getEnv("REDIS_PORT", "6379"),
	}

	// Load configuration based on environment
	if cfg.Environment == "production" {
		log.Printf("Loading production configuration from SSM Parameter Store...")
		if err := cfg.loadFromSSM(); err != nil {
			log.Printf("Warning: Failed to load from SSM, falling back to environment variables: %v", err)
			cfg.loadFromEnv()
		}
	} else {
		log.Printf("Loading development configuration from environment variables...")
		cfg.loadFromEnv()
	}

	// Validate required configuration
	if err := cfg.validate(); err != nil {
		return nil, fmt.Errorf("configuration validation failed: %w", err)
	}

	return cfg, nil
}

func (c *Config) loadFromEnv() {
	c.PostgresHost = getEnv("POSTGRES_HOST", "localhost")
	c.PostgresPassword = getEnv("POSTGRES_PASSWORD", "")

	c.MongoHost = getEnv("MONGODB_HOST", "localhost")
	c.MongoPassword = getEnv("MONGODB_PASSWORD", "")

	c.SupabaseURL = getEnv("SUPABASE_URL", "")
	c.SupabaseServiceKey = getEnv("SUPABASE_SERVICE_KEY", "")
	c.SupabaseAnonKey = getEnv("SUPABASE_ANON_KEY", "")

	c.AWSAccessKeyID = getEnv("AWS_ACCESS_KEY_ID", "")
	c.AWSSecretAccessKey = getEnv("AWS_SECRET_ACCESS_KEY", "")

	c.RedisHost = getEnv("REDIS_HOST", "localhost")
}

func (c *Config) loadFromSSM() error {
	// Load AWS configuration
	awsCfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(c.AWSRegion),
	)
	if err != nil {
		return fmt.Errorf("failed to load AWS config: %w", err)
	}

	ssmClient := ssm.NewFromConfig(awsCfg)
	paramPrefix := fmt.Sprintf("/quarkfin/%s", c.Environment)

	// Define parameters to fetch
	params := map[string]*string{
		fmt.Sprintf("%s/database/postgres/password", paramPrefix): &c.PostgresPassword,
		fmt.Sprintf("%s/database/mongodb/password", paramPrefix): &c.MongoPassword,
		fmt.Sprintf("%s/supabase/url", paramPrefix):              &c.SupabaseURL,
		fmt.Sprintf("%s/supabase/service_key", paramPrefix):      &c.SupabaseServiceKey,
		fmt.Sprintf("%s/supabase/anon_key", paramPrefix):         &c.SupabaseAnonKey,
		fmt.Sprintf("%s/aws/access_key_id", paramPrefix):         &c.AWSAccessKeyID,
		fmt.Sprintf("%s/aws/secret_access_key", paramPrefix):     &c.AWSSecretAccessKey,
	}

	// Fetch parameters
	for paramName, target := range params {
		result, err := ssmClient.GetParameter(context.TODO(), &ssm.GetParameterInput{
			Name:           aws.String(paramName),
			WithDecryption: aws.Bool(true),
		})
		if err != nil {
			log.Printf("Warning: Failed to fetch parameter %s: %v", paramName, err)
			continue
		}
		*target = *result.Parameter.Value
	}

	// Get database hosts from environment (set by Terraform)
	c.PostgresHost = getEnv("POSTGRES_HOST", "")
	c.MongoHost = getEnv("MONGODB_HOST", "")
	c.RedisHost = getEnv("REDIS_HOST", "")

	return nil
}

func (c *Config) validate() error {
	if c.Port == "" {
		return fmt.Errorf("PORT is required")
	}

	if c.Environment == "production" {
		if c.PostgresHost == "" {
			return fmt.Errorf("POSTGRES_HOST is required in production")
		}
		if c.MongoHost == "" {
			return fmt.Errorf("MONGODB_HOST is required in production")
		}
		if c.SupabaseURL == "" {
			return fmt.Errorf("SUPABASE_URL is required")
		}
		if c.SupabaseServiceKey == "" {
			return fmt.Errorf("SUPABASE_SERVICE_KEY is required")
		}
	}

	return nil
}

func (c *Config) PostgresConnectionString() string {
	if c.PostgresPassword == "" {
		return fmt.Sprintf("host=%s port=%s user=%s dbname=%s sslmode=disable",
			c.PostgresHost, c.PostgresPort, c.PostgresUser, c.PostgresDB)
	}
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		c.PostgresHost, c.PostgresPort, c.PostgresUser, c.PostgresPassword, c.PostgresDB)
}

func (c *Config) MongoConnectionString() string {
	if c.MongoPassword == "" {
		return fmt.Sprintf("mongodb://%s:%s/%s", c.MongoHost, c.MongoPort, c.MongoDB)
	}
	return fmt.Sprintf("mongodb://%s:%s@%s:%s/%s",
		c.MongoUser, c.MongoPassword, c.MongoHost, c.MongoPort, c.MongoDB)
}

func (c *Config) RedisConnectionString() string {
	return fmt.Sprintf("%s:%s", c.RedisHost, c.RedisPort)
}

func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}
	return defaultValue
}
