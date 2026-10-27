import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatusMessage from "../components/StatusMessage.jsx";

export default function Summary() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      setError("");
      try {
        const rows = await api.students();
        setStudents(rows);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.studentSummary(studentId);
      setSummary(data);
    } catch (err) {
      setSummary(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Attendance summary</h2>
      <p className="lede">Select a student to see present count, absent count, and percentage.</p>
      <article className="card">
        <form onSubmit={onSubmit} className="form form-grid">
          <label>
            Student
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.roll_number})
                </option>
              ))}
            </select>
          </label>
          <button type="submit">View summary</button>
        </form>
      </article>

      <StatusMessage
        loading={loading && !summary}
        error={error}
        empty={!loading && !summary && !error && students.length === 0}
        emptyText="No students yet. Add a student first."
      >
        {summary && (
          <div className="stat-grid">
            <article className="card stat">
              <span>Student</span>
              <strong className="small-strong">{summary.student_name}</strong>
            </article>
            <article className="card stat">
              <span>Present</span>
              <strong>{summary.present_count}</strong>
            </article>
            <article className="card stat">
              <span>Absent</span>
              <strong>{summary.absent_count}</strong>
            </article>
            <article className="card stat">
              <span>Total records</span>
              <strong>{summary.total_count}</strong>
            </article>
            <article className="card stat">
              <span>Attendance %</span>
              <strong>{summary.attendance_percentage}%</strong>
            </article>
          </div>
        )}
      </StatusMessage>
    </section>
  );
}
