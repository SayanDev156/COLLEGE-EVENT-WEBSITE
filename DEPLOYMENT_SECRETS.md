# GitHub Actions Secrets Setup (Vercel)

Add these repository secrets in GitHub:

- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID

## Where to add

GitHub repository -> Settings -> Secrets and variables -> Actions -> New repository secret

## Why needed

These are required by:

- .github/workflows/vercel-preview.yml
- .github/workflows/vercel-production.yml

Without them, Vercel preview/production deployment jobs will fail.
