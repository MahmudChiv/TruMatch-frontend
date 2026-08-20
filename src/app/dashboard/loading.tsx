export default function DashboardLoading() {
  return (
    <div className="dash-loading-root">
      <div className="dash-loading-spinner" />
      <p className="dash-loading-text">Loading dashboard…</p>

      <style>{`
        .dash-loading-root {
          min-height: 100vh;
          background: var(--bg-primary, #0a0a0a);
          color: var(--text-primary, #f2f2f2);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          font-family: var(--font-montserrat), Montserrat, sans-serif;
        }
        .dash-loading-spinner {
          width: 28px;
          height: 28px;
          border: 2.5px solid rgba(255, 255, 255, 0.1);
          border-top-color: #34d399;
          border-radius: 50%;
          animation: dash-spin 0.8s linear infinite;
        }
        @keyframes dash-spin {
          to { transform: rotate(360deg); }
        }
        .dash-loading-text {
          font-size: 0.95rem;
          color: var(--text-secondary, #a0a0a0);
        }
      `}</style>
    </div>
  );
}
