import { useState } from "react";
import { postJSON } from "../utils/api";
import { useNavigate } from "react-router-dom";

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; }

  .page { max-width: 860px; margin: 0 auto; padding: 32px 20px; display: flex; flex-direction: column; gap: 20px; }

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

  .code-out { overflow: auto; border-radius: 8px; background: #0f172a; padding: 14px; font-size: 12px; color: #86efac; font-family: monospace; line-height: 1.6; }

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

  .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8; font-weight: 500; cursor: pointer; }
  .checkbox-label input { width: 16px; height: 16px; cursor: pointer; accent-color: #10b981; }

  .sprint-notes { font-size: 12px; color: #64748b; font-style: italic; }
`;

function Field({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}

export default function SprintPlanner() {
  const navigate = useNavigate();

  const [goalText, setGoalText] = useState(
    "Build a web application for sprint planning within 8 weeks under $500 for a small team."
  );
  const [fr01Out, setFr01Out] = useState(null);
  const [fr01Loading, setFr01Loading] = useState(false);
  const [fr01Err, setFr01Err] = useState("");

  const [fr02Out, setFr02Out] = useState(null);
  const [fr02Loading, setFr02Loading] = useState(false);
  const [fr02Err, setFr02Err] = useState("");

  const [sprintLength, setSprintLength] = useState(14);
  const [velocity, setVelocity] = useState(14);
  const [enrich, setEnrich] = useState(true);
  const [fr03Out, setFr03Out] = useState(null);
  const [fr03Loading, setFr03Loading] = useState(false);
  const [fr03Err, setFr03Err] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editablePlan, setEditablePlan] = useState(null);

  async function runFR01() {
    setFr01Loading(true); setFr01Err(""); setFr01Out(null);
    setFr02Out(null); setFr03Out(null);
    setEditablePlan(null); setIsEditing(false);
    try { setFr01Out(await postJSON("/fr01/parse", { goal_text: goalText })); }
    catch (e) { setFr01Err(e.message); }
    finally { setFr01Loading(false); }
  }

  async function runFR02() {
    setFr02Loading(true); setFr02Err(""); setFr02Out(null);
    setFr03Out(null); setEditablePlan(null); setIsEditing(false);
    try { setFr02Out(await postJSON("/fr02/decompose", { data: fr01Out })); }
    catch (e) { setFr02Err(e.message); }
    finally { setFr02Loading(false); }
  }

  async function runFR03() {
    setFr03Loading(true); setFr03Err(""); setFr03Out(null);
    setEditablePlan(null); setIsEditing(false);
    try {
      const result = await postJSON("/fr03/plan", {
        fr02: fr02Out,
        sprint_length_days: Number(sprintLength),
        velocity_days_per_sprint: Number(velocity),
        enrich_with_llm: enrich,
      });
      setFr03Out(result);
      setEditablePlan(JSON.parse(JSON.stringify(result)));
    } catch (e) { setFr03Err(e.message); }
    finally { setFr03Loading(false); }
  }

  function handleApprovePlan() {
    const planToSave = editablePlan || fr03Out;
    localStorage.setItem("approvedSprintPlan", JSON.stringify({
      ...planToSave,
      original_goal: fr03Out?.original_goal || goalText,
      approvedAt: new Date().toISOString(),
    }));
    navigate("/sprint-plan");
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
      u.sprints[si].tasks.push({ title: "New Task", estimate_days: 1, dependencies: [], notes: "" });
      return u;
    });
  }

  const displayPlan = editablePlan || fr03Out;

  return (
    <div className="page">
      <style>{css}</style>

      {/* FR01 */}
      <div className="card">
        <div className="card-header"><p className="card-title">Parse Goal</p></div>
        <div className="card-body">
          <Field label="Project Goal">
            <textarea rows={4} value={goalText} onChange={e => setGoalText(e.target.value)} />
          </Field>
          <div className="row">
            <button className="btn btn-primary" onClick={runFR01} disabled={fr01Loading}>
              {fr01Loading ? "Running..." : "Run FR01"}
            </button>
            {fr01Err && <span className="error">{fr01Err}</span>}
          </div>
          {fr01Out && <pre className="code-out">{JSON.stringify(fr01Out, null, 2)}</pre>}
        </div>
      </div>

      {/* FR02 */}
      <div className="card">
        <div className="card-header"><p className="card-title">Decompose into Tasks</p></div>
        <div className="card-body">
          <p className="status">FR01 loaded: <b>{fr01Out ? "Yes" : "No"}</b></p>
          <div className="row">
            <button className="btn btn-primary" onClick={runFR02} disabled={fr02Loading || !fr01Out}>
              {fr02Loading ? "Running..." : "Run FR02"}
            </button>
            {fr02Err && <span className="error">{fr02Err}</span>}
          </div>
          {fr02Out && <pre className="code-out">{JSON.stringify(fr02Out, null, 2)}</pre>}
        </div>
      </div>

      {/* FR03 */}
      <div className="card">
        <div className="card-header"><p className="card-title">Generate Sprint Plan</p></div>
        <div className="card-body">
          <div className="grid-3">
            <Field label="Sprint length (days)">
              <input type="number" value={sprintLength} onChange={e => setSprintLength(e.target.value)} />
            </Field>
            <Field label="Velocity (days/sprint)">
              <input type="number" value={velocity} onChange={e => setVelocity(e.target.value)} />
            </Field>
            <div className="field" style={{ justifyContent: "flex-end" }}>
              <label className="checkbox-label">
                <input type="checkbox" checked={enrich} onChange={e => setEnrich(e.target.checked)} />
                Enrich with LLM notes
              </label>
            </div>
          </div>
          <div className="row">
            <button className="btn btn-primary" onClick={runFR03} disabled={fr03Loading || !fr02Out}>
              {fr03Loading ? "Running..." : "Run FR03"}
            </button>
            {fr03Err && <span className="error">{fr03Err}</span>}
          </div>
          {fr03Out && !isEditing && <pre className="code-out">{JSON.stringify(fr03Out, null, 2)}</pre>}
        </div>
      </div>

      {/* Review plan */}
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
                <button className="btn btn-primary" onClick={handleApprovePlan}>
                  ✅ Approve Plan
                </button>
              </div>
            </div>

            {displayPlan.sprints?.map((sprint, si) => (
              <div key={si} className="sprint-block">
                <div className="sprint-block-header">
                  <p className="sprint-name">
                    {sprint.name || `Sprint ${si + 1}`}
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
                        <input
                          className="edit-input"
                          value={task.title}
                          onChange={e => handleEditTask(si, ti, "title", e.target.value)}
                        />
                        <div className="edit-row">
                          <span className="edit-label">Est. days:</span>
                          <input
                            type="number"
                            className="edit-num"
                            value={task.estimate_days}
                            onChange={e => handleEditTask(si, ti, "estimate_days", Number(e.target.value))}
                          />
                          {task.notes !== undefined && (
                            <input
                              className="edit-notes"
                              placeholder="Notes..."
                              value={task.notes || ""}
                              onChange={e => handleEditTask(si, ti, "notes", e.target.value)}
                            />
                          )}
                          <button className="link-btn link-del" onClick={() => handleDeleteTask(si, ti)}>🗑 Remove</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="task-info">
                          <p className="task-title-text">{task.title}</p>
                          {task.notes && <p className="task-notes-text">{task.notes}</p>}
                          {task.dependencies?.length > 0 && (
                            <p className="task-deps-text">Deps: {task.dependencies.join(", ")}</p>
                          )}
                        </div>
                        <span className="badge">{task.estimate_days}d</span>
                      </>
                    )}
                  </div>
                ))}

                {sprint.notes && !isEditing && <p className="sprint-notes">{sprint.notes}</p>}
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" onClick={handleApprovePlan}>✅ Approve & View Plan</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}