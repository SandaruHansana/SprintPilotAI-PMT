from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Set

from fastapi import APIRouter
from .schemas import DictIn
from .resources import RES

fr02_router = APIRouter()

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def guess_epic(domain: str) -> str:
    if domain == "Web Application":
        return "Web App Delivery"
    if domain == "Mobile App":
        return "Mobile App Delivery"
    if domain == "API/Backend":
        return "Backend/API Delivery"
    if domain == "Desktop Application":
        return "Desktop App Delivery"
    if domain == "ML/AI System":
        return "ML System Delivery"
    return "General Project Delivery"

def safe_int(x, default=3):
    try:
        return int(float(x))
    except Exception:
        return default

BASE_TASKS = [
    ("Requirements & Scope", 3, []),
    ("Architecture & Tech Stack", 3, ["Requirements & Scope"]),
    ("Project Setup (Repo, CI, Environments)", 2, ["Architecture & Tech Stack"]),
    ("Testing Strategy & QA Plan", 2, ["Requirements & Scope"]),
    ("Deployment Plan", 2, ["Architecture & Tech Stack"]),
]

DOMAIN_TASKS = {
    "Web Application": [
        ("UI/UX Wireframes", 3, ["Requirements & Scope"]),
        ("Frontend Development", 8, ["UI/UX Wireframes", "Project Setup (Repo, CI, Environments)"]),
        ("Backend Development", 8, ["Architecture & Tech Stack", "Project Setup (Repo, CI, Environments)"]),
        ("Integration (Frontend + Backend)", 4, ["Frontend Development", "Backend Development"]),
    ],
    "Mobile App": [
        ("UI/UX Wireframes", 3, ["Requirements & Scope"]),
        ("Mobile App Development", 10, ["UI/UX Wireframes", "Project Setup (Repo, CI, Environments)"]),
        ("Backend/API Integration", 5, ["Mobile App Development"]),
    ],
    "API/Backend": [
        ("API Design (Endpoints, Contracts)", 4, ["Architecture & Tech Stack"]),
        ("API Implementation", 8, ["API Design (Endpoints, Contracts)", "Project Setup (Repo, CI, Environments)"]),
        ("API Documentation", 2, ["API Design (Endpoints, Contracts)"]),
    ],
    "Desktop Application": [
        ("UI/UX Wireframes", 3, ["Requirements & Scope"]),
        ("Desktop App Development", 10, ["UI/UX Wireframes", "Project Setup (Repo, CI, Environments)"]),
    ],
    "ML/AI System": [
        ("Dataset Collection", 5, ["Requirements & Scope"]),
        ("Data Cleaning & Preprocessing", 5, ["Dataset Collection"]),
        ("Model Training Baseline", 7, ["Data Cleaning & Preprocessing"]),
        ("Model Evaluation & Metrics", 4, ["Model Training Baseline"]),
        ("Model Packaging (Save/Load + Inference)", 3, ["Model Evaluation & Metrics"]),
    ],
}

FEATURE_TASKS = {
    "authentication": [
        ("User Authentication (Login/Signup)", 4, ["Backend Development"]),
        ("Auth UI Screens", 3, ["Frontend Development"]),
    ],
    "login": [
        ("User Authentication (Login/Signup)", 4, ["Backend Development"]),
        ("Auth UI Screens", 3, ["Frontend Development"]),
    ],
    "payment": [
        ("Payment Gateway Integration", 5, ["Backend Development"]),
        ("Payment UI Flow", 3, ["Frontend Development"]),
    ],
    "database": [
        ("Database Schema Design", 3, ["Architecture & Tech Stack"]),
        ("Database Implementation & Migrations", 3, ["Database Schema Design"]),
    ],
    "dashboard": [
        ("Dashboard UI", 4, ["Frontend Development"]),
        ("Dashboard Backend APIs", 3, ["Backend Development"]),
    ],
    "prediction": [
        ("Define Prediction Target + Features", 3, ["Requirements & Scope"]),
        ("Train Prediction Model", 6, ["Data Cleaning & Preprocessing"]),
    ],
    "deployment": [
        ("Deploy to Staging", 2, ["Integration (Frontend + Backend)", "Deployment Plan"]),
        ("Deploy to Production", 2, ["Deploy to Staging"]),
    ],
}

def add_feature_tasks(keywords: List[str]) -> List[Tuple[str, int, List[str]]]:
    tasks: List[Tuple[str, int, List[str]]] = []
    kw_set = set([k.lower() for k in keywords])
    for k, tlist in FEATURE_TASKS.items():
        if k in kw_set:
            tasks.extend(tlist)
    return tasks

def build_tasks_from_templates(templates: List[Tuple[str, int, List[str]]]) -> List[Dict[str, Any]]:
    tasks = []
    for i, (title, est, deps) in enumerate(templates, start=1):
        tasks.append({
            "id": f"T-{i:03d}",
            "title": title,
            "estimate_days": est,
            "depends_on": deps,
            "type": "task",
            "source": "fallback_templates"
        })
    return tasks

