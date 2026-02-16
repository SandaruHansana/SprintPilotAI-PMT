import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter
from .schemas import GoalIn
from .resources import RES

fr01_router = APIRouter()

TIME_RE = re.compile(r"\b(?:in|within|by|for)\s+(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months|year|years)\b", re.I)
PLATFORM_RE = re.compile(r"\b(android|ios|mobile|web|website|frontend|backend|api|cloud|desktop|windows|linux|mac)\b", re.I)
BUDGET_RE = re.compile(r"\b(?:budget|cost|under|below|less than)\s*(?:is|:)?\s*([$€£]?\s*\d+(?:,\d{3})*(?:\.\d+)?)\b", re.I)

def clean_text(text: str) -> str:
    if not isinstance(text, str):
        raise ValueError("Goal must be a string.")
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\w\s\-,.()/%:$€£]", "", text)
    return text

def spacy_features(goal: str) -> Dict[str, Any]:
    doc = RES.nlp(goal)

    entities = [
        {"text": ent.text, "label": ent.label_}
        for ent in doc.ents
        if ent.label_ in {"DATE", "TIME", "MONEY", "ORG", "PRODUCT", "GPE", "NORP", "EVENT"}
    ]

    noun_chunks: List[str] = []
    for chunk in doc.noun_chunks:
        t = chunk.text.strip().lower()
        if len(t) >= 3 and not t.isdigit():
            noun_chunks.append(t)

    keywords: List[str] = []
    for tok in doc:
        if tok.is_stop or tok.is_punct:
            continue
        if not (tok.is_alpha or tok.like_num):
            continue
        lemma = tok.lemma_.lower().strip()
        if len(lemma) >= 3:
            keywords.append(lemma)

    def uniq(seq: List[str]) -> List[str]:
        seen = set()
        out = []
        for x in seq:
            if x not in seen:
                seen.add(x)
                out.append(x)
        return out

    return {
        "entities": entities,
        "noun_chunks": uniq(noun_chunks)[:20],
        "keywords": uniq(keywords)[:25],
    }

def required_template(clean_goal: str) -> Dict[str, Any]:
    return {
        "goal_id": "GOAL-REPLACED-LATER",
        "timestamp_utc": "REPLACED-LATER",
        "raw_goal": "REPLACED-LATER",
        "clean_goal": clean_goal,

        "domain": "Other",
        "problem_summary": "",
        "deliverables": [],
        "assumptions": [],

        "constraints": {
            "time_text": None,
            "time_days_approx": None,
            "budget_text": None,
            "budget_value_raw": None,
            "platform_hints": [],
            "non_functional": []
        },

        "stakeholders": [],
        "features_high_level": [],
        "keywords": [],

        "confidence": 0.75,
        "validation_error": None
    }

def normalize_time_to_days(value: float, unit: str) -> int:
    unit = unit.lower()
    if unit.startswith("day"):
        return int(round(value))
    if unit.startswith("week"):
        return int(round(value * 7))
    if unit.startswith("month"):
        return int(round(value * 30))
    if unit.startswith("year"):
        return int(round(value * 365))
    return int(round(value))

def extract_time_platform_budget(clean_goal: str) -> Dict[str, Any]:
    out = {
        "time_text": None,
        "time_days_approx": None,
        "platform_hints": [],
        "budget_text": None,
        "budget_value_raw": None
    }

    m = TIME_RE.search(clean_goal)
    if m:
        num = float(m.group(1))
        unit = m.group(2)
        out["time_text"] = f"{m.group(1)} {unit}"
        out["time_days_approx"] = normalize_time_to_days(num, unit)

    plats = sorted({p.lower() for p in PLATFORM_RE.findall(clean_goal)})
    out["platform_hints"] = plats

    b = BUDGET_RE.search(clean_goal)
    if b:
        out["budget_text"] = b.group(0)
        out["budget_value_raw"] = b.group(1).replace(" ", "")

    return out

def classify_domain_rule(clean_goal: str) -> str:
    g = clean_goal.lower()

    if any(x in g for x in ["android", "ios", "mobile app", "mobile application", "mobile"]):
        return "Mobile App"
    if any(x in g for x in ["web", "website", "web app", "frontend", "dashboard"]):
        return "Web Application"
    if any(x in g for x in ["api", "rest", "graphql", "microservice", "backend"]):
        return "API/Backend"
    if any(x in g for x in ["desktop", "windows app", "linux app", "mac app", "electron"]):
        return "Desktop Application"
    if any(x in g for x in ["machine learning", "ml", "ai", "model", "prediction", "nlp", "llm"]):
        return "ML/AI System"
    return "Other"

