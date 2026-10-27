import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatusMessage from "../components/StatusMessage.jsx";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [dashboard, healthInfo] = await Promise.all([api.dashboard(), api.health()]);
        if (!cancelled) {
          setStats(dashboard);
          setHealth(healthInfo);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <h2>Dashboard</h2>
      <p className="lede">Overview of students, subjects, and attendance stored in MySQL.</p>
      <StatusMessage loading={loading} error={error}>
        {stats && (
          <div className="stat-grid">
            <article className="card stat">
              <span>Total students</span>
              <strong>{stats.total_students}</strong>
            </article>
            <article className="card stat">
              <span>Total subjects</span>
              <strong>{stats.total_subjects}</strong>
            </article>
            <article className="card stat">
              <span>Present</span>
              <strong>{stats.present_count}</strong>
            </article>
            <article className="card stat">
              <span>Absent</span>
              <strong>{stats.absent_count}</strong>
            </article>
            <article className="card stat">
              <span>Overall attendance</span>
              <strong>{stats.overall_percentage}%</strong>
            </article>
          </div>
        )}
        {health && (
          <article className="card">
            <h3>Backend / database check</h3>
            <p>
              API: <strong>{health.status}</strong> · MySQL: <strong>{health.database}</strong>
            </p>
            <p>
              FastAPI is using <code>DB_HOST={health.db_host}</code> (Compose service name, not localhost).
            </p>
          </article>
        )}
      </StatusMessage>
    </section>
  );
}
