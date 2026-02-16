from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Set

from fastapi import APIRouter
from .schemas import FR03In
from .resources import RES

fr03_router = APIRouter()

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def build_maps(tasks: List[Dict[str, Any]]) -> Tuple[Dict[str, Dict[str, Any]], Dict[str, str]]:
    task_by_id = {t["id"]: t for t in tasks}
    id_by_title = {}
    for t in tasks:
        title = t.get("title", "").strip()
        if title:
            id_by_title[title] = t["id"]
    return task_by_id, id_by_title

def toposort_task_ids(tasks: List[Dict[str, Any]]) -> List[str]:
    task_by_id, id_by_title = build_maps(tasks)

    dependents: Dict[str, Set[str]] = {tid: set() for tid in task_by_id}
    indegree: Dict[str, int] = {tid: 0 for tid in task_by_id}

    for t in tasks:
        tid = t["id"]
        deps_titles = t.get("depends_on", [])
        for dep_title in deps_titles:
            dep_id = id_by_title.get(dep_title)
            if dep_id is None:
                continue
            dependents[dep_id].add(tid)
            indegree[tid] += 1

    queue = [tid for tid, deg in indegree.items() if deg == 0]
    queue.sort()

    order = []
    while queue:
        node = queue.pop(0)
        order.append(node)
        for nxt in sorted(dependents[node]):
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
                queue.sort()

    if len(order) != len(tasks):
        return sorted(task_by_id.keys())
    return order

def deps_satisfied(task: Dict[str, Any], done_titles: Set[str]) -> bool:
    for dep in task.get("depends_on", []):
        if dep not in done_titles:
            return False
    return True

def split_task_if_needed(task: Dict[str, Any], sprint_capacity: int) -> List[Dict[str, Any]]:
    est = int(task.get("estimate_days", 1))
    if est <= sprint_capacity:
        return [task]

    parts = []
    remaining = est
    part_num = 1
    base_id = task["id"]
    base_title = task["title"]

    prev_part_title = None
    while remaining > 0:
        chunk = min(remaining, sprint_capacity)
        new_title = f"{base_title} (Part {part_num})"
        new_id = f"{base_id}P{part_num}"

        if part_num == 1:
            new_deps = task.get("depends_on", []).copy()
        else:
            new_deps = [prev_part_title] if prev_part_title else []

        parts.append({
            "id": new_id,
            "title": new_title,
            "estimate_days": chunk,
            "depends_on": new_deps,
            "type": task.get("type", "task"),
            "split_from": base_id,
        })

        prev_part_title = new_title
        remaining -= chunk
        part_num += 1

    return parts

