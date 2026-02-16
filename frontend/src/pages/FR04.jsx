import { useMemo, useState } from "react";
import { postJSON } from "../utils/api";
import { Card, Button, Input, Textarea } from "../components/UI";

function loadLocal(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export default function FR04() {
  const fr03 = loadLocal("FR03_OUT");

  const goal = fr03?.original_goal || "";
  const titles = useMemo(() => {
    const arr = [];
    for (const sp of fr03?.sprints || []) {
      for (const t of sp.tasks || []) arr.push(t.title);
    }
    return arr;
  }, [fr03]);

  const [action, setAction] = useState("modify_task");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentEst, setCurrentEst] = useState(3);
  const [deps, setDeps] = useState("");

  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");

  async function run() {
    setLoading(true);
    setErr("");
    setOut(null);
    try {
      if (!fr03) throw new Error("No FR03 plan found. Run FR03 first.");
      const data = await postJSON("/fr04/suggest", {
        goal,
        existing_task_titles: titles,
        action,
        current_title: currentTitle,
        current_est: Number(currentEst),
        current_deps: deps ? deps.split(",").map((x) => x.trim()).filter(Boolean) : [],
      });
      setOut(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card title="FR04 — AI Suggest Task Changes">
        <div className="text-sm text-slate-700">
          FR03 loaded: <b>{fr03 ? "Yes" : "No"}</b> — tasks available: <b>{titles.length}</b>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Action" value={action} onChange={(e) => setAction(e.target.value)} />
          <Input label="Current Title" value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)} />
          <Input
            label="Current Estimate (days)"
            type="number"
            value={currentEst}
            onChange={(e) => setCurrentEst(e.target.value)}
          />
          <Textarea
            label="Current deps (comma titles)"
            rows={2}
            value={deps}
            onChange={(e) => setDeps(e.target.value)}
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Button onClick={run} disabled={loading}>
            {loading ? "Running..." : "Get Suggestion"}
          </Button>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>
      </Card>

      {out && (
        <Card title="FR04 Suggestion">
          <pre className="overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-green-200">
            {JSON.stringify(out, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
