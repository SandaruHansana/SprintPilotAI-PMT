import { useState } from "react";
import { postJSON } from "../utils/api";
import { Card, Button, Input } from "../components/UI";

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
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function run() {
    setLoading(true);
    setErr("");
    setOut(null);
    try {
      const data = await postJSON("/fr05/predict", form);
      setOut(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card title="FR05 — Predict Task Success">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Task Type" value={form.task_type} onChange={(e) => setField("task_type", e.target.value)} />
          <Input label="Assignee Role" value={form.assignee_role} onChange={(e) => setField("assignee_role", e.target.value)} />

          <Input label="Experience Years" type="number" value={form.experience_years} onChange={(e) => setField("experience_years", Number(e.target.value))} />
          <Input label="Team Size" type="number" value={form.team_size} onChange={(e) => setField("team_size", Number(e.target.value))} />

          <Input label="Sprint Length Days" type="number" value={form.sprint_length_days} onChange={(e) => setField("sprint_length_days", Number(e.target.value))} />
          <Input label="Story Points" type="number" value={form.story_points} onChange={(e) => setField("story_points", Number(e.target.value))} />

          <Input label="Estimated Hours" type="number" value={form.estimated_hours} onChange={(e) => setField("estimated_hours", Number(e.target.value))} />
          <Input label="Dependencies Count" type="number" value={form.dependencies_count} onChange={(e) => setField("dependencies_count", Number(e.target.value))} />

          <Input label="Blockers Count" type="number" value={form.blockers_count} onChange={(e) => setField("blockers_count", Number(e.target.value))} />
          <Input label="Priority MoSCoW" value={form.priority_moscow} onChange={(e) => setField("priority_moscow", e.target.value)} />

          <Input label="Requirement Changes" type="number" value={form.requirement_changes} onChange={(e) => setField("requirement_changes", Number(e.target.value))} />
          <Input label="Communication Volume" type="number" value={form.communication_volume} onChange={(e) => setField("communication_volume", Number(e.target.value))} />

          <Input label="Sentiment Score (-1..1)" type="number" step="0.1" value={form.sentiment_score} onChange={(e) => setField("sentiment_score", Number(e.target.value))} />
          <Input label="AI Acceptance Rate (0..1)" type="number" step="0.1" value={form.ai_acceptance_rate} onChange={(e) => setField("ai_acceptance_rate", Number(e.target.value))} />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Button onClick={run} disabled={loading}>
            {loading ? "Predicting..." : "Predict"}
          </Button>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>
      </Card>

      {out && (
        <Card title="FR05 Output">
          <pre className="overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-green-200">
            {JSON.stringify(out, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
