# VeriSure AI

**Intelligent Application Validation, Document Authentication & Regulatory Compliance Platform**

Evidence-led verification. Trusted regulatory decisions.

## Overview

VeriSure AI is a comprehensive platform for institutional application validation, document authentication, and regulatory compliance verification. Built with a focus on forensic rigor, auditability, and human-in-the-loop review.

## Design

The UI preserves the Stitch design system with:
- **Color Palette**: Navy/slate shell, light canvas workspace, primary blue (#004ac6), secondary teal (#006a61)
- **Typography**: Plus Jakarta Sans (headlines), Inter (UI), JetBrains Mono (hashes/timestamps)
- **Components**: Enterprise-grade cards, tables, split-pane inspectors, forensic overlays
- **Layout**: Persistent sidebar, dense data tables, audit trails

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- TanStack Query

### Backend
- FastAPI (Python)
- SQLAlchemy 2.x + Alembic
- PostgreSQL
- Pydantic v2
- JWT Authentication
- PyMuPDF, pytesseract (OCR), Pillow, OpenCV
- ReportLab (PDF reports)

### Infrastructure
- Docker Compose (PostgreSQL)
- Free and open-source dependencies only

## Features

- **Authentication & RBAC**: Registration, login, role-based access (Admin, Reviewer, Applicant)
- **Application Management**: Create, track, and manage applications with state machine workflow
- **Document Upload**: Secure upload with file validation, SHA-256 hashing, duplicate detection
- **Document Intelligence**: OCR/extraction pipeline with field review and correction
- **Document Authentication**: Forensic checks (hash integrity, metadata, QR, signatures) with honest status reporting
- **Compliance Rules Engine**: Versioned rules with findings and human review
- **Evidence Requests**: Request additional info with audit trail
- **Audit History**: Append-only audit log of all critical actions
- **Reports & Analytics**: Real database-driven metrics with CSV/PDF export

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- PostgreSQL 14+ (or use Docker)
- Tesseract OCR (for scanned documents)

### Installing Tesseract OCR

**Windows:**
1. Download from [UB Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
2. Install and note the path (e.g., `C:\Program Files\Tesseract-OCR\tesseract.exe`)
3. Add to PATH or set `TESSERACT_CMD` in .env

**Linux (Ubuntu/Debian):**
```bash
sudo apt install tesseract-ocr libtesseract-dev
```

**macOS:**
```bash
brew install tesseract
```

## Setup Instructions

### 1. Clone and setup environment

```bash
cd verisure
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

### 2. Database Setup (Option A: Docker)

```bash
docker-compose up -d db
```

### 2. Database Setup (Option B: Local PostgreSQL)

Create database and user:
```sql
CREATE USER verisure_user WITH PASSWORD 'verisure_pass';
CREATE DATABASE verisure_db OWNER verisure_user;
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
# source venv/bin/activate

pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Create admin user (bootstrap)
# Use the admin credentials from .env or create via API
python -c "
# Quick bootstrap script
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()
admin = db.query(User).filter(User.email='admin@verisure.local').first()
if not admin:
    admin = User(
        email='admin@verisure.local',
        password_hash=get_password_hash('change-this-password'),
        full_name='System Administrator',
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(admin)
    db.commit()
    print('Admin created')
else:
    print('Admin exists')
db.close()
"

# Start backend
python run.py
# or: uvicorn app.main:app --reload
```

Backend will be available at http://localhost:8000
API docs at http://localhost:8000/api/docs

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:5173

## Default Credentials

After bootstrap, use:
- Email: `admin@verisure.local`
- Password: `change-this-password` (change immediately in production)

## Project Structure

```
verisure/
├── frontend/          # React + Vite + Tailwind
├── backend/           # FastAPI + SQLAlchemy
├── docker-compose.yml # PostgreSQL setup
├── stitch_verisure_ai_compliance_platform/ # Original designs (reference)
└── README.md
```

## Security Notes

- All uploaded files stored outside web root
- SHA-256 hashing for integrity
- Server-side authorization on all protected endpoints
- Passwords hashed with bcrypt
- JWT tokens for authentication
- CORS restricted to configured origins
- No secrets in source code - use .env
- Audit logging for critical actions
- Path traversal protection

## Development

### Running Tests (Backend)
```bash
cd backend
pytest
```

### Building Frontend
```bash
cd frontend
npm run build
```

### Linting/Type Checking
```bash
cd frontend
npm run lint
npx tsc --noEmit
```

## Important Notes

- **No fake data**: The application starts with empty database. No placeholder/sample records are shown as real data.
- **Honest verification**: If verification capabilities aren't configured/available, the system reports "Unable to Verify" rather than guessing.
- **Human oversight**: Compliance decisions require human review. AI/extraction assists but doesn't make final regulatory decisions.
- **Free & Open Source**: All dependencies are free and open source. No paid APIs required for core functionality.

## Troubleshooting

### Tesseract not found
- Install Tesseract OCR and set `TESSERACT_CMD` in .env to full path
- On Windows, default is usually `C:\Program Files\Tesseract-OCR\tesseract.exe`

### Database connection errors
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- For Docker: `docker-compose up -d db`

### Port conflicts
- Backend: change port in run.py or use `uvicorn app.main:app --port 8001`
- Frontend: Vite will auto-select next available port

## License

This project is built for educational and evaluation purposes.