def task_titles(task_list: List[Dict[str, Any]]) -> set:
    return {t["title"] for t in task_list}

def ensure_dependency_exists(task_list: List[Dict[str, Any]], dep: str) -> None:
    existing = task_titles(task_list)
    if dep not in existing:
        task_list.append({
            "id": f"T-{len(task_list)+1:03d}",
            "title": dep,
            "estimate_days": 3,
            "depends_on": [],
            "type": "auto_added_dependency",
            "source": "dependency_fix"
        })

def fix_dependencies(task_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    titles = task_titles(task_list)
    for t in task_list:
        for dep in t.get("depends_on", []):
            if dep not in titles:
                ensure_dependency_exists(task_list, dep)
                titles = task_titles(task_list)
    return task_list

def llm_generate_tasks(fr01: Dict[str, Any]) -> List[Dict[str, Any]]:
    domain = fr01.get("domain", "Other")
    goal = fr01.get("raw_goal", "")
    keywords = fr01.get("keywords", [])
    constraints = fr01.get("constraints", {})

    prompt = f"""
You are SprintPilotAI FR02.
Decompose the project goal into sprint tasks.

Return ONLY lines in this exact format:
TASK: <title> | <estimate_days_integer> | <dependency1,dependency2 or none>

Rules:
- Produce 8 to 14 tasks.
- Dependencies must refer to earlier tasks by title (or 'none').
- Estimates should be small integers (1-10).
- Include at least: Requirements, Design/Wireframes, Development, Testing, Deployment.
- Use the domain to choose tasks: {domain}

Goal: {goal}
Keywords: {", ".join(keywords[:20])}
Time constraint (days): {constraints.get("time_days_approx")}

Example lines:
TASK: Requirements & Scope | 3 | none
TASK: UI/UX Wireframes | 3 | Requirements & Scope
""".strip()

    inputs = RES.tokenizer(prompt, return_tensors="pt", truncation=True).to(RES.device)

    import torch
    with torch.no_grad():
        out = RES.model.generate(**inputs, max_new_tokens=360, do_sample=False)

    text = RES.tokenizer.decode(out[0], skip_special_tokens=True).strip()

    tasks: List[Dict[str, Any]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("TASK:"):
            continue
        try:
            rest = line[len("TASK:"):].strip()
            parts = [p.strip() for p in rest.split("|")]
            if len(parts) != 3:
                continue
            title = parts[0]
            days = safe_int(parts[1], default=3)
            deps_raw = parts[2].strip().lower()

            if deps_raw in {"none", "null", ""}:
                deps = []
            else:
                deps = [d.strip() for d in parts[2].split(",") if d.strip()]

            tasks.append({
                "id": f"T-{len(tasks)+1:03d}",
                "title": title,
                "estimate_days": max(1, min(10, days)),
                "depends_on": deps,
                "type": "task",
                "source": "llm"
            })
        except Exception:
            continue

    return tasks

def fallback_decompose(fr01: Dict[str, Any]) -> List[Dict[str, Any]]:
    domain = fr01.get("domain", "Other")
    keywords = fr01.get("keywords", [])

    templates: List[Tuple[str, int, List[str]]] = []
    templates.extend(BASE_TASKS)
    templates.extend(DOMAIN_TASKS.get(domain, []))
    templates.extend(add_feature_tasks(keywords))

    seen = set()
    uniq_templates = []
    for t in templates:
        if t[0] not in seen:
            seen.add(t[0])
            uniq_templates.append(t)

    tasks = build_tasks_from_templates(uniq_templates)
    tasks = fix_dependencies(tasks)
    return tasks

def choose_tasks(fr01: Dict[str, Any]) -> List[Dict[str, Any]]:
    llm_tasks = llm_generate_tasks(fr01)
    if len(llm_tasks) < 6:
        return fallback_decompose(fr01)
    llm_tasks = fix_dependencies(llm_tasks)
    return llm_tasks

def fr02_decompose(fr01: Dict[str, Any]) -> Dict[str, Any]:
    domain = fr01.get("domain", "Other")
    keywords = fr01.get("keywords", [])
    constraints = fr01.get("constraints", {})

    epic = guess_epic(domain)
    tasks = choose_tasks(fr01)

    time_days = constraints.get("time_days_approx")
    if isinstance(time_days, int) and time_days > 0:
        sprint_count = max(1, int(round(time_days / 14)))
    else:
        sprint_count = None

    return {
        "decomposition_id": f"DEC-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "timestamp_utc": utc_now_iso(),
        "source_goal_id": fr01.get("goal_id"),
        "epic": epic,
        "domain": domain,
        "original_goal": fr01.get("raw_goal"),
        "keywords_used": keywords,
        "constraints": constraints,
        "estimated_sprint_count_approx": sprint_count,
        "tasks": tasks,
    }

@fr02_router.post("/decompose")
def api_fr02_decompose(body: DictIn):
    return fr02_decompose(body.data)
