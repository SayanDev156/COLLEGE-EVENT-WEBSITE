# COMPLETE_VERCEL_SETUP.ps1
# This script automates the entire Vercel setup process
# It will authenticate with Vercel and set the MongoDB URI environment variable

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 COLLEGE-EVENT-WEBSITE - VERCEL SETUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Ensure Vercel CLI is installed
Write-Host "Step 1: Checking Vercel CLI..." -ForegroundColor Yellow
$vercelCmd = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelCmd) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI already installed" -ForegroundColor Green
}

# Step 2: Check current authentication
Write-Host "`nStep 2: Checking Vercel authentication..." -ForegroundColor Yellow
$whoami = vercel whoami 2>&1
if ($whoami -match "Not logged in" -or $whoami -match "Error") {
    Write-Host "⚠️  Not authenticated. Starting browser login..." -ForegroundColor Yellow
    Write-Host "You will need to approve authentication in your browser." -ForegroundColor Cyan
    Write-Host "Follow the prompts..." -ForegroundColor Cyan
    vercel login
    Write-Host "✅ Authenticated" -ForegroundColor Green
} else {
    Write-Host "✅ Already authenticated as: $whoami" -ForegroundColor Green
}

# Step 3: Ensure we're in the project directory
Write-Host "`nStep 3: Setting up project..." -ForegroundColor Yellow
Set-Location "c:\Users\sayan\Documents\COLLEGE-EVENT-WEBSITE"
Write-Host "Working directory: $(Get-Location)" -ForegroundColor Cyan

# Step 4: Link project if not already linked
Write-Host "`nStep 4: Linking Vercel project..." -ForegroundColor Yellow
if (Test-Path ".\.vercel") {
    Write-Host "✅ Project already linked" -ForegroundColor Green
} else {
    Write-Host "Linking project (will prompt for project selection)..." -ForegroundColor Cyan
    vercel link
}

# Step 5: Set MongoDB URI environment variable
Write-Host "`nStep 5: Setting MONGODB_URI environment variable..." -ForegroundColor Yellow

# Get from local .env or environment
$mongoUri = $env:MONGODB_URI
if (-not $mongoUri) {
    Write-Host "ERROR: MONGODB_URI not in environment. Check .env file." -ForegroundColor Red
    exit 1
}

Write-Host "Setting for production..." -ForegroundColor Cyan
vercel env add MONGODB_URI "$mongoUri" production
Write-Host "✅ Production environment set" -ForegroundColor Green

Write-Host "Setting for preview..." -ForegroundColor Cyan
vercel env add MONGODB_URI "$mongoUri" preview
Write-Host "✅ Preview environment set" -ForegroundColor Green

Write-Host "Setting for development..." -ForegroundColor Cyan
vercel env add MONGODB_URI "$mongoUri" development
Write-Host "✅ Development environment set" -ForegroundColor Green

# Step 6: Redeploy the project
Write-Host "`nStep 6: Redeploying project to Vercel..." -ForegroundColor Yellow
vercel deploy --prod
Write-Host "✅ Deployment started" -ForegroundColor Green

# Step 7: Provide next steps
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 What to do next:" -ForegroundColor Cyan
Write-Host "1. Wait 2-3 minutes for the deployment to complete"
Write-Host "2. Check deployment status: https://vercel.com/dashboard"
Write-Host "3. Once 'READY' status shows, test the site"
Write-Host "`n🧪 Test the registration:" -ForegroundColor Cyan
Write-Host "   URL: https://college-event-website-puce.vercel.app/"
Write-Host "   Form: Register for Events"
Write-Host "   Expected: ✅ Success message with registration ID"

Write-Host "`n💡 If you still see an error:" -ForegroundColor Yellow
Write-Host "   - Hard refresh browser (Ctrl+Shift+R)"
Write-Host "   - Wait another 2 minutes"
Write-Host "   - Check MongoDB connection at https://cloud.mongodb.com/"

Write-Host "`n🔒 SECURITY REMINDER:" -ForegroundColor Red
Write-Host "   MongoDB password is now in Vercel environment variables."
Write-Host "   Consider changing the MongoDB password for this account."
Write-Host "   (MongoDB Atlas → Database Access → Edit User)"

Write-Host "`n========================================`n" -ForegroundColor Cyan
