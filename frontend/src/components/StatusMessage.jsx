export default function StatusMessage({ loading, error, empty, emptyText, children }) {
  if (loading) {
    return <p className="banner info">Loading...</p>;
  }
  if (error) {
    return <p className="banner error">{error}</p>;
  }
  if (empty) {
    return <p className="banner muted">{emptyText || "No records yet."}</p>;
  }
  return children;
}
