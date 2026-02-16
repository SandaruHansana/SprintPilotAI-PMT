import { useState } from "react";
import { postJSON } from "../utils/api";
import { Card, Button, Textarea } from "../components/UI";

export default function FR01() {
  const [goalText, setGoalText] = useState(
    "Build a web application for sprint planning within 8 weeks under $500 for a small team."
  );
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");

  async function run() {
    setLoading(true);
    setErr("");
    setOut(null);
    try {
      const data = await postJSON("/fr01/parse", { goal_text: goalText });
      setOut(data);
      localStorage.setItem("FR01_OUT", JSON.stringify(data));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card title="FR01 — Parse Goal">
        <Textarea
          label="Project Goal"
          rows={5}
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
        />
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={run} disabled={loading}>
            {loading ? "Running..." : "Run FR01"}
          </Button>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>
      </Card>

      {out && (
        <Card title="FR01 Output JSON">
          <pre className="overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-green-200">
            {JSON.stringify(out, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
