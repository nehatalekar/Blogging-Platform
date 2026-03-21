# BlogPlatform - Deployment Guide

## Production Deployment Checklist

### Prerequisites
- Node.js 20.x or higher
- Network database (Vercel Postgres, Neon, Supabase, etc.)
- SMTP service for email (Brevo, SendGrid, etc.)
- Vercel account

> Important: SQLite (`file:...`) is not supported for Vercel production in this project.

### Environment Variables Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Set required environment variables:
```
DATABASE_URL=           # Your database connection string
NEXTAUTH_SECRET=        # Generate with: openssl rand -hex 32
NEXTAUTH_URL=          # Your production domain
SMTP_HOST=             # Email service SMTP host
SMTP_PORT=             # Email service SMTP port
EMAIL_USER=            # Email service username
EMAIL_PASSWORD=        # Email service password
EMAIL_FROM=            # Sender email address
BLOB_READ_WRITE_TOKEN= # Vercel Blob token for production uploads
OPENAI_API_KEY=        # Optional (only for AI draft features)
```

### Local Testing Before Deployment

```bash
# Install dependencies
npm install

# Build locally
npm run build

# Start production server
npm start
```

Visit `http://localhost:3000` and test:
- Sign up with email
- Email verification (OTP)
- Create and publish blogs
- Like, comment, and save blogs

### Deploying to Vercel

#### Option 1: Using Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Option 2: GitHub Integration
1. Push code to GitHub
2. Go to https://vercel.com/new
3. Select your repository
4. Add environment variables in Settings
5. Deploy

### Post-Deployment Setup

1. **Database Migration**
   - This project runs `prisma db push` during Vercel build.
   - Ensure `DATABASE_URL` is configured in Vercel before the first deploy.

2. **Verify Services**
   - Test user registration and email verification
   - Test blog creation and publishing
   - Test engagement features (likes, comments, saves)

3. **Monitor Performance**
   - Check Vercel Analytics dashboard
   - Monitor error rates and response times
   - Review database performance

### Optimization Settings

The application is configured with:
- ✅ React Compiler optimization
- ✅ Image optimization with WebP/AVIF
- ✅ SWC minification
- ✅ Security headers
- ✅ Prisma connection pooling (when using external DB)

### Troubleshooting

**Build Fails**
- Check environment variables are set
- Verify database connection string
- Run `npm run build` locally to debug

**Email Not Sending**
- Verify SMTP credentials
- Check firewall/network settings
- Enable "Less secure apps" if needed

**Database Errors**
- Ensure DATABASE_URL is accessible from Vercel
- Confirm DATABASE_URL is not SQLite (`file:...`)
- Run migrations manually if needed
- Check database connection limits

**Upload Errors in Production**
- Set `BLOB_READ_WRITE_TOKEN` in Vercel environment variables
- Redeploy after adding the token

### Security Checklist

- ✅ Environment variables not in version control (use `.env.local`, `.env.production.local`)
- ✅ NEXTAUTH_SECRET generated securely
- ✅ HTTPS enforced (automatic on Vercel)
- ✅ Security headers configured
- ✅ Input validation on all endpoints
- ✅ Database queries use parameterized queries (Prisma)

### Monitoring & Logging

Access logs via:
1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **Vercel CLI**: `vercel logs --prod`
3. Application logs in Vercel Functions

### Support & Maintenance

- Monitor error rates in Vercel Analytics
- Set up alerts for failed deployments
- Regular database backups
- Keep dependencies updated with `npm update`

---

**Last Updated**: February 10, 2026
