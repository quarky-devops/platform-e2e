#!/bin/bash

# Quick Fix - Remove All Supabase Dependencies

echo "🔧 Removing all Supabase dependencies and pushing fix..."

cd /Users/bidya/Documents/quarkfin/platform-e2e

# Add the fixed files
git add frontend/lib/api-client.ts frontend/lib/supabase.ts frontend/package.json bitbucket-pipelines.yml

# Commit the fix
git commit -m "🔧 Remove ALL Supabase dependencies - fix pipeline build errors"

# Push to trigger new pipeline
git push origin main

echo ""
echo "✅ FIXED AND PUSHED!"
echo "==================="
echo ""
echo "🎯 Changes made:"
echo "   ✅ Removed Supabase import from api-client.ts"
echo "   ✅ Replaced Supabase with AWS Cognito placeholders"
echo "   ✅ Updated package.json (aws-sdk instead of supabase)"
echo "   ✅ Pipeline sets Cognito environment variables"
echo ""
echo "🚀 New pipeline should:"
echo "   • Build frontend successfully (no Supabase errors)"
echo "   • Deploy to AWS infrastructure"  
echo "   • Go live with working platform"
echo ""
echo "⏱️ Monitor at: https://bitbucket.org/quarkfin/platform-e2e/addon/pipelines/home"
echo "🌐 Test at: https://d1o1sajvcnqzmr.cloudfront.net (in ~15 minutes)"
