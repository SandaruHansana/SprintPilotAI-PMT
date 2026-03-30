import { useState } from "react";
import { sprintpilot } from "../utils/api";

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; }

  .page { max-width: 860px; margin: 0 auto; margin-left: calc(220px + ((100vw - 220px - 860px) / 2)); padding: 32px 20px; display: flex; flex-direction: column; gap: 20px; }
  @media (max-width: 1140px) { .page { margin-left: 220px; } }
  @media (max-width: 768px) { .page { margin-left: 0; padding: 72px 16px 32px; } }

  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; }
  .card-header { padding: 14px 20px; border-bottom: 1px solid #334155; }
  .card-title { font-size: 15px; font-weight: 700; color: #fff; }
  .card-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }

  .field { display: flex; flex-direction: column; gap: 4px; }
  .field label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .field input, .field select {
    padding: 8px 12px; border: 1px solid #334155; border-radius: 8px;
    font-size: 14px; color: #f1f5f9; background: #0f172a;
    outline: none; font-family: inherit;
  }
  .field input:focus, .field select:focus { border-color: #10b981; }
  .field select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px; cursor: pointer; }

  .row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .btn { padding: 8px 18px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
  .btn-primary { background: #10b981; color: #fff; }
  .btn-primary:hover { background: #059669; }
  .btn-primary:disabled { background: #a7f3d0; cursor: not-allowed; color: #064e3b; }

  .error { font-size: 13px; color: #dc2626; }

  /* Result display */
  .result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .result-item { background: #0f172a; border: 1px solid #1e3a2f; border-radius: 8px; padding: 12px 14px; }
  .result-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #10b981; margin-bottom: 4px; font-weight: 600; }
  .result-value { font-size: 20px; font-weight: 700; color: #f1f5f9; }
  .result-sub { font-size: 11px; color: #64748b; margin-top: 2px; }

  .verdict { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 10px; }
  .verdict.success { background: #064e3b; border: 1px solid #10b981; }
  .verdict.fail    { background: #450a0a; border: 1px solid #dc2626; }
  .verdict-icon { font-size: 24px; }
  .verdict-text { font-size: 14px; font-weight: 600; }
  .verdict.success .verdict-text { color: #6ee7b7; }
  .verdict.fail    .verdict-text { color: #fca5a5; }
  .verdict-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }

  .prob-bar-wrap { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px 14px; }
  .prob-bar-label { display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
  .prob-bar-track { height: 8px; background: #334155; border-radius: 99px; overflow: hidden; }
  .prob-bar-fill  { height: 8px; border-radius: 99px; transition: width 0.5s ease; }
  .prob-bar-fill.high { background: #10b981; }
  .prob-bar-fill.low  { background: #ef4444; }
`;

function Field({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}

const TASK_TYPES = ["Bug", "Chore", "Documentation", "Feature", "Refactor", "Spike"];
const ASSIGNEE_ROLES = ["Designer", "DevOps", "Developer", "PM", "QA"];
const MOSCOW_PRIORITIES = [
  { value: "Must", label: "Must – Critical, non-negotiable" },
  { value: "Should", label: "Should – High priority but not critical" },
  { value: "Could", label: "Could – Nice to have if time permits" },
  { value: "Won't", label: "Won't – Out of scope for now" },
];

export default function FR05() {
  const [form, setForm] = useState({
    task_type: "Bug",
    assignee_role: "Developer",
    experience_years: 0,
    sprint_length_days: 14,
    story_points: 5,
    dependencies_count: 1,
    blockers_count: 0,
    priority_moscow: "Must",
    requirement_changes: 0,
    communication_volume: 40,
  });

  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");

  function setField(k, v) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function run() {
    setLoading(true); setErr(""); setOut(null);
    try {
      console.log("%c── FR05: Input Form Data ──────────────────────────────────", "color: #10b981; font-weight: bold;");
      console.log(JSON.stringify(form, null, 2));

      // Calls POST /api/sprintpilot/predict via the api.js wrapper
      const result = await sprintpilot.predict(form);

      console.log("%c── FR05: Prediction Result ────────────────────────────────", "color: #10b981; font-weight: bold;");
      console.log(JSON.stringify(result, null, 2));

      setOut(result);
    } catch (e) {
      console.error("%c── FR05: Error ────────────────────────────────────────────", "color: #dc2626; font-weight: bold;");
      console.error(e.message);
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: "task_type", label: "Task Type", type: "select", options: TASK_TYPES.map(v => ({ value: v, label: v })) },
    { key: "assignee_role", label: "Assignee Role", type: "select", options: ASSIGNEE_ROLES.map(v => ({ value: v, label: v })) },
    { key: "experience_years", label: "Experience Years", type: "number" },
    { key: "sprint_length_days", label: "Sprint Length (days)", type: "number" },
    { key: "story_points", label: "Story Points", type: "number" },
    { key: "dependencies_count", label: "Dependencies Count", type: "number" },
    { key: "blockers_count", label: "Current Blockers Count", type: "number" },
    { key: "priority_moscow", label: "Priority", type: "select", options: MOSCOW_PRIORITIES },
    { key: "requirement_changes", label: "Possible Requirement Changes", type: "number" },
    { key: "communication_volume", label: "Communication Volume of the team", type: "number" },
  ];

  const probPct = out ? Math.round(out.success_probability * 100) : 0;
  const isSuccess = out?.prediction === 1;

  return (
    <div className="page">
      <style>{css}</style>

      <div className="card">
        <div className="card-header"><p className="card-title">Predict Task Success</p></div>
        <div className="card-body">
          <div className="grid-2">
            {fields.map(f => (
              <Field key={f.key} label={f.label}>
                {f.type === "select" ? (
                  <select value={form[f.key]} onChange={e => setField(f.key, e.target.value)}>
                    {f.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    step={f.step}
                    value={form[f.key]}
                    onChange={e => setField(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>
          <div className="row">
            <button className="btn btn-primary" onClick={run} disabled={loading}>
              {loading ? "Predicting..." : "Predict"}
            </button>
            {err && <span className="error">{err}</span>}
          </div>
        </div>
      </div>

      {out && (
        <div className="card">
          <div className="card-header"><p className="card-title">Prediction Result</p></div>
          <div className="card-body">

            {/* Verdict banner */}
            <div className={`verdict ${isSuccess ? "success" : "fail"}`}>
              <span className="verdict-icon">{isSuccess ? "" : "!"}</span>
              <div>
                <p className="verdict-text">{isSuccess ? "Task likely to succeed" : "Task at risk of failure"}</p>
                <p className="verdict-sub">
                  Confidence threshold: {Math.round((out.threshold || 0.5) * 100)}%
                </p>
              </div>
            </div>

            {/* Probability bar */}
            <div className="prob-bar-wrap">
              <div className="prob-bar-label">
                <span>Success Probability</span>
                <span style={{ color: isSuccess ? "#6ee7b7" : "#fca5a5", fontWeight: 700 }}>{probPct}%</span>
              </div>
              <div className="prob-bar-track">
                <div
                  className={`prob-bar-fill ${isSuccess ? "high" : "low"}`}
                  style={{ width: `${probPct}%` }}
                />
              </div>
            </div>

            {/* Key metrics */}
            <div className="result-grid">
              <div className="result-item">
                <p className="result-label">Raw Probability</p>
                <p className="result-value">{out.success_probability?.toFixed(3)}</p>
              </div>
              <div className="result-item">
                <p className="result-label">Threshold</p>
                <p className="result-value">{out.threshold}</p>
                <p className="result-sub">Minimum to predict success</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}