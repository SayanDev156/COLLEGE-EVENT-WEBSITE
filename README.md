# CampusFest 2026 - Full Stack College Event Platform

A production-style college event website with:
- Public marketing site and registration form
- Node.js + Express backend
- MongoDB persistence with duplicate prevention
- Role-based admin dashboard with login
- Registration search/filter and CSV export
- Email confirmations and automated reminder scheduler
- Dynamic content management for highlights/speakers/schedule/announcement
- SEO and social sharing metadata
- Accessibility and performance enhancements
- GitHub Actions CI + Vercel preview/production workflows

## Tech Stack
- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express, Mongoose
- Database: MongoDB
- Auth: JWT + role-based access
- Emails: Nodemailer via SMTP or Mailgun API
- Scheduler: node-cron

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment file:
   - Copy `.env.example` to `.env`
   - Fill values for MongoDB, JWT, mail provider, and admin seed
3. Run in development:
   ```bash
   npm run dev
   ```
4. Open:
   - Public site: `http://localhost:4000`
   - Admin page: `http://localhost:4000/admin`

## Core APIs
- `POST /api/register` -> Save registration with duplicate checks
- `POST /api/auth/login` -> Admin login and JWT token
- `GET /api/admin/registrations` -> Secure list with search/filter
- `GET /api/admin/registrations.csv` -> Secure CSV export
- `GET /api/admin/stats` -> Secure dashboard metrics
- `GET /api/content` -> Public dynamic content
- `PUT /api/content` -> Admin content update
- `PUT /api/content/announcement` -> Admin announcement update

## Environment Variables
See `.env.example` for all required values:
- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
- `MAIL_PROVIDER` (`smtp` or `mailgun`)
- SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`)
- Mailgun settings (`MAILGUN_DOMAIN`, `MAILGUN_API_KEY`, `MAIL_FROM`)
- `EVENT_START_AT`
- `APP_BASE_URL`

## Deployment
- `vercel.json` routes all requests to server entrypoint
- GitHub Actions:
  - `.github/workflows/ci.yml`
  - `.github/workflows/vercel-preview.yml`
  - `.github/workflows/vercel-production.yml`

Configure repository secrets for Vercel deployment:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Notes
- Reminder emails are sent by scheduler when event start is ~24 hours away.
- Update `sitemap.xml` and `robots.txt` domain placeholders before production.
