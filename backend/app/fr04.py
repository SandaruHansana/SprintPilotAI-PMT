from fastapi import APIRouter
from typing import Any, Dict, List, Optional

from .schemas import FR04In
from .resources import RES

fr04_router = APIRouter()

def llm_suggest_task_changes(
    goal: str,
    existing_task_titles: List[str],
    action: str,
    current_title: str = "",
    current_est: int = 0,
    current_deps: Optional[List[str]] = None
) -> Dict[str, Any]:
    current_deps = current_deps or []
    titles_short = ", ".join(existing_task_titles[:25])

    prompt = f"""
You are SprintPilotAI FR04 assistant.
You suggest edits to tasks in a sprint plan.

Return ONLY these lines:
TITLE: <suggested title or keep similar>
ESTIMATE_DAYS: <integer 1-30>
DEPENDS_ON: <dep1; dep2; or none>
SPRINT_HINT: <SPRINT-01/SPRINT-02/SPRINT-03 or none>
NOTE: <1 sentence>

Context:
Project goal: {goal}

Existing task titles (choose dependencies only from these titles):
{titles_short}

Action: {action}
Current title: {current_title}
Current estimate days: {current_est}
Current deps: {", ".join(current_deps) if current_deps else "none"}
""".strip()

    inputs = RES.tokenizer(prompt, return_tensors="pt", truncation=True).to(RES.device)

    import torch
    with torch.no_grad():
        out = RES.model.generate(**inputs, max_new_tokens=160, do_sample=False)

    text = RES.tokenizer.decode(out[0], skip_special_tokens=True).strip()

    kv = {}
    for ln in text.splitlines():
        if ":" in ln:
            k, v = ln.split(":", 1)
            kv[k.strip().upper()] = v.strip()

    title = kv.get("TITLE", "").strip()
    est_raw = kv.get("ESTIMATE_DAYS", "").strip()
    deps_raw = kv.get("DEPENDS_ON", "none").strip().lower()
    sprint_hint = kv.get("SPRINT_HINT", "none").strip()
    note = kv.get("NOTE", "").strip()

    try:
        est = int(float(est_raw))
        if est < 1 or est > 30:
            est = None
    except Exception:
        est = None

    if deps_raw in {"none", "null", ""}:
        deps = []
    else:
        deps = [d.strip() for d in deps_raw.split(";") if d.strip()]

    valid_set = set(existing_task_titles)
    deps = [d for d in deps if d in valid_set]

    return {
        "title": title if title else None,
        "estimate_days": est,
        "depends_on": deps,
        "sprint_hint": sprint_hint if sprint_hint else "none",
        "note": note
    }

@fr04_router.post("/suggest")
def api_fr04_suggest(body: FR04In):
    return llm_suggest_task_changes(
        goal=body.goal,
        existing_task_titles=body.existing_task_titles,
        action=body.action,
        current_title=body.current_title,
        current_est=body.current_est,
        current_deps=body.current_deps or []
    )