def llm_enrich_fields(clean_goal: str) -> Dict[str, Any]:
    prompt = f"""
You are SprintPilotAI FR01.
Given the goal, produce ONLY these lines (no extra text):

SUMMARY: <one sentence>
DELIVERABLES: <3-6 items separated by ';'>
FEATURES: <3-8 items separated by ';'>
STAKEHOLDERS: <2-6 items separated by ';'>
NON_FUNCTIONAL: <0-6 items separated by ';'>
ASSUMPTIONS: <0-6 items separated by ';'>
CONFIDENCE: <0.0 to 1.0>
VALIDATION_ERROR: <null or short message>

Now do the same for:
Goal: {clean_goal}
""".strip()

    inputs = RES.tokenizer(prompt, return_tensors="pt", truncation=True).to(RES.device)

    import torch
    with torch.no_grad():
        outputs = RES.model.generate(**inputs, max_new_tokens=260, do_sample=False)

    text = RES.tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

    kv = {}
    for ln in text.splitlines():
        if ":" in ln:
            k, v = ln.split(":", 1)
            kv[k.strip().upper()] = v.strip()

    return kv

def fr01_parse_goal(goal_text: str) -> Dict[str, Any]:
    raw_goal = goal_text
    cleaned = clean_text(goal_text)

    parsed = required_template(cleaned)

    parsed["goal_id"] = f"GOAL-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    parsed["timestamp_utc"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    parsed["raw_goal"] = raw_goal
    parsed["clean_goal"] = cleaned

    hints = spacy_features(cleaned)
    parsed["keywords"] = hints.get("keywords", [])

    parsed["domain"] = classify_domain_rule(cleaned)

    tp = extract_time_platform_budget(cleaned)
    parsed["constraints"]["time_text"] = tp["time_text"]
    parsed["constraints"]["time_days_approx"] = tp["time_days_approx"]
    parsed["constraints"]["platform_hints"] = tp["platform_hints"]
    parsed["constraints"]["budget_text"] = tp["budget_text"]
    parsed["constraints"]["budget_value_raw"] = tp["budget_value_raw"]

    kv = llm_enrich_fields(cleaned)

    parsed["problem_summary"] = kv.get("SUMMARY") or "Parsed project goal into structured fields for FR02."

    if kv.get("DELIVERABLES"):
        parsed["deliverables"] = [x.strip() for x in kv["DELIVERABLES"].split(";") if x.strip()]

    if kv.get("FEATURES"):
        parsed["features_high_level"] = [x.strip() for x in kv["FEATURES"].split(";") if x.strip()]

    if kv.get("STAKEHOLDERS"):
        parsed["stakeholders"] = [x.strip() for x in kv["STAKEHOLDERS"].split(";") if x.strip()]

    if kv.get("NON_FUNCTIONAL"):
        parsed["constraints"]["non_functional"] = [x.strip() for x in kv["NON_FUNCTIONAL"].split(";") if x.strip()]

    if kv.get("ASSUMPTIONS"):
        parsed["assumptions"] = [x.strip() for x in kv["ASSUMPTIONS"].split(";") if x.strip()]

    if kv.get("CONFIDENCE"):
        try:
            parsed["confidence"] = max(0.0, min(1.0, float(kv["CONFIDENCE"])))
        except Exception:
            parsed["confidence"] = 0.75

    verr = (kv.get("VALIDATION_ERROR") or "null").strip().lower()
    parsed["validation_error"] = None if verr in {"null", "none", ""} else kv.get("VALIDATION_ERROR")

    if len(cleaned) < 10:
        parsed["validation_error"] = "Goal is too short. Add more details."

    if parsed["constraints"]["time_text"] is None and parsed["validation_error"] is None:
        parsed["validation_error"] = "Consider adding a timeline (e.g., within 8 weeks) for better planning."

    return parsed

@fr01_router.post("/parse")
def api_fr01_parse(body: GoalIn):
    return fr01_parse_goal(body.goal_text)
