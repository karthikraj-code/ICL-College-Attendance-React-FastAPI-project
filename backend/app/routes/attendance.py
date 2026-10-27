from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Attendance, Student, Subject
from app.schemas import AttendanceCreate, AttendanceRead, AttendanceSummary, DashboardStats

router = APIRouter()


def _to_read(record: Attendance) -> AttendanceRead:
    return AttendanceRead(
        id=record.id,
        student_id=record.student_id,
        subject_id=record.subject_id,
        attendance_date=record.attendance_date,
        status=record.status,
        student_name=record.student.name if record.student else None,
        subject_name=record.subject.name if record.subject else None,
    )


@router.get("/api/dashboard", response_model=DashboardStats)
def dashboard(db: Session = Depends(get_db)):
    total_students = db.query(Student).count()
    total_subjects = db.query(Subject).count()
    records = db.query(Attendance).all()
    present_count = sum(1 for item in records if item.status == "Present")
    absent_count = sum(1 for item in records if item.status == "Absent")
    total_records = len(records)
    overall_percentage = round((present_count / total_records) * 100, 2) if total_records else 0.0
    return DashboardStats(
        total_students=total_students,
        total_subjects=total_subjects,
        total_records=total_records,
        present_count=present_count,
        absent_count=absent_count,
        overall_percentage=overall_percentage,
    )


@router.get("/api/attendance/student/{student_id}/summary", response_model=AttendanceSummary)
def student_summary(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    present_count = sum(1 for item in records if item.status == "Present")
    absent_count = sum(1 for item in records if item.status == "Absent")
    total_count = len(records)
    percentage = round((present_count / total_count) * 100, 2) if total_count else 0.0
    return AttendanceSummary(
        student_id=student.id,
        student_name=student.name,
        present_count=present_count,
        absent_count=absent_count,
        total_count=total_count,
        attendance_percentage=percentage,
    )


@router.get("/api/attendance", response_model=list[AttendanceRead])
def list_attendance(
    student_id: int | None = Query(default=None),
    subject_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Attendance).options(joinedload(Attendance.student), joinedload(Attendance.subject))
    if student_id is not None:
        query = query.filter(Attendance.student_id == student_id)
    if subject_id is not None:
        query = query.filter(Attendance.subject_id == subject_id)
    records = query.order_by(Attendance.attendance_date.desc(), Attendance.id.desc()).all()
    return [_to_read(record) for record in records]


@router.post("/api/attendance", response_model=AttendanceRead, status_code=status.HTTP_201_CREATED)
def mark_attendance(payload: AttendanceCreate, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")

    subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()
    if subject is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")

    existing = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == payload.student_id,
            Attendance.subject_id == payload.subject_id,
            Attendance.attendance_date == payload.attendance_date,
        )
        .first()
    )
    if existing:
        existing.status = payload.status
        db.commit()
        db.refresh(existing)
        existing = (
            db.query(Attendance)
            .options(joinedload(Attendance.student), joinedload(Attendance.subject))
            .filter(Attendance.id == existing.id)
            .first()
        )
        return _to_read(existing)

    record = Attendance(
        student_id=payload.student_id,
        subject_id=payload.subject_id,
        attendance_date=payload.attendance_date,
        status=payload.status,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    record = (
        db.query(Attendance)
        .options(joinedload(Attendance.student), joinedload(Attendance.subject))
        .filter(Attendance.id == record.id)
        .first()
    )
    return _to_read(record)
