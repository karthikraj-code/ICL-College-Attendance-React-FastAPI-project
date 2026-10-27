import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatusMessage from "../components/StatusMessage.jsx";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    student_id: "",
    subject_id: "",
    attendance_date: today(),
    status: "Present",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [studentRows, subjectRows, attendanceRows] = await Promise.all([
        api.students(),
        api.subjects(),
        api.attendance(),
      ]);
      setStudents(studentRows);
      setSubjects(subjectRows);
      setRecords(attendanceRows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setNotice("");
    try {
      await api.markAttendance({
        student_id: Number(form.student_id),
        subject_id: Number(form.subject_id),
        attendance_date: form.attendance_date,
        status: form.status,
      });
      setNotice(`Marked ${form.status} for ${form.attendance_date}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>Attendance</h2>
      {notice && <p className="banner success">{notice}</p>}
      <StatusMessage loading={loading} error={error}>
        <article className="card">
          <h3>Mark attendance</h3>
          <form onSubmit={onSubmit} className="form form-grid">
            <label>
              Student
              <select
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                required
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.roll_number})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Subject
              <select
                value={form.subject_id}
                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                required
              >
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input
                type="date"
                value={form.attendance_date}
                onChange={(e) => setForm({ ...form, attendance_date: e.target.value })}
                required
              />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </label>
            <button type="submit">Save attendance</button>
          </form>
        </article>

        <article className="card">
          <h3>Attendance records</h3>
          {records.length === 0 ? (
            <p className="banner muted">No attendance recorded yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row) => (
                    <tr key={row.id}>
                      <td>{row.attendance_date}</td>
                      <td>{row.student_name}</td>
                      <td>{row.subject_name}</td>
                      <td>
                        <span className={row.status === "Present" ? "pill present" : "pill absent"}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </StatusMessage>
    </section>
  );
}
