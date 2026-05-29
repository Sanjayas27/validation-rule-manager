export default function LoginPage({ onLogin }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <svg viewBox="0 0 100 100" width="56" height="56">
            <circle cx="50" cy="50" r="50" fill="#00A1E0" />
            <path
              d="M30 60 Q35 40 50 38 Q42 30 48 22 Q58 28 56 38 Q70 36 74 48 Q80 62 68 66 Q66 74 58 72 Q52 78 44 72 Q34 74 28 66 Q22 58 30 60Z"
              fill="white"
            />
          </svg>
        </div>
        <h1>Validation Rule Manager</h1>
        <p className="login-subtitle">
          Connect your Salesforce org to manage Account validation rules
        </p>
        <button className="login-btn" onClick={onLogin}>
          <svg width="20" height="20" viewBox="0 0 100 100" style={{ marginRight: 10 }}>
            <circle cx="50" cy="50" r="50" fill="white" />
            <path
              d="M30 60 Q35 40 50 38 Q42 30 48 22 Q58 28 56 38 Q70 36 74 48 Q80 62 68 66 Q66 74 58 72 Q52 78 44 72 Q34 74 28 66 Q22 58 30 60Z"
              fill="#00A1E0"
            />
          </svg>
          Login with Salesforce
        </button>
        <p className="login-note">
          Uses OAuth 2.0 — your credentials are never stored here
        </p>
      </div>
      <div className="login-bg">
        <div className="bg-circle c1" />
        <div className="bg-circle c2" />
        <div className="bg-circle c3" />
      </div>
    </div>
  );
}
