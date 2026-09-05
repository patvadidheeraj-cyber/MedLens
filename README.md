# MedLens — AI-Powered Clinical Information Intelligence

MedLens is a full-stack medical information organization system. It helps healthcare workers and patients organize medical reports, extract structured lab results using AI, detect inconsistencies across reports, and generate patient-friendly summaries.

> ⚠️ **MedLens is NOT a diagnostic tool.** It does not provide diagnoses, treatment recommendations, or medical advice. All summaries are informational only. Always consult a qualified healthcare professional.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide |
| Backend | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy |
| Database | SQLite (dev) / PostgreSQL (production) |
| AI | Modular — Mock (default) or OpenAI-compatible |
| Documents | pdfplumber, pytesseract (OCR) |
| Auth | JWT + bcrypt |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ (for frontend)

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy ..\\.env.example .env
# Edit .env if needed

# Start server (auto-creates SQLite database)
uvicorn app.main:app --reload --port 8000
```

Backend API: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend: http://localhost:5173

---

## Configuration (.env)

| Variable | Default | Description |
|---|---|---|
| `AI_PROVIDER` | `mock` | `mock` (no API key) or `openai` |
| `OPENAI_API_KEY` | — | Required only when `AI_PROVIDER=openai` |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model to use for extraction |
| `DATABASE_URL` | `sqlite:///./medlens.db` | SQLite or PostgreSQL URL |
| `SECRET_KEY` | dev key | JWT signing key — **change in production** |
| `TESSERACT_CMD` | `tesseract` | Path to tesseract binary for OCR |

---

## AI Providers

### Mock (default — no API key needed)
Performs regex-based extraction for demo purposes. Works immediately.

### OpenAI
Set `AI_PROVIDER=openai` and `OPENAI_API_KEY=sk-...` in `.env`.

### OpenAI-compatible endpoints
Set `AI_PROVIDER=openai_compatible` and `OPENAI_BASE_URL` to point at your endpoint.

---

## Report Processing Pipeline

```
Upload → Text extraction (pdfplumber)
       → OCR if text is sparse (pytesseract)
       → AI structured extraction
       → Schema validation
       → Reference range parsing (application-side, NOT AI)
       → Status calculation: LOW / NORMAL / HIGH
       → Conflict detection (cross-report comparison)
       → AI patient-friendly summary
       → Database storage
```

**Important:** LOW/NORMAL/HIGH status is **always** calculated by the application using simple numeric comparison — the AI never makes this judgment.

---

## Project Structure

```
medlens/
├── backend/
│   └── app/
│       ├── api/          # Route handlers
│       ├── models/       # SQLAlchemy ORM models
│       ├── schemas/      # Pydantic schemas
│       ├── services/     # Business logic
│       ├── ai/           # AI provider system
│       ├── document_processing/  # PDF/OCR pipeline
│       ├── security/     # JWT, password hashing
│       ├── config.py
│       ├── database.py
│       └── main.py
│
├── frontend/
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── hooks/        # Auth, debounce hooks
│       ├── layouts/      # App shell
│       ├── pages/        # All page components
│       ├── services/     # API client
│       ├── types/        # TypeScript types
│       └── utils/        # Helpers
│
├── uploads/             # Uploaded documents
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## Docker

```bash
docker-compose up
```

This starts the backend (port 8000) with PostgreSQL.
Frontend still runs with `npm run dev` from the `frontend/` directory.

---

## Safety & Privacy

- All patient data is stored in your local/self-hosted database
- API keys are never hard-coded — always use environment variables
- JWT authentication protects all patient data routes
- MedLens does not transmit data to external services unless you configure an AI provider
