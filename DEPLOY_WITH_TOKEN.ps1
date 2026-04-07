# DEPLOY_WITH_TOKEN.ps1
# The SIMPLEST way to fix registration in Vercel
# 
# USAGE: 
#  $token = "vercel_XXX..." (from https://vercel.com/account/tokens)
#  & ".\DEPLOY_WITH_TOKEN.ps1" -Token $token

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$MongoUri = $env:MONGODB_URI
)

if (-not $MongoUri) {
    Write-Host "ERROR: MONGODB_URI not found in environment variables" -ForegroundColor Red
    Write-Host "Set it in .env first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Deploying with MONGODB_URI setup..." -ForegroundColor Cyan

# Set token in environment for Vercel CLI
$env:VERCEL_TOKEN = $Token

# Navigate to project
cd "c:\Users\sayan\Documents\COLLEGE-EVENT-WEBSITE"

# Get project info
Write-Host "Getting project information..." -ForegroundColor Cyan
$projectInfo = vercel projects ls --json 2>$null | ConvertFrom-Json

if (-not $projectInfo) {
    Write-Host "Could not get project list. Verifying token..." -ForegroundColor Yellow
    $verify = vercel whoami 2>&1
    if ($verify -match "Not logged in" -or $verify -match "Error") {
        Write-Host "Token is invalid. Please check your Vercel token." -ForegroundColor Red
        exit 1
    }
}

# Set environment variables
Write-Host "Setting MONGODB_URI in Vercel..." -ForegroundColor Cyan
vercel env add MONGODB_URI "$MongoUri" production --token=$Token
vercel env add MONGODB_URI "$MongoUri" preview --token=$Token  
vercel env add MONGODB_URI "$MongoUri" development --token=$Token

Write-Host "Redeploying to Vercel..." -ForegroundColor Cyan
vercel deploy --prod --token=$Token

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "Test at: https://college-event-website-puce.vercel.app/" -ForegroundColor Cyan
