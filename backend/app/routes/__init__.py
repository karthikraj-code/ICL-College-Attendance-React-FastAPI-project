from app.routes.attendance import router as attendance_router
from app.routes.health import router as health_router
from app.routes.students import router as students_router
from app.routes.subjects import router as subjects_router

__all__ = ["attendance_router", "health_router", "students_router", "subjects_router"]
