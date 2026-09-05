from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api import auth, patients, reports, dashboard

app = FastAPI(
    title="MedLens API",
    description="AI-Powered Clinical Information Intelligence",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(patients.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


@app.on_event("startup")
def on_startup():
    init_db()
    try:
        from seed import seed_database
        seed_database()
    except Exception as e:
        print(f"Startup seeding warning: {e}")


@app.get("/health")
def health():
    return {"status": "ok", "service": "MedLens API"}

