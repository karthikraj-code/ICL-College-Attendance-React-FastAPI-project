async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.detail || data.message || `Request failed (${response.status})`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return data;
}

export const api = {
  health: () => request("/api/health"),
  dashboard: () => request("/api/dashboard"),
  students: () => request("/api/students"),
  createStudent: (body) => request("/api/students", { method: "POST", body: JSON.stringify(body) }),
  deleteStudent: (id) => request(`/api/students/${id}`, { method: "DELETE" }),
  subjects: () => request("/api/subjects"),
  createSubject: (body) => request("/api/subjects", { method: "POST", body: JSON.stringify(body) }),
  attendance: (params = {}) => {
    const query = new URLSearchParams();
    if (params.student_id) query.set("student_id", params.student_id);
    if (params.subject_id) query.set("subject_id", params.subject_id);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/api/attendance${suffix}`);
  },
  markAttendance: (body) => request("/api/attendance", { method: "POST", body: JSON.stringify(body) }),
  studentSummary: (id) => request(`/api/attendance/student/${id}/summary`),
};
