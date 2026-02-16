import { useState } from "react";
import { postJSON } from "../utils/api";
import { Card, Button } from "../components/UI";

function loadLocal(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

export default function FR02() {
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");

  const fr01 = loadLocal("FR01_OUT");

  async function run() {
    setLoading(true);
    setErr("");
    setOut(null);
    try {
      if (!fr01) throw new Error("No FR01 output found. Run FR01 first.");
      const data = await postJSON("/fr02/decompose", { data: fr01 });
      setOut(data);
      localStorage.setItem("FR02_OUT", JSON.stringify(data));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card title="FR02 — Decompose into Tasks">
        <div className="text-sm text-slate-700">
          FR01 loaded: <b>{fr01 ? "Yes" : "No"}</b>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button onClick={run} disabled={loading}>
            {loading ? "Running..." : "Run FR02"}
          </Button>
          {err && <div className="text-sm text-red-600">{err}</div>}
        </div>
      </Card>

      {out && (
        <Card title="FR02 Output JSON">
          <pre className="overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-green-200">
            {JSON.stringify(out, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
