$ErrorActionPreference = 'Stop'

$base = 'http://localhost:4000'
$headers = @{ 'Content-Type' = 'application/json' }

$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$email = "test+$stamp@example.com"
$phone = (Get-Random -Minimum 1000000000 -Maximum 1999999999).ToString()

$payload = @{
  name = 'Smoke Test User'
  email = $email
  college = 'CampusFest QA College'
  phone = $phone
  eventType = 'tech'
  message = 'Smoke test registration'
  termsAccepted = $true
} | ConvertTo-Json

$register = Invoke-RestMethod -Method Post -Uri "$base/api/register" -Headers $headers -Body $payload

if (-not $register.success) { throw 'Registration request did not return success.' }

$duplicateBlocked = $false
try {
  Invoke-RestMethod -Method Post -Uri "$base/api/register" -Headers $headers -Body $payload | Out-Null
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 409) {
    $duplicateBlocked = $true
  }
}

if (-not $duplicateBlocked) { throw 'Duplicate prevention check failed (expected HTTP 409).' }

$loginPayload = @{ email = 'admin@campusfest.edu'; password = 'pjxAjYShaDN1RnqynZA9!' } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -Headers $headers -Body $loginPayload

if (-not $login.success) { throw 'Admin login failed.' }

$authHeaders = @{ Authorization = "Bearer $($login.data.token)" }

$stats = Invoke-RestMethod -Method Get -Uri "$base/api/admin/stats" -Headers $authHeaders
if (-not $stats.success) { throw 'Stats endpoint failed.' }

$regs = Invoke-RestMethod -Method Get -Uri "$base/api/admin/registrations?search=Smoke&track=tech" -Headers $authHeaders
if (-not $regs.success) { throw 'Registration list endpoint failed.' }

$csvResponse = Invoke-WebRequest -UseBasicParsing -Method Get -Uri "$base/api/admin/registrations.csv" -Headers $authHeaders
if ($csvResponse.StatusCode -ne 200) { throw 'CSV export endpoint failed.' }

$announcementPayload = @{
  enabled = $true
  type = 'info'
  message = "QA announcement updated at $stamp"
} | ConvertTo-Json

$authJsonHeaders = @{ Authorization = "Bearer $($login.data.token)"; 'Content-Type' = 'application/json' }
$announcement = Invoke-RestMethod -Method Put -Uri "$base/api/content/announcement" -Headers $authJsonHeaders -Body $announcementPayload

if (-not $announcement.success) { throw 'Announcement update failed.' }

Write-Output "E2E SMOKE PASSED"
Write-Output "Registration email used: $email"
