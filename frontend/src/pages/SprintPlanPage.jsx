import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function ProgressRing({ pct, size = 56, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#334155" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#10b981" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; }
  .page { min-height: 100vh; background: #0f172a; }
  .content { max-width: 860px; margin: 0 auto; margin-left: calc(220px + ((100vw - 220px - 860px) / 2)); padding: 32px 24px; }
  @media (max-width: 1140px) { .content { margin-left: 220px; } }
  @media (max-width: 768px) { .content { margin-left: 0; padding: 72px 16px 32px; } }
  @media (max-width: 600px) { .pills { gap: 6px; } .pill { font-size: 11px; padding: 4px 10px; } .plan-card-inner { flex-direction: column; align-items: flex-start; gap: 12px; } .header-right { align-self: flex-end; } .tabs { flex-wrap: wrap; } }

  .header-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #10b981; margin-bottom: 4px; }
  .header-title { font-size: 18px; font-weight: 700; color: #fff; }
  .header-date { font-size: 12px; color: #64748b; margin-top: 2px; }
  .header-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .ring-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
  .ring-label { position: absolute; font-size: 11px; font-weight: 700; color: #fff; }
  .task-count { text-align: right; }
  .task-count strong { font-size: 22px; color: #fff; }
  .task-count span { color: #64748b; }
  .task-count p { font-size: 12px; color: #94a3b8; }
  .plan-card-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; }

  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
  .progress-header { display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
  .bar-track { height: 6px; background: #334155; border-radius: 99px; overflow: hidden; }
  .bar-fill { height: 6px; background: #10b981; border-radius: 99px; transition: width 0.4s ease; }

  .pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .pill { border: 1px solid #334155; border-radius: 99px; padding: 4px 12px; font-size: 12px; font-weight: 600; background: #0f172a; color: #64748b; cursor: pointer; }
  .pill:hover { border-color: #475569; color: #cbd5e1; }
  .pill.active { background: #10b981; border-color: #10b981; color: #fff; }
  .pill.done { border-color: #065f46; color: #6ee7b7; background: #064e3b22; }

  .panel { background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; }
  .panel-header { padding: 16px 20px; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .sprint-title { font-size: 15px; font-weight: 700; color: #fff; }
  .sprint-dates { font-size: 12px; color: #64748b; margin-top: 2px; }
  .sprint-bar-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
  .sprint-bar-row .bar-track { flex: 1; height: 4px; }
  .sprint-bar-row span { font-size: 12px; color: #94a3b8; white-space: nowrap; }

  .tabs { display: flex; border: 1px solid #334155; border-radius: 8px; overflow: hidden; }
  .tab { padding: 6px 12px; font-size: 12px; font-weight: 500; background: none; border: none; cursor: pointer; color: #64748b; text-transform: capitalize; }
  .tab:hover { background: #334155; color: #cbd5e1; }
  .tab.active { background: #064e3b; color: #10b981; }

  .task-list { list-style: none; }
  .task-list li + li { border-top: 1px solid #1e2d40; }
  .task-row { display: flex; align-items: flex-start; gap: 14px; padding: 14px 20px; cursor: pointer; }
  .task-row:hover { background: #ffffff08; }

  .check { width: 20px; height: 20px; border-radius: 50%; border: 2px solid #475569; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; transition: border-color 0.15s, background 0.15s; }
  .check.checked { background: #10b981; border-color: #10b981; }
  .check svg { width: 10px; height: 10px; stroke: #fff; stroke-width: 3; fill: none; }

  .task-body { flex: 1; min-width: 0; }
  .task-title { font-size: 14px; font-weight: 500; color: #f1f5f9; }
  .task-title.done { text-decoration: line-through; opacity: 0.4; }
  .task-notes { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .task-notes.done { opacity: 0.4; text-decoration: line-through; }
  .deps { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
  .dep { font-size: 11px; background: #0f172a; color: #64748b; border-radius: 99px; padding: 2px 8px; }

  .badge { flex-shrink: 0; font-size: 11px; font-weight: 600; border-radius: 99px; padding: 2px 10px; }
  .badge.pending { background: #1e3a5f; color: #93c5fd; }
  .badge.done { background: #064e3b; color: #6ee7b7; }

  .panel-footer { padding: 12px 20px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; font-style: italic; }
  .empty { padding: 40px 20px; text-align: center; color: #64748b; font-size: 14px; }

  .bottom { margin-top: 20px; display: flex; align-items: center; justify-content: space-between; }
  .back-btn { background: none; border: none; cursor: pointer; color: #64748b; font-size: 13px; }
  .back-btn:hover { color: #cbd5e1; }
  .complete-banner { background: #064e3b; color: #6ee7b7; border-radius: 99px; padding: 8px 16px; font-size: 13px; font-weight: 600; }

  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; }
  .empty-state p { color: #94a3b8; font-size: 14px; }
  .empty-state .btn { padding: 8px 20px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; background: #10b981; color: #fff; }
  .empty-state .btn:hover { background: #059669; }

  .plan-list { display: flex; flex-direction: column; gap: 12px; }
  .plan-item { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; transition: border-color 0.15s; }
  .plan-item:hover { border-color: #10b981; }
  .plan-item-title { font-size: 14px; font-weight: 600; color: #f1f5f9; }
  .plan-item-meta { font-size: 12px; color: #64748b; margin-top: 3px; }
  .plan-item-pct { font-size: 13px; font-weight: 700; color: #10b981; flex-shrink: 0; }
  .section-title { font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px; }
  .delete-btn { background: none; border: none; cursor: pointer; color: #475569; font-size: 12px; padding: 4px 8px; border-radius: 6px; }
  .delete-btn:hover { color: #ef4444; background: #1a0a0a; }
`;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SprintPlanPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [completedTasks, setCompletedTasks] = useState({});
  const [activeSprint, setActiveSprint] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingCompletion, setSavingCompletion] = useState(false);

  // ── Load data ─────────────────────────────────────────────
  useEffect(() => {
    //  Wait for AuthContext to finish checking the cookie first.
    // Without this, on refresh user=null (still loading) triggers
    // the localStorage fallback before the real user is known.
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    if (id) {
      fetch(`${API_BASE}/api/sprintplan/${id}`, { credentials: "include" })
        .then(r => r.json())
        .then(data => {
          if (data.id) {
            setPlan({ ...data.plan_json, approvedAt: data.approved_at, dbId: data.id });
            setCompletedTasks(data.completions || {});
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      fetch(`${API_BASE}/api/sprintplan`, { credentials: "include" })
        .then(r => r.json())
        .then(data => setPlans(data.plans || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, user, authLoading]); // authLoading in deps

  //  Toggle task completion 
  async function toggleTask(sprintIdx, taskIdx) {
    const key = `${sprintIdx}-${taskIdx}`;
    const updated = { ...completedTasks, [key]: !completedTasks[key] };
    setCompletedTasks(updated);

    if (user && plan?.dbId) {
      setSavingCompletion(true);
      try {
        await fetch(`${API_BASE}/api/sprintplan/${plan.dbId}/completions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ completions: updated }),
        });
      } catch (e) {
        console.error("Failed to save completion:", e);
      } finally {
        setSavingCompletion(false);
      }
    } else {
      localStorage.setItem("sprintTaskCompletions", JSON.stringify(updated));
    }
  }

  async function deletePlan(e, planId) {
    e.stopPropagation();
    if (!confirm("Delete this sprint plan?")) return;
    await fetch(`${API_BASE}/api/sprintplan/${planId}`, { method: "DELETE", credentials: "include" });
    setPlans(prev => prev.filter(p => p.id !== planId));
  }

  // Stats 
  const stats = useMemo(() => {
    if (!plan) return { total: 0, done: 0, pct: 0 };
    let total = 0, done = 0;
    plan.sprints?.forEach((sp, si) =>
      sp.tasks?.forEach((_, ti) => { total++; if (completedTasks[`${si}-${ti}`]) done++; })
    );
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [plan, completedTasks]);

  const sprintStats = useMemo(() => {
    if (!plan) return [];
    return plan.sprints?.map((sp, si) => {
      const total = sp.tasks?.length || 0;
      const done = sp.tasks?.filter((_, ti) => completedTasks[`${si}-${ti}`]).length || 0;
      return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
    });
  }, [plan, completedTasks]);

  // Loading (auth still resolving OR data fetching) 
  if (authLoading || loading) return (
    <div className="page"><style>{css}</style>
      <div className="empty-state"><p>Loading...</p></div>
    </div>
  );

  //  Plan list (no ID, logged in) 
  if (!id && user) {
    return (
      <div className="page"><style>{css}</style>
        <div className="content">
          <p className="section-title">Your Sprint Plans</p>
          {plans.length === 0 ? (
            <div className="empty-state">
              <p>No sprint plans yet.</p>
              <button className="btn" onClick={() => navigate("/")}>← Create a Sprint Plan</button>
            </div>
          ) : (
            <div className="plan-list">
              {plans.map(p => {
                const completions = p.completions || {};
                const sprints = p.plan_json?.sprints || [];
                let total = 0, done = 0;
                sprints.forEach((sp, si) => sp.tasks?.forEach((_, ti) => {
                  total++; if (completions[`${si}-${ti}`]) done++;
                }));
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <div key={p.id} className="plan-item" onClick={() => navigate(`/sprint-plan/${p.id}`)}>
                    <div>
                      <p className="plan-item-title">{p.title}</p>
                      <p className="plan-item-meta">
                        {new Date(p.approved_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        {" · "}{total} tasks
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className="plan-item-pct">{pct}%</span>
                      <button className="delete-btn" onClick={e => deletePlan(e, p.id)}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="bottom">
            <button className="back-btn" onClick={() => navigate("/")}>← Back to Planner</button>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in 
  if (!user) return (
    <div className="page"><style>{css}</style>
      <div className="empty-state">
        <p>Sign in to view your sprint plans.</p>
        <button className="btn" onClick={() => navigate("/signin")}>Sign in</button>
      </div>
    </div>
  );

  // No plan found 
  if (!plan) return (
    <div className="page"><style>{css}</style>
      <div className="empty-state">
        <p>No sprint plan found.</p>
        <button className="btn" onClick={() => navigate("/")}>← Create a Sprint Plan</button>
      </div>
    </div>
  );

  // Detail view
  const currentSprint = plan.sprints?.[activeSprint];
  const filteredTasks = currentSprint?.tasks?.filter((_, ti) => {
    const key = `${activeSprint}-${ti}`;
    if (filter === "done") return completedTasks[key];
    if (filter === "pending") return !completedTasks[key];
    return true;
  });
  const ss = sprintStats[activeSprint];

  return (
    <div className="page">
      <style>{css}</style>
      <div className="content">

        <div className="card">
          <div className="plan-card-inner">
            <div>
              <p className="header-label">Sprint Plan {savingCompletion && "· saving…"}</p>
              <h1 className="header-title">
                {plan.original_goal?.slice(0, 60) || "Sprint Plan"}
                {plan.original_goal?.length > 60 ? "…" : ""}
              </h1>
              {plan.approvedAt && (
                <p className="header-date">
                  Approved {new Date(plan.approvedAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                </p>
              )}
            </div>
            <div className="header-right">
              <div className="ring-wrap">
                <ProgressRing pct={stats.pct} size={56} stroke={5} />
                <span className="ring-label">{stats.pct}%</span>
              </div>
              <div className="task-count">
                <p><strong>{stats.done}</strong><span>/{stats.total}</span></p>
                <p>tasks done</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="progress-header">
            <span>Overall Progress</span>
            <span>{stats.done} of {stats.total} tasks completed</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${stats.pct}%` }} />
          </div>
          <div className="pills">
            {plan.sprints?.map((sp, si) => {
              const s = sprintStats[si];
              const isDone = s?.pct === 100;
              const isActive = si === activeSprint;
              return (
                <button key={si} onClick={() => setActiveSprint(si)}
                  className={cx("pill", isActive ? "active" : isDone ? "done" : "")}>
                  {sp.name || `Sprint ${si + 1}`}
                  {isDone ? " ✓" : ` · ${s?.done}/${s?.total}`}
                </button>
              );
            })}
          </div>
        </div>

        {currentSprint && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <p className="sprint-title">{currentSprint.name || `Sprint ${activeSprint + 1}`}</p>
                {currentSprint.start_date && (
                  <p className="sprint-dates">{currentSprint.start_date} → {currentSprint.end_date}</p>
                )}
                <div className="sprint-bar-row">
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${ss?.pct || 0}%` }} />
                  </div>
                  <span>{ss?.done}/{ss?.total}</span>
                </div>
              </div>
              <div className="tabs">
                {["all", "pending", "done"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={cx("tab", filter === f ? "active" : "")}>{f}</button>
                ))}
              </div>
            </div>

            <ul className="task-list">
              {filteredTasks?.length === 0 && <li className="empty">No tasks match this filter.</li>}
              {filteredTasks?.map((task) => {
                const origIdx = currentSprint.tasks.indexOf(task);
                const key = `${activeSprint}-${origIdx}`;
                const done = !!completedTasks[key];
                return (
                  <li key={key} className="task-row" onClick={() => toggleTask(activeSprint, origIdx)}>
                    <div className={cx("check", done ? "checked" : "")}>
                      {done && <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="task-body">
                      <p className={cx("task-title", done ? "done" : "")}>{task.title}</p>
                      {task.notes && <p className={cx("task-notes", done ? "done" : "")}>{task.notes}</p>}
                      {task.dependencies?.length > 0 && (
                        <div className="deps">
                          {task.dependencies.map((d, di) => <span key={di} className="dep">↳ {d}</span>)}
                        </div>
                      )}
                    </div>
                    <span className={cx("badge", done ? "done" : "pending")}>{task.estimate_days}d</span>
                  </li>
                );
              })}
            </ul>
            {currentSprint.notes && <div className="panel-footer">{currentSprint.notes}</div>}
          </div>
        )}

        <div className="bottom">
          <button className="back-btn" onClick={() => navigate("/sprint-plan")}>← All Plans
          </button>
          {stats.pct === 100 && <div className="complete-banner"> All sprints complete!</div>}
        </div>
      </div>
    </div>
  );
}