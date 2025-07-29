package db

import (
	supabase "github.com/supabase-community/supabase-go"
)

// Client is an alias for the Supabase client
type Client = supabase.Client

// CreateClient uses the official Supabase library to create an authenticated client.
func CreateClient(supabaseURL string, supabaseKey string) (*Client, error) {
	client, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		return nil, err
	}
	return client, nil
}