def llm_enrich_sprint(goal: str, sprint_id: str, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
    task_titles = [t["title"] for t in tasks]

    prompt = f"""
Write sprint notes for a software sprint.

Return ONLY 4 lines exactly:
SPRINT_GOAL: <short sentence>
RATIONALE: <short sentence>
RISKS: <risk1; risk2; risk3>
MITIGATIONS: <mitigation1; mitigation2; mitigation3>

Sprint: {sprint_id}
Goal: {goal}
Tasks: {", ".join(task_titles)}
""".strip()

    inputs = RES.tokenizer(prompt, return_tensors="pt", truncation=True).to(RES.device)

    import torch
    with torch.no_grad():
        out = RES.model.generate(**inputs, max_new_tokens=140, do_sample=False)

    text = RES.tokenizer.decode(out[0], skip_special_tokens=True).strip()

    kv = {}
    for ln in text.splitlines():
        if ":" in ln:
            k, v = ln.split(":", 1)
            kv[k.strip().upper()] = v.strip()

    def split_list(v: str) -> List[str]:
        return [x.strip() for x in v.split(";") if x.strip()]

    if "SPRINT_GOAL" not in kv or "RATIONALE" not in kv:
        return {
            "sprint_goal": f"Complete {len(task_titles)} planned tasks for {sprint_id}.",
            "sprint_rationale": "Tasks are grouped by dependency order and sprint capacity.",
            "risks": ["Underestimation of effort", "Dependency delays", "Scope changes"],
            "mitigations": ["Time buffer in sprint", "Daily check on blockers", "Freeze scope for sprint"],
            "notes_source": "fallback_notes"
        }

    return {
        "sprint_goal": kv.get("SPRINT_GOAL", ""),
        "sprint_rationale": kv.get("RATIONALE", ""),
        "risks": split_list(kv.get("RISKS", "")),
        "mitigations": split_list(kv.get("MITIGATIONS", "")),
        "notes_source": "llm_local_flan_t5"
    }

def fr03_generate_sprint_plan(fr02: Dict[str, Any], sprint_length_days: int = 14, velocity_days_per_sprint: int = 14, enrich_with_llm: bool = True) -> Dict[str, Any]:
    now_utc = datetime.now(timezone.utc)

    original_tasks = fr02.get("tasks", [])
    if not original_tasks:
        raise ValueError("No tasks found in FR02 JSON.")

    expanded_tasks: List[Dict[str, Any]] = []
    for t in original_tasks:
        expanded_tasks.extend(split_task_if_needed(t, sprint_capacity=velocity_days_per_sprint))

    order_ids = toposort_task_ids(expanded_tasks)
    task_by_id, _ = build_maps(expanded_tasks)

    sprints: List[Dict[str, Any]] = []
    done_titles: Set[str] = set()

    remaining_ids = order_ids.copy()
    sprint_index = 1
    safety = 0

    while remaining_ids:
        safety += 1
        if safety > 1000:
            raise RuntimeError("Scheduling loop exceeded safety limit. Check dependencies.")

        capacity_left = velocity_days_per_sprint
        sprint_tasks: List[Dict[str, Any]] = []
        scheduled_this_sprint = set()

        progress = True
        while progress:
            progress = False
            for tid in list(remaining_ids):
                task = task_by_id[tid]
                title = task["title"]
                est = int(task.get("estimate_days", 1))

                if title in done_titles or title in scheduled_this_sprint:
                    continue
                if not deps_satisfied(task, done_titles.union(scheduled_this_sprint)):
                    continue

                if est <= capacity_left:
                    sprint_tasks.append(task)
                    capacity_left -= est
                    scheduled_this_sprint.add(title)
                    remaining_ids.remove(tid)
                    progress = True

        if not sprint_tasks and remaining_ids:
            tid = remaining_ids.pop(0)
            task = task_by_id[tid]
            sprint_tasks.append(task)
            scheduled_this_sprint.add(task["title"])
            capacity_left = max(0, capacity_left - int(task.get("estimate_days", 1)))

        for t in sprint_tasks:
            done_titles.add(t["title"])

        sprint_obj = {
            "sprint_id": f"SPRINT-{sprint_index:02d}",
            "sprint_length_days": sprint_length_days,
            "capacity_days": velocity_days_per_sprint,
            "used_days": sum(int(t.get("estimate_days", 1)) for t in sprint_tasks),
            "remaining_capacity_days": capacity_left,
            "tasks": [
                {
                    "id": t["id"],
                    "title": t["title"],
                    "estimate_days": int(t.get("estimate_days", 1)),
                    "depends_on": t.get("depends_on", []),
                    "type": t.get("type", "task"),
                    **({"split_from": t["split_from"]} if "split_from" in t else {})
                }
                for t in sprint_tasks
            ]
        }

        if enrich_with_llm:
            enrichment = llm_enrich_sprint(
                goal=fr02.get("original_goal", ""),
                sprint_id=sprint_obj["sprint_id"],
                tasks=sprint_obj["tasks"]
            )
            sprint_obj.update(enrichment)

        sprints.append(sprint_obj)
        sprint_index += 1

    total_days = sum(s["used_days"] for s in sprints)

    return {
        "sprint_plan_id": f"PLAN-{now_utc.strftime('%Y%m%d%H%M%S')}",
        "timestamp_utc": utc_now_iso(),
        "source_decomposition_id": fr02.get("decomposition_id"),
        "source_goal_id": fr02.get("source_goal_id"),
        "domain": fr02.get("domain"),
        "epic": fr02.get("epic"),
        "original_goal": fr02.get("original_goal"),
        "assumptions": {
            "sprint_length_days": sprint_length_days,
            "velocity_days_per_sprint": velocity_days_per_sprint,
            "planning_method": "topological + greedy packing",
            "notes": "Dependencies must be satisfied before a task can be scheduled. Oversized tasks are split."
        },
        "summary": {
            "num_sprints": len(sprints),
            "total_estimated_days": total_days,
            "avg_days_per_sprint": round(total_days / max(1, len(sprints)), 2)
        },
        "sprints": sprints
    }

@fr03_router.post("/plan")
def api_fr03_plan(body: FR03In):
    return fr03_generate_sprint_plan(
        fr02=body.fr02,
        sprint_length_days=body.sprint_length_days,
        velocity_days_per_sprint=body.velocity_days_per_sprint,
        enrich_with_llm=body.enrich_with_llm
    )
