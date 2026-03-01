from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
import joblib
import pandas as pd

from .schemas import FR05In

fr05_router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "fr05_task_success_model.joblib"
META_PATH  = MODEL_DIR / "fr05_feature_columns.json"

MODEL = None
FEATURE_COLUMNS = None
CAT_COLS = None
THRESHOLD = 0.5


def load_fr05():
    global MODEL, FEATURE_COLUMNS, CAT_COLS, THRESHOLD
    if MODEL is not None:
        return

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Missing model file: {MODEL_PATH}")
    if not META_PATH.exists():
        raise FileNotFoundError(f"Missing meta file: {META_PATH}")

    MODEL = joblib.load(MODEL_PATH)
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))

    FEATURE_COLUMNS = meta.get("feature_columns_used")
    if not FEATURE_COLUMNS:
        raise ValueError("Meta JSON missing 'feature_columns_used' list.")

    CAT_COLS = set(meta.get("categorical_columns", ["task_type", "priority_moscow", "assignee_role"]))
    THRESHOLD = float(meta.get("threshold", 0.5))


def to_row(x: FR05In) -> dict:
    return {
        "task_type": x.task_type,
        "assignee_role": x.assignee_role,
        "experience_years": x.experience_years,
        "team_size": x.team_size,
        "sprint_length_days": x.sprint_length_days,
        "story_points": x.story_points,
        "estimated_hours": x.estimated_hours,
        "dependencies_count": x.dependencies_count,
        "blockers_count": x.blockers_count,
        "priority_moscow": x.priority_moscow,
        "requirement_changes": x.requirement_changes,
        "communication_volume": x.communication_volume,
        "sentiment_score": x.sentiment_score,
        "ai_suggestion_used": x.ai_suggestion_used,
        "ai_acceptance_rate": x.ai_acceptance_rate,
        "override_requested": getattr(x, "override_requested", 0),
    }


@fr05_router.get("/status")
def status():
    return {
        "model_exists": MODEL_PATH.exists(),
        "meta_exists": META_PATH.exists()
    }


@fr05_router.post("/predict")
def predict(body: FR05In):
    try:
        load_fr05()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    row = to_row(body)
    df = pd.DataFrame([row])

    # Fill any missing feature columns with 0
    for c in FEATURE_COLUMNS:
        if c not in df.columns:
            df[c] = 0

    df = df[FEATURE_COLUMNS]

    # Cast dtypes to match training
    for c in df.columns:
        if c in CAT_COLS:
            df[c] = df[c].astype(str)
        else:
            df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)

    proba = float(MODEL.predict_proba(df)[0][1])
    pred = int(proba >= THRESHOLD)

    return {
        "prediction": pred,
        "success_probability": proba,
        "threshold": THRESHOLD,
        "input_used": row
    }