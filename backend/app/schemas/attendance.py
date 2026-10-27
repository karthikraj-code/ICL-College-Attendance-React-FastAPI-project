from datetime import date
from typing import Literal

from pydantic import BaseModel


class AttendanceCreate(BaseModel):
    student_id: int
    subject_id: int
    attendance_date: date
    status: Literal["Present", "Absent"]


class AttendanceRead(BaseModel):
    id: int
    student_id: int
    subject_id: int
    attendance_date: date
    status: str
    student_name: str | None = None
    subject_name: str | None = None

    model_config = {"from_attributes": True}


class AttendanceSummary(BaseModel):
    student_id: int
    student_name: str
    present_count: int
    absent_count: int
    total_count: int
    attendance_percentage: float


class DashboardStats(BaseModel):
    total_students: int
    total_subjects: int
    total_records: int
    present_count: int
    absent_count: int
    overall_percentage: float
