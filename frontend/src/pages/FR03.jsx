import { useState } from "react";
import { postJSON } from "../utils/api";
import { Card, Button, Input } from "../components/UI";

function loadLocal(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export default function FR03() {
  const fr02 = loadLocal("FR02_OUT");

  const [sprintLength, setSprintLength] = useState(14);
  const [velocity, setVelocity] = useState(14);
  const [enrich, setEnrich] = useState(true);

  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");

  async function run() {
    setLoading(true);
    setErr("");
    setOut(null);
    try {
      if (!fr02) throw new Error("No FR02 output found. Run FR02 first.");

      const data = await postJSON("/fr03/plan", {
        fr02,
        sprint_length_days: Number(sprintLength),
        velocity_days_per_sprint: Number(velocity),
        enrich_with_llm: enrich,
      });

      setOut(data);
      localStorage.setItem("FR03_OUT", JSON.stringify(data));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card title="FR03 — Generate Sprint Plan">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="Sprint length (days)"
            type="number"
            value={sprintLength}
            onChange={(e) => setSprintLength(e.target.value)}
          />
          <Input
            label="Velocity (days per sprint)"
            type="number"
            value={velocity}
            onChange={(e) => setVelocity(e.target.value)}
          />
          <label className="flex items-end gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={enrich}
              onChange={(e) => setEnrich(e.target.checked)}
            />
            Enrich with LLM notes
          </label>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Button onClick={run} disabled={loading}>
            {loading ? "Running..." : "Run FR03"}
          </Button>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>
      </Card>

      {out && (
        <Card title="FR03 Output (Sprint Plan)">
          <pre className="overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-green-200">
            {JSON.stringify(out, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
