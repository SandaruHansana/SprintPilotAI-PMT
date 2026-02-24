import { useState, useMemo } from "react";
import { postJSON } from "../utils/api";
import { Card, Button, Input, Textarea } from "../components/UI";

export default function SprintPlanner() {
  // FR01
  const [goalText, setGoalText] = useState(
    "Build a web application for sprint planning within 8 weeks under $500 for a small team."
  );
  const [fr01Out, setFr01Out] = useState(null);
  const [fr01Loading, setFr01Loading] = useState(false);
  const [fr01Err, setFr01Err] = useState("");

  // FR02
  const [fr02Out, setFr02Out] = useState(null);
  const [fr02Loading, setFr02Loading] = useState(false);
  const [fr02Err, setFr02Err] = useState("");

  // FR03
  const [sprintLength, setSprintLength] = useState(14);
  const [velocity, setVelocity] = useState(14);
  const [enrich, setEnrich] = useState(true);
  const [fr03Out, setFr03Out] = useState(null);
  const [fr03Loading, setFr03Loading] = useState(false);
  const [fr03Err, setFr03Err] = useState("");

  // FR04
  const [action, setAction] = useState("modify_task");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentEst, setCurrentEst] = useState(3);
  const [deps, setDeps] = useState("");
  const [fr04Out, setFr04Out] = useState(null);
  const [fr04Loading, setFr04Loading] = useState(false);
  const [fr04Err, setFr04Err] = useState("");

  const taskTitles = useMemo(() => {
    const arr = [];
    for (const sp of fr03Out?.sprints || []) {
      for (const t of sp.tasks || []) arr.push(t.title);
    }
    return arr;
  }, [fr03Out]);

  async function runFR01() {
    setFr01Loading(true); setFr01Err(""); setFr01Out(null);
    setFr02Out(null); setFr03Out(null); setFr04Out(null);
    try {
      setFr01Out(await postJSON("/fr01/parse", { goal_text: goalText }));
    } catch (e) { setFr01Err(e.message); }
    finally { setFr01Loading(false); }
  }

  async function runFR02() {
    setFr02Loading(true); setFr02Err(""); setFr02Out(null);
    setFr03Out(null); setFr04Out(null);
    try {
      setFr02Out(await postJSON("/fr02/decompose", { data: fr01Out }));
    } catch (e) { setFr02Err(e.message); }
    finally { setFr02Loading(false); }
  }

  async function runFR03() {
    setFr03Loading(true); setFr03Err(""); setFr03Out(null); setFr04Out(null);
    try {
      setFr03Out(await postJSON("/fr03/plan", {
        fr02: fr02Out,
        sprint_length_days: Number(sprintLength),
        velocity_days_per_sprint: Number(velocity),
        enrich_with_llm: enrich,
      }));
    } catch (e) { setFr03Err(e.message); }
    finally { setFr03Loading(false); }
  }

  async function runFR04() {
    setFr04Loading(true); setFr04Err(""); setFr04Out(null);
    try {
      setFr04Out(await postJSON("/fr04/suggest", {
        goal: fr03Out?.original_goal || goalText,
        existing_task_titles: taskTitles,
        action,
        current_title: currentTitle,
        current_est: Number(currentEst),
        current_deps: deps ? deps.split(",").map((x) => x.trim()).filter(Boolean) : [],
      }));
    } catch (e) { setFr04Err(e.message); }
    finally { setFr04Loading(false); }
  }

  return (
    <div className="grid gap-4">

      {/* FR01 */}
      <Card title="Parse Goal">
        <Textarea
          label="Project Goal"
          rows={4}
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
        />
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={runFR01} disabled={fr01Loading}>
            {fr01Loading ? "Running..." : "Run FR01"}
          </Button>
          {fr01Err && <span className="text-sm text-red-600">{fr01Err}</span>}
        </div>
        {fr01Out && (
          <pre className="mt-3 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-green-200">
            {JSON.stringify(fr01Out, null, 2)}
          </pre>
        )}
      </Card>

      {/* FR02 */}
      <Card title="Decompose into Tasks">
        <div className="text-sm text-slate-700">
          FR01 loaded: <b>{fr01Out ? "Yes" : "No"}</b>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={runFR02} disabled={fr02Loading || !fr01Out}>
            {fr02Loading ? "Running..." : "Run FR02"}
          </Button>
          {fr02Err && <span className="text-sm text-red-600">{fr02Err}</span>}
        </div>
        {fr02Out && (
          <pre className="mt-3 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-green-200">
            {JSON.stringify(fr02Out, null, 2)}
          </pre>
        )}
      </Card>

      {/* FR03 */}
      <Card title=" Generate Sprint Plan">
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
          <Button onClick={runFR03} disabled={fr03Loading || !fr02Out}>
            {fr03Loading ? "Running..." : "Run FR03"}
          </Button>
          {fr03Err && <span className="text-sm text-red-600">{fr03Err}</span>}
        </div>
        {fr03Out && (
          <pre className="mt-3 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-green-200">
            {JSON.stringify(fr03Out, null, 2)}
          </pre>
        )}
      </Card>

      {/* FR04 */}
      <Card title="AI Task Changes">
        <div className="text-sm text-slate-700">
          FR03 loaded: <b>{fr03Out ? "Yes" : "No"}</b> — tasks available: <b>{taskTitles.length}</b>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
          <Input
            label="Current Title"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
          />
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
          <Button onClick={runFR04} disabled={fr04Loading || !fr03Out}>
            {fr04Loading ? "Running..." : "Get Suggestion"}
          </Button>
          {fr04Err && <span className="text-sm text-red-600">{fr04Err}</span>}
        </div>
        {fr04Out && (
          <pre className="mt-3 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-green-200">
            {JSON.stringify(fr04Out, null, 2)}
          </pre>
        )}
      </Card>

    </div>
  );
}