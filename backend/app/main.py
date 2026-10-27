from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, wait_for_db
from app.models import Attendance, Student, Subject  # noqa: F401 — register tables
from app.routes import attendance_router, health_router, students_router, subjects_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="College Attendance Management System",
    description="React + FastAPI + MySQL (Docker). FastAPI connects to DB_HOST=mysql inside Compose.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(students_router)
app.include_router(subjects_router)
app.include_router(attendance_router)
