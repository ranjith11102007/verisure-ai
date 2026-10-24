# VeriSure AI - Deployment Guide

## Live URLs
To be filled after deployment:
- GitHub Repository: [TBD]
- Neon Database: [TBD - project name only]
- Backend (Render): [TBD]
- Frontend (Vercel): [TBD]

## Quick Start for Redeployment
1. Make changes locally
2. Commit: `git add . && git commit -m "Your message"`
3. Push: `git push origin main`
4. Render and Vercel will auto-deploy from GitHub

## Environment Variables

### Backend (Render)
| Variable | Value | Notes |
|----------|-------|-------|
| APP_NAME | VeriSure AI | |
| ENVIRONMENT | production | |
| SECRET_KEY | (auto-generated) | Keep secure |
| ACCESS_TOKEN_EXPIRE_MINUTES | 60 | |
| REFRESH_TOKEN_EXPIRE_DAYS | 7 | |
| DATABASE_URL | postgresql://... | From Neon (pooled preferred) |
| ALLOWED_ORIGINS | https://your-app.vercel.app | Comma-separated for multiple |
| UPLOAD_DIR | ./uploads | Ephemeral on free hosts |
| MAX_UPLOAD_SIZE_MB | 50 | |
| ALLOWED_EXTENSIONS | pdf,png,jpg,jpeg | |
| TESSERACT_CMD | "" | Leave empty if not installed |
| ADMIN_EMAIL | admin@verisure.local | |
| ADMIN_PASSWORD | (set securely) | Change after first login |
| ADMIN_FULL_NAME | System Administrator | |

### Frontend (Vercel)
| Variable | Value | Notes |
|----------|-------|-------|
| VITE_API_BASE_URL | https://your-backend.onrender.com | No trailing slash |

## Known Limitations (Free Tier)
- **File Uploads**: Stored in ephemeral filesystem on Render - files lost on restart/redeploy
- **OCR/Tesseract**: Not installed on Render free tier - OCR features will report "Unable to Verify" gracefully
- **Cold Starts**: Render free tier may spin down after inactivity (first request may be slow)
- **Database**: Neon free tier has connection limits
- **No persistent file storage**: Use external storage for production use cases

## Post-Deployment Steps
1. Run migrations: `alembic upgrade head` (entrypoint.sh does this automatically)
2. Create admin user if needed via Render shell
3. Update ALLOWED_ORIGINS after getting Vercel URL
4. Test core flows: register/login, create app, upload document

## Verification Checklist
- [ ] Frontend loads
- [ ] Backend /api/health returns healthy
- [ ] Backend /api/docs accessible
- [ ] Can register/login
- [ ] Can create application
- [ ] CORS configured correctly
- [ ] Protected routes require auth
