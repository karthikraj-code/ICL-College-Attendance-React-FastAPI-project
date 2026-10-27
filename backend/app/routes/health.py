from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.database import engine

router = APIRouter()


@router.get("/api/health")
def health():
    database_status = "disconnected"
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database_status = "connected"
    except Exception:
        database_status = "disconnected"

    return {
        "status": "ok" if database_status == "connected" else "degraded",
        "service": "college-attendance-backend",
        "database": database_status,
        "db_host": settings.DB_HOST,
        "db_name": settings.DB_NAME,
    }
