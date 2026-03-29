import React, { useState } from "react";
import { sprintpilot } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; }

  .page { max-width: 860px; margin: 0 auto; margin-left: calc(220px + ((100vw - 220px - 860px) / 2)); padding: 32px 20px; display: flex; flex-direction: column; gap: 20px; }
  @media (max-width: 1140px) { .page { margin-left: 220px; } }
  @media (max-width: 768px) { .page { margin-left: 0; padding: 72px 16px 32px; } }
  @media (max-width: 600px) { .pipeline { flex-direction: column; gap: 6px; } .pipeline-arrow { transform: rotate(90deg); align-self: center; } }

  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; }
  .card-header { padding: 14px 20px; border-bottom: 1px solid #334155; }
  .card-title { font-size: 15px; font-weight: 700; color: #fff; }
  .card-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

  .field { display: flex; flex-direction: column; gap: 4px; }
  .field label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .field input, .field textarea, .field select {
    padding: 8px 12px; border: 1px solid #334155; border-radius: 8px;
    font-size: 14px; color: #f1f5f9; background: #0f172a;
    outline: none; font-family: inherit;
  }
  .field input:focus, .field textarea:focus { border-color: #10b981; }
  .field textarea { resize: vertical; }
  .field-hint { font-size: 11px; color: #475569; margin-top: 2px; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  @media (max-width: 600px) { .grid-2, .grid-3 { grid-template-columns: 1fr; } }

  .btn { padding: 8px 18px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
  .btn-primary { background: #10b981; color: #fff; }
  .btn-primary:hover { background: #059669; }
  .btn-primary:disabled { background: #a7f3d0; cursor: not-allowed; color: #064e3b; }
  .btn-outline { background: #1e293b; color: #94a3b8; border: 1px solid #334155; }
  .btn-outline:hover { background: #334155; }

  .row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .error { font-size: 13px; color: #dc2626; }
  .status { font-size: 13px; color: #64748b; }

  .sprint-block { border: 1px solid #334155; border-radius: 10px; background: #0f172a; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .sprint-block-header { display: flex; align-items: center; justify-content: space-between; }
  .sprint-name { font-size: 14px; font-weight: 700; color: #fff; }
  .sprint-dates { font-size: 12px; color: #94a3b8; margin-left: 8px; font-weight: 400; }

  .task-card { display: flex; align-items: flex-start; gap: 12px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; }
  .task-info { flex: 1; min-width: 0; }
  .task-title-text { font-size: 14px; font-weight: 500; color: #f1f5f9; }
  .task-notes-text { font-size: 12px; color: #94a3b8; margin-top: 2px; }
  .task-deps-text { font-size: 12px; color: #64748b; margin-top: 2px; }
  .badge { flex-shrink: 0; font-size: 11px; font-weight: 600; border-radius: 6px; padding: 3px 8px; background: #1e3a5f; color: #93c5fd; }

  .edit-input { width: 100%; padding: 6px 10px; border: 1px solid #334155; border-radius: 6px; font-size: 13px; color: #f1f5f9; background: #0f172a; outline: none; }
  .edit-input:focus { border-color: #10b981; }
  .edit-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .edit-label { font-size: 12px; color: #94a3b8; white-space: nowrap; }
  .edit-num { width: 60px; padding: 4px 8px; border: 1px solid #334155; border-radius: 6px; font-size: 12px; background: #0f172a; color: #f1f5f9; outline: none; }
  .edit-notes { flex: 1; padding: 4px 8px; border: 1px solid #334155; border-radius: 6px; font-size: 12px; background: #0f172a; color: #f1f5f9; outline: none; }
  .link-btn { background: none; border: none; cursor: pointer; font-size: 12px; padding: 0; }
  .link-add { color: #10b981; }
  .link-add:hover { text-decoration: underline; }
  .link-del { color: #ef4444; }
  .link-del:hover { text-decoration: underline; }

  .review-actions { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
  .review-desc { font-size: 13px; color: #94a3b8; }

  .assumptions-banner { display: flex; align-items: flex-start; gap: 10px; background: #1e3a5f; border: 1px solid #3b82f6; border-radius: 10px; padding: 12px 16px; }
  .assumptions-banner-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
  .assumptions-banner-text { font-size: 13px; color: #93c5fd; line-height: 1.5; }
  .assumptions-banner-text strong { color: #bfdbfe; font-weight: 600; }

  .pipeline { display: flex; align-items: center; gap: 0; margin-bottom: 4px; }
  .pipeline-step { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; flex: 1; justify-content: center; transition: all 0.2s; }
  .pipeline-step.pending { background: #1e293b; color: #475569; border: 1px solid #334155; }
  .pipeline-step.running { background: #1e3a5f; color: #93c5fd; border: 1px solid #3b82f6; animation: pulse 1.2s ease-in-out infinite; }
  .pipeline-step.done { background: #064e3b; color: #6ee7b7; border: 1px solid #10b981; }
  .pipeline-step.error { background: #450a0a; color: #fca5a5; border: 1px solid #dc2626; }
  .pipeline-arrow { color: #334155; font-size: 16px; padding: 0 4px; flex-shrink: 0; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
  .step-icon { font-size: 14px; }

  .auth-notice { background: #1e3a5f; border: 1px solid #3b82f6; border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #93c5fd; }
  .auth-notice a { color: #60a5fa; cursor: pointer; text-decoration: underline; }
`;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

const STEPS = [
  { key: "fr01", label: "Parse Goal" },
  { key: "fr02", label: "Decompose Tasks" },
  { key: "fr03", label: "Generate Plan" },
];

export default function SprintPlanner() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [goalText, setGoalText] = useState(
    "Build a web application for sprint planning within 8 weeks under $500 for a small team."
  );
  const [velocity, setVelocity] = useState("14");
  const [velocityErr, setVelocityErr] = useState("");

  const [stepStatus, setStepStatus] = useState({ fr01: "pending", fr02: "pending", fr03: "pending" });
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalErr, setGlobalErr] = useState("");

  const [fr03Out, setFr03Out] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editablePlan, setEditablePlan] = useState(null);
  const [approving, setApproving] = useState(false);
  const [approveErr, setApproveErr] = useState("");

  function animateSteps(timers) {
    timers.push(setTimeout(() => setStepStatus(p => ({ ...p, fr01: "running" })), 0));
    timers.push(setTimeout(() => setStepStatus(p => ({ ...p, fr01: "done", fr02: "running" })), 2000));
    timers.push(setTimeout(() => setStepStatus(p => ({ ...p, fr02: "done", fr03: "running" })), 5000));
  }

  async function runAll() {
    const v = Number(velocity);
    if (!String(velocity).trim() || !Number.isFinite(v) || v < 1 || v > 999 || Math.round(v) !== v) {
      setVelocityErr("Please enter a whole number between 1 and 999.");
      return;
    }
    setVelocityErr("");
    setGlobalLoading(true);
    setGlobalErr("");
    setFr03Out(null);
    setEditablePlan(null);
    setIsEditing(false);
    setApproveErr("");
    setStepStatus({ fr01: "pending", fr02: "pending", fr03: "pending" });

    const timers = [];
    animateSteps(timers);

    try {
      const result = await sprintpilot.pipeline(goalText, { velocity: v });
      timers.forEach(clearTimeout);
      setStepStatus({ fr01: "done", fr02: "done", fr03: "done" });
      const plan = result.fr03;
      setFr03Out(plan);
      setEditablePlan(JSON.parse(JSON.stringify(plan)));
    } catch (e) {
      timers.forEach(clearTimeout);
      setStepStatus(prev => {
        const updated = { ...prev };
        for (const key of Object.keys(updated)) {
          if (updated[key] === "running") updated[key] = "error";
        }
        return updated;
      });
      setGlobalErr(e.message);
    } finally {
      setGlobalLoading(false);
    }
  }

  function handleEditTask(si, ti, field, value) {
    setEditablePlan(prev => {
      const u = JSON.parse(JSON.stringify(prev));
      u.sprints[si].tasks[ti][field] = value;
      return u;
    });
  }

  function handleDeleteTask(si, ti) {
    setEditablePlan(prev => {
      const u = JSON.parse(JSON.stringify(prev));
      u.sprints[si].tasks.splice(ti, 1);
      return u;
    });
  }

  function handleAddTask(si) {
    setEditablePlan(prev => {
      const u = JSON.parse(JSON.stringify(prev));
      u.sprints[si].tasks.push({ title: "New Task", estimate_days: 1, depends_on: [], notes: "" });
      return u;
    });
  }

  async function handleApprovePlan() {
    const planToSave = editablePlan || fr03Out;
    if (!planToSave) return;

    // If not logged in — still save to localStorage as fallback
    if (!user) {
      const approved = { ...planToSave, approvedAt: new Date().toISOString(), original_goal: goalText };
      localStorage.setItem("approvedSprintPlan", JSON.stringify(approved));
      localStorage.removeItem("sprintTaskCompletions");
      navigate("/sprint-plan");
      return;
    }

    setApproving(true);
    setApproveErr("");
    try {
      const title = goalText.slice(0, 80) || "Sprint Plan";
      const res = await fetch(`${API_BASE}/api/sprintplan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          original_goal: goalText,
          plan_json: { ...planToSave, original_goal: goalText },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setApproveErr(data.message || "Failed to save plan."); return; }

      // Navigate to sprint plan page with the new plan's ID
      navigate(`/sprint-plan/${data.id}`);
    } catch {
      setApproveErr("Could not connect to server. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  const displayPlan = editablePlan || fr03Out;

  const stepIcon = (status) => {
    if (status === "done") return "✅";
    if (status === "running") return "⏳";
    if (status === "error") return "❌";
    return "○";
  };

  return (
    <div className="page">
      <style>{css}</style>

      <div className="card">
        <div className="card-header"><p className="card-title">Sprint Planner</p></div>
        <div className="card-body">
          {!user && (
            <div className="auth-notice">
              You're not signed in. Your plan will be saved locally only.{" "}
              <a onClick={() => navigate("/signin")}>Sign in</a> to save plans to your account.
            </div>
          )}

          <Field label="Project Goal">
            <textarea rows={4} value={goalText} onChange={e => setGoalText(e.target.value)} disabled={globalLoading} />
          </Field>

          <Field
            label="Team Velocity"
            hint="Person-days your team can complete per sprint (e.g. 10 = small team · 14 = standard · 20 = large team)"
          >
            <input
              type="number" min="1" max="999" step="1" placeholder="14"
              value={velocity}
              onChange={e => { setVelocity(e.target.value); setVelocityErr(""); }}
              disabled={globalLoading}
              style={{ maxWidth: 120 }}
            />
            {velocityErr && <span className="error" style={{ marginTop: 4 }}>{velocityErr}</span>}
          </Field>

          <div className="pipeline">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.key}>
                <div className={`pipeline-step ${stepStatus[step.key]}`}>
                  <span className="step-icon">{stepIcon(stepStatus[step.key])}</span>
                  {step.label}
                </div>
                {i < STEPS.length - 1 && <span className="pipeline-arrow">→</span>}
              </React.Fragment>
            ))}
          </div>

          <div className="row">
            <button className="btn btn-primary" onClick={runAll} disabled={globalLoading}>
              {globalLoading ? "Running..." : " Generate Sprint Plan"}
            </button>
            {globalErr && <span className="error">{globalErr}</span>}
          </div>
        </div>
      </div>

      {displayPlan && (
        <div className="card">
          <div className="card-header"><p className="card-title">Review Sprint Plan</p></div>
          <div className="card-body">
            <div className="review-actions">
              <p className="review-desc">Review and edit tasks inline before approving.</p>
              <div className="row">
                <button className="btn btn-outline" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? "Done Editing" : "✏️ Edit Plan"}
                </button>
                <button className="btn btn-primary" onClick={handleApprovePlan} disabled={approving}>
                  {approving ? "Saving..." : " Approve Plan"}
                </button>
              </div>
            </div>

            {approveErr && <p className="error">{approveErr}</p>}

            {displayPlan.assumptions?.notes && (
              <div className="assumptions-banner">
                <span className="assumptions-banner-icon">ℹ️</span>
                <p className="assumptions-banner-text">
                  <strong>Planning note: </strong>{displayPlan.assumptions.notes}
                </p>
              </div>
            )}

            {displayPlan.sprints?.map((sprint, si) => (
              <div key={si} className="sprint-block">
                <div className="sprint-block-header">
                  <p className="sprint-name">
                    {sprint.sprint_id || `Sprint ${si + 1}`}
                    {sprint.start_date && (
                      <span className="sprint-dates">{sprint.start_date} → {sprint.end_date}</span>
                    )}
                  </p>
                  {isEditing && (
                    <button className="link-btn link-add" onClick={() => handleAddTask(si)}>+ Add Task</button>
                  )}
                </div>

                {sprint.tasks?.map((task, ti) => (
                  <div key={ti} className="task-card">
                    {isEditing ? (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        <input className="edit-input" value={task.title} onChange={e => handleEditTask(si, ti, "title", e.target.value)} />
                        <div className="edit-row">
                          <span className="edit-label">Est. days:</span>
                          <input type="number" className="edit-num" value={task.estimate_days} onChange={e => handleEditTask(si, ti, "estimate_days", Number(e.target.value))} />
                          <input className="edit-notes" placeholder="Notes..." value={task.notes || ""} onChange={e => handleEditTask(si, ti, "notes", e.target.value)} />
                          <button className="link-btn link-del" onClick={() => handleDeleteTask(si, ti)}>🗑 Remove</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="task-info">
                          <p className="task-title-text">{task.title}</p>
                          {task.notes && <p className="task-notes-text">{task.notes}</p>}
                          {task.depends_on?.length > 0 && (
                            <p className="task-deps-text">Deps: {task.depends_on.join(", ")}</p>
                          )}
                        </div>
                        <span className="badge">{task.estimate_days}d</span>
                      </>
                    )}
                  </div>
                ))}

                {sprint.sprint_goal && !isEditing && (
                  <p style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>{sprint.sprint_goal}</p>
                )}
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" onClick={handleApprovePlan} disabled={approving}>
                {approving ? "Saving..." : " Approve & View Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}