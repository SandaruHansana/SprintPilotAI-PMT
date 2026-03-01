import { useState } from "react";
import { postJSON } from "../utils/api";

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; }

  .page { max-width: 860px; margin: 0 auto; padding: 32px 20px; display: flex; flex-direction: column; gap: 20px; }

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
  .code-out { overflow: auto; border-radius: 8px; background: #0f172a; padding: 14px; font-size: 12px; color: #86efac; font-family: monospace; line-height: 1.6; }
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
    team_size: 1,
    sprint_length_days: 14,
    story_points: 5,
    estimated_hours: 16,
    dependencies_count: 1,
    blockers_count: 0,
    priority_moscow: "Must",
    requirement_changes: 0,
    communication_volume: 40,
    sentiment_score: 0.2,
    ai_suggestion_used: 1,
    ai_acceptance_rate: 0.7,
  });

  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");

  function setField(k, v) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function run() {
    setLoading(true); setErr(""); setOut(null);
    try { setOut(await postJSON("/fr05/predict", form)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  const fields = [
    { key: "task_type", label: "Task Type", type: "select", options: TASK_TYPES.map(v => ({ value: v, label: v })) },
    { key: "assignee_role", label: "Assignee Role", type: "select", options: ASSIGNEE_ROLES.map(v => ({ value: v, label: v })) },
    { key: "experience_years", label: "Experience Years", type: "number" },
    { key: "team_size", label: "Team Size", type: "number" },
    { key: "sprint_length_days", label: "Sprint Length (days)", type: "number" },
    { key: "story_points", label: "Story Points", type: "number" },
    { key: "estimated_hours", label: "Estimated Hours", type: "number" },
    { key: "dependencies_count", label: "Dependencies Count", type: "number" },
    { key: "blockers_count", label: "Blockers Count", type: "number" },
    { key: "priority_moscow", label: "Priority MoSCoW", type: "select", options: MOSCOW_PRIORITIES },
    { key: "requirement_changes", label: "Requirement Changes", type: "number" },
    { key: "communication_volume", label: "Communication Volume", type: "number" },
    { key: "sentiment_score", label: "Sentiment Score (-1..1)", type: "number", step: "0.1" },
    { key: "ai_acceptance_rate", label: "AI Acceptance Rate (0..1)", type: "number", step: "0.1" },
  ];

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
                  <select
                    value={form[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                  >
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
          <div className="card-header"><p className="card-title">FR05 Output</p></div>
          <div className="card-body">
            <pre className="code-out">{JSON.stringify(out, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}