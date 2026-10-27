import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatusMessage from "../components/StatusMessage.jsx";

const emptyStudent = { name: "", roll_number: "", email: "" };
const emptySubject = { name: "", code: "" };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [studentRows, subjectRows] = await Promise.all([api.students(), api.subjects()]);
      setStudents(studentRows);
      setSubjects(subjectRows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onAddStudent(event) {
    event.preventDefault();
    setNotice("");
    try {
      await api.createStudent(studentForm);
      setStudentForm(emptyStudent);
      setNotice("Student added.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDeleteStudent(id) {
    setNotice("");
    try {
      await api.deleteStudent(id);
      setNotice("Student deleted.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onAddSubject(event) {
    event.preventDefault();
    setNotice("");
    try {
      await api.createSubject(subjectForm);
      setSubjectForm(emptySubject);
      setNotice("Subject added.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>Student & subject management</h2>
      {notice && <p className="banner success">{notice}</p>}
      <StatusMessage loading={loading} error={error}>
        <div className="split">
          <article className="card">
            <h3>Add student</h3>
            <form onSubmit={onAddStudent} className="form">
              <label>
                Name
                <input
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Roll number
                <input
                  value={studentForm.roll_number}
                  onChange={(e) => setStudentForm({ ...studentForm, roll_number: e.target.value })}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  required
                />
              </label>
              <button type="submit">Add student</button>
            </form>
            <h3>Students</h3>
            {students.length === 0 ? (
              <p className="banner muted">No students yet. Add the first student above.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Roll</th>
                      <th>Email</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.roll_number}</td>
                        <td>{student.email}</td>
                        <td>
                          <button className="danger" onClick={() => onDeleteStudent(student.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="card">
            <h3>Add subject</h3>
            <form onSubmit={onAddSubject} className="form">
              <label>
                Subject name
                <input
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Code
                <input
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                  required
                />
              </label>
              <button type="submit">Add subject</button>
            </form>
            <h3>Subjects</h3>
            {subjects.length === 0 ? (
              <p className="banner muted">No subjects yet. Add one so attendance can be marked.</p>
            ) : (
              <ul className="plain-list">
                {subjects.map((subject) => (
                  <li key={subject.id}>
                    <strong>{subject.name}</strong>
                    <span>{subject.code}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </StatusMessage>
    </section>
  );
}
