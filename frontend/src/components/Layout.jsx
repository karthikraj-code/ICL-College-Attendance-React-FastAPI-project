import { NavLink } from "react-router-dom";

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">React + FastAPI + MySQL (Docker)</p>
          <h1>College Attendance Management System</h1>
        </div>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/students">Students</NavLink>
          <NavLink to="/attendance">Attendance</NavLink>
          <NavLink to="/summary">Summary</NavLink>
        </nav>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
