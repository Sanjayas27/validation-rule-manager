import { useState, useEffect } from "react";
import axios from "axios";

export default function Dashboard({ user, onLogout, api }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [toast, setToast] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${api}/api/validation-rules`, {
        withCredentials: true,
      });
      setRules(res.data.rules);
      setPendingChanges({});
      setFetched(true);
      showToast(`Loaded ${res.data.rules.length} validation rules`);
    } catch (err) {
      showToast("Failed to fetch validation rules", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = (id, currentActive) => {
    const newActive = !currentActive;
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: newActive } : r))
    );
    setPendingChanges((prev) => ({ ...prev, [id]: newActive }));
  };

  const toggleAll = (active) => {
    setRules((prev) => prev.map((r) => ({ ...r, active })));
    const changes = {};
    rules.forEach((r) => (changes[r.id] = active));
    setPendingChanges(changes);
  };

  const deploy = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      showToast("No changes to deploy", "info");
      return;
    }

    setDeploying(true);
    try {
      const ids = Object.keys(pendingChanges);

      // Group by active value and send batch requests
      const activeIds = ids.filter((id) => pendingChanges[id] === true);
      const inactiveIds = ids.filter((id) => pendingChanges[id] === false);

      if (activeIds.length > 0) {
        await axios.patch(
          `${api}/api/validation-rules`,
          { active: true, ids: activeIds },
          { withCredentials: true }
        );
      }

      if (inactiveIds.length > 0) {
        await axios.patch(
          `${api}/api/validation-rules`,
          { active: false, ids: inactiveIds },
          { withCredentials: true }
        );
      }

      setPendingChanges({});
      showToast(`Deployed ${ids.length} change(s) to Salesforce ✅`);
    } catch (err) {
      showToast("Deployment failed. Please try again.", "error");
    } finally {
      setDeploying(false);
    }
  };

  const pendingCount = Object.keys(pendingChanges).length;
  const activeCount = rules.filter((r) => r.active).length;
  const inactiveCount = rules.filter((r) => !r.active).length;

  return (
    <div className="dashboard">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}

      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-left">
          <svg viewBox="0 0 100 100" width="36" height="36">
            <circle cx="50" cy="50" r="50" fill="#00A1E0" />
            <path
              d="M30 60 Q35 40 50 38 Q42 30 48 22 Q58 28 56 38 Q70 36 74 48 Q80 62 68 66 Q66 74 58 72 Q52 78 44 72 Q34 74 28 66 Q22 58 30 60Z"
              fill="white"
            />
          </svg>
          <div>
            <h1>Validation Rule Manager</h1>
            <p className="org-label">Account Object · Salesforce</p>
          </div>
        </div>
        <div className="dash-header-right">
          <span className="user-chip">
            👤 {user?.name || user?.username || "User"}
          </span>
          <button className="btn-outline" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="dash-main">
        {/* Stats */}
        {fetched && (
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-num">{rules.length}</span>
              <span className="stat-label">Total Rules</span>
            </div>
            <div className="stat-card active">
              <span className="stat-num">{activeCount}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-card inactive">
              <span className="stat-num">{inactiveCount}</span>
              <span className="stat-label">Inactive</span>
            </div>
            {pendingCount > 0 && (
              <div className="stat-card pending">
                <span className="stat-num">{pendingCount}</span>
                <span className="stat-label">Pending Changes</span>
              </div>
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className="action-bar">
          <button
            className="btn-primary"
            onClick={fetchRules}
            disabled={loading}
          >
            {loading ? (
              <><span className="spin" /> Fetching...</>
            ) : (
              <> 🔄 {fetched ? "Refresh Rules" : "Get Validation Rules"}</>
            )}
          </button>

          {fetched && rules.length > 0 && (
            <>
              <button
                className="btn-success"
                onClick={() => toggleAll(true)}
              >
                ✅ Enable All
              </button>
              <button
                className="btn-danger"
                onClick={() => toggleAll(false)}
              >
                ❌ Disable All
              </button>
              <button
                className={`btn-deploy ${pendingCount > 0 ? "has-changes" : ""}`}
                onClick={deploy}
                disabled={deploying || pendingCount === 0}
              >
                {deploying ? (
                  <><span className="spin" /> Deploying...</>
                ) : (
                  <>🚀 Deploy to Salesforce {pendingCount > 0 ? `(${pendingCount})` : ""}</>
                )}
              </button>
            </>
          )}
        </div>

        {/* Rules List */}
        {!fetched && !loading && (
          <div className="empty-state">
            <div className="empty-icon">☁️</div>
            <h2>Connect to your Salesforce org</h2>
            <p>Click "Get Validation Rules" to load all Account validation rules</p>
          </div>
        )}

        {fetched && rules.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h2>No validation rules found</h2>
            <p>Create some validation rules on the Account object in Salesforce</p>
          </div>
        )}

        {rules.length > 0 && (
          <div className="rules-grid">
            {rules.map((rule) => {
              const hasPending = pendingChanges[rule.id] !== undefined;
              return (
                <div
                  key={rule.id}
                  className={`rule-card ${rule.active ? "is-active" : "is-inactive"} ${hasPending ? "is-pending" : ""}`}
                >
                  <div className="rule-top">
                    <div className="rule-info">
                      <h3 className="rule-name">{rule.name}</h3>
                      {rule.description && (
                        <p className="rule-desc">{rule.description}</p>
                      )}
                      <code className="rule-id">ID: {rule.id}</code>
                    </div>
                    <div className="rule-toggle-wrap">
                      <span className={`status-badge ${rule.active ? "badge-active" : "badge-inactive"}`}>
                        {rule.active ? "Active" : "Inactive"}
                      </span>
                      {hasPending && (
                        <span className="pending-dot" title="Pending deploy" />
                      )}
                    </div>
                  </div>
                  <div className="rule-actions">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={rule.active}
                        onChange={() => toggleRule(rule.id, rule.active)}
                      />
                      <span className="toggle-slider" />
                    </label>
                    <span className="toggle-label">
                      {rule.active ? "Click to deactivate" : "Click to activate"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
