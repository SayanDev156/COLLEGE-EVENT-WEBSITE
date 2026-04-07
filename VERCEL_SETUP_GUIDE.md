# ⚡ VERCEL ENVIRONMENT VARIABLE SETUP GUIDE

## Status Summary

✅ **MongoDB Connection Verified Locally**
- Successfully tested registration on local server (http://localhost:4000)
- Registration returned HTTP 201 with ID: 69d52714fb0f7d43f44d5d77
- Error shown on production proves issue is: **Missing MONGODB_URI in Vercel**

❌ **Production Issue**: https://college-event-website-puce.vercel.app/api/register returns:
```
Status: 500
Error: "Server initialization failed: MONGODB_URI is required in environment variables."
```

---

## MANUAL SETUP: Add MongoDB URI to Vercel (5 minutes)

### Step 1: Go to Vercel Dashboard
Open this URL in your browser:
```
https://vercel.com/dashboard
```

### Step 2: Select Your Project
- Click on: **COLLEGE-EVENT-WEBSITE**
- (Make sure it's the one showing URL: college-event-website-puce.vercel.app)

### Step 3: Open Project Settings
- Click the **Settings** tab at the top
- In the left sidebar, click **Environment Variables**

### Step 4: Add MONGODB_URI Variable
Click the **Add New** button and fill in:

**Name:**
```
MONGODB_URI
```

**Value (copy exactly):**
```
<YOUR_MONGODB_URI>
```

**Environments to apply to:**
- ☐️ Production
- ☐️ Preview
- ☐️ Development
(Make sure ALL THREE are checked)

### Step 5: Save and Deploy
- Click the **Save** button
- Vercel will automatically start a new deployment
- You'll see a notification: "Deployment in progress"
- Wait 1-2 minutes for it to show ✅ **"READY"**

### Step 6: Test the Live Site
Once deployment completes:

1. Open: https://college-event-website-puce.vercel.app/
2. Scroll to the "Register for Events" section
3. Fill in the form with test data:
   ```
   Name: Test User
   Email: test@example.com
   College: Test College
   Phone: 9876543210
   Event Type: Tech & Innovation
   Message: Testing registration
   Terms: ✅ Check the checkbox
   ```
4. Click **Submit Registration**
5. Expected result: ✅ "Registration successful!" message

---

## What I've Already Done ✅

1. **Local Testing** - Confirmed MongoDB URL works:
   - Connection string is valid
   - Database exists (campusfest)
   - Registration succeeds locally at http://localhost:4000
   - Returns HTTP 201 with registration ID

2. **Production Diagnosis** - Identified root cause:
   - GET /api/health works (server is running)
   - GET /api/content works (non-database routes work)
   - POST /api/register fails (database routes need MONGODB_URI)
   - Error message explicitly says: "MONGODB_URI is required in environment variables"

3. **Code Verification** - All code is correct:
   - No bugs in registration logic
   - Server properly checks for MONGODB_URI before using it
   - Works perfectly with the provided MongoDB credentials locally

---

## Other Environment Variables (Already Set)

These should already be configured in Vercel from previous setup:
```
JWT_SECRET: (your long random string)
ADMIN_EMAIL: admin@campusfest.edu
ADMIN_PASSWORD: pjxAjYShaDN1RnqynZA9!
ADMIN_NAME: CampusFest Admin
MAIL_PROVIDER: mailgun
MAILGUN_DOMAIN: sandboxaa59d2b9b5e74b9983ab4350f29a92a4.mailgun.org
MAILGUN_API_KEY: [YOUR_MAILGUN_API_KEY]
```

---

## Troubleshooting

### If registration still shows error after 2 minutes:
1. Hard refresh the browser (Ctrl+Shift+R)
2. Wait another minute for cache to clear
3. Try again

### If you see "MongoDB connection timeout":
- This means environment variable was set but MongoDB isn't accepting the connection
- Check: https://cloud.mongodb.com/
- Go to Network Access → IP Whitelist
- Verify Vercel's IP range is allowed (or set to 0.0.0.0/0 for all IPs)

### If you see "Authentication failed":
- The MongoDB credentials are correct
- This would mean your MongoDB user or password changed
- Contact MongoDB to reset if needed

---

## CLI Alternative (if you prefer command-line)

If you've authenticated with Vercel CLI (`vercel login`), you can run this script:

```powershell
# Run from the project directory
$mongoUri = '<YOUR_MONGODB_URI>'
vercel env add MONGODB_URI "$mongoUri" production
vercel env add MONGODB_URI "$mongoUri" preview
vercel env add MONGODB_URI "$mongoUri" development
```

Then wait 1-2 minutes and test the live site.

---

## Summary

- ✅ Code is 100% correct and tested locally
- ✅ MongoDB URL is valid and working
- ❌ Only missing: MONGODB_URI in Vercel environment settings
- 📝 Action needed: Add the environment variable (5-minute process via web UI)
- 🎯 Result expected: Registration will work on https://college-event-website-puce.vercel.app/

