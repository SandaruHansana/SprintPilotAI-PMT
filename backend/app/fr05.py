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
THRESHOLD = 0.5

def load_fr05():
    global MODEL, FEATURE_COLUMNS, THRESHOLD
    if MODEL is not None:
        return

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Missing model file: {MODEL_PATH}")
    if not META_PATH.exists():
        raise FileNotFoundError(f"Missing meta file: {META_PATH}")

    MODEL = joblib.load(MODEL_PATH)
    meta = json.loads(META_PATH.read_text(encoding="utf-8"))

    # ✅ Your meta JSON contains this:
    # "feature_columns_used": [...]
    FEATURE_COLUMNS = meta.get("feature_columns_used")
    if not FEATURE_COLUMNS:
        raise ValueError("Meta JSON missing 'feature_columns_used' list.")

    THRESHOLD = float(meta.get("threshold", 0.5))

def to_row(x: FR05In) -> dict:
    return {
        "Task Type": x.task_type,
        "Assignee Role": x.assignee_role,
        "Experience (years)": x.experience_years,
        "Team Size": x.team_size,
        "Sprint Length (days)": x.sprint_length_days,
        "Story Points": x.story_points,
        "Estimated Hours": x.estimated_hours,
        "Dependencies Count": x.dependencies_count,
        "Blockers Count": x.blockers_count,
        "Priority MoSCoW": x.priority_moscow,
        "Requirement Changes": x.requirement_changes,
        "Communication Volume": x.communication_volume,
        "Sentiment Score": x.sentiment_score,
        "AI Suggestion Used?": x.ai_suggestion_used,
        "AI Acceptance Rate": x.ai_acceptance_rate,
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

    # Ensure exact columns used during training
    for c in FEATURE_COLUMNS:
        if c not in df.columns:
            df[c] = None
    df = df[FEATURE_COLUMNS]

    # Pipeline already handles preprocess
    proba = float(MODEL.predict_proba(df)[0][1])
    pred = int(proba >= THRESHOLD)

    return {
        "prediction": pred,
        "success_probability": proba,
        "threshold": THRESHOLD,
        "input_used": row
    }
