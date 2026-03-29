import json
import sys

try:
    import joblib
    import pandas as pd
    import numpy as np
    import torch
    import torch.nn as nn
    from sklearn.base import BaseEstimator, ClassifierMixin
    _DEPS_OK = True
except ImportError:
    _DEPS_OK = False


# Model class definitions
# Must live here so joblib.load() can deserialise
# the saved model without an AttributeError.

class WideResidualMLP(nn.Module):
    def __init__(self, n_num, cat_card, emb_dim=8, hidden=256, dropout=0.35):
        super().__init__()
        self.embeddings = nn.ModuleList([
            nn.Embedding(card, min(emb_dim, max(2, card // 2)))
            for card in cat_card
        ])
        total_emb = sum(min(emb_dim, max(2, c // 2)) for c in cat_card)
        in_dim = n_num + total_emb

        def block(d_in, d_out):
            return nn.Sequential(
                nn.Linear(d_in, d_out), nn.BatchNorm1d(d_out),
                nn.GELU(), nn.Dropout(dropout)
            )

        self.input_proj = block(in_dim, hidden)
        self.res1 = nn.Sequential(block(hidden, hidden), block(hidden, hidden))
        self.res2 = nn.Sequential(block(hidden, hidden), block(hidden, hidden))
        self.res3 = nn.Sequential(block(hidden, hidden // 2))
        self.head = nn.Linear(hidden // 2, 1)

    def forward(self, x_num, x_cat):
        embs = [emb(x_cat[:, i]) for i, emb in enumerate(self.embeddings)]
        x = torch.cat([x_num] + embs, dim=1)
        x = self.input_proj(x)
        x = x + self.res1(x)
        x = x + self.res2(x)
        x = self.res3(x)
        return self.head(x).squeeze(1)


class DeepMLPWrapper(BaseEstimator, ClassifierMixin):
    def __init__(self, net, preprocess, n_num, n_cat, device, threshold):
        self.net        = net
        self.preprocess = preprocess
        self.n_num      = n_num
        self.n_cat      = n_cat
        self.device     = device
        self.threshold  = threshold
        self.classes_   = np.array([0, 1])

    def predict_proba(self, X):
        Xpp   = self.preprocess.transform(X)
        x_num = torch.tensor(Xpp[:, :self.n_num], dtype=torch.float32).to(self.device)
        x_cat = torch.tensor(Xpp[:, self.n_num:].clip(0), dtype=torch.long).to(self.device)
        self.net.eval()
        with torch.no_grad():
            proba = torch.sigmoid(self.net(x_num, x_cat)).cpu().numpy()
        return np.column_stack([1 - proba, proba])

    def predict(self, X):
        return (self.predict_proba(X)[:, 1] >= self.threshold).astype(int)

    def fit(self, X, y):
        return self

# FR05: Task Success Predictor (joblib model)

_MODEL           = None
_FEATURE_COLUMNS = None
_CAT_COLS        = None
_THRESHOLD       = 0.5


def _load_model(models_dir=None):
    global _MODEL, _FEATURE_COLUMNS, _CAT_COLS, _THRESHOLD

    if _MODEL is not None:
        return

    if not _DEPS_OK:
        raise ImportError("joblib and pandas are required. Run: pip install joblib pandas")

    from pathlib import Path
    base        = Path(models_dir) if models_dir else Path(__file__).resolve().parent / "models"
    model_path  = base / "fr05_task_success_model.joblib"
    meta_path   = base / "fr05_feature_columns.json"

    if not model_path.exists():
        raise FileNotFoundError(f"Missing model file: {model_path}")
    if not meta_path.exists():
        raise FileNotFoundError(f"Missing meta file: {meta_path}")

    _MODEL = joblib.load(model_path)
    meta   = json.loads(meta_path.read_text(encoding="utf-8"))

    _FEATURE_COLUMNS = meta.get("feature_columns_used")
    if not _FEATURE_COLUMNS:
        raise ValueError("Meta JSON missing 'feature_columns_used' list.")

    _CAT_COLS  = set(meta.get("categorical_columns", ["task_type", "priority_moscow", "assignee_role"]))
    _THRESHOLD = float(meta.get("threshold", 0.5))


def fr05_predict(input_data, models_dir=None):
    """
    FR05: Predict task success probability.

    input_data fields:
        task_type           e.g. "backend", "frontend", "ml"
        assignee_role       e.g. "senior_dev", "junior_dev"
        experience_years    number
        sprint_length_days  number
        story_points        number
        dependencies_count  number
        blockers_count      number
        priority_moscow     "M" | "S" | "C" | "W"
        requirement_changes number
        communication_volume number
        override_requested  0 or 1 (optional)

    Returns:
        prediction (0/1), success_probability, threshold, input_used
    """
    _load_model(models_dir)

    row = {
        "task_type":             input_data.get("task_type", ""),
        "assignee_role":         input_data.get("assignee_role", ""),
        "experience_years":      input_data.get("experience_years", 0),
        "sprint_length_days":    input_data.get("sprint_length_days", 14),
        "story_points":          input_data.get("story_points", 0),
        "dependencies_count":    input_data.get("dependencies_count", 0),
        "blockers_count":        input_data.get("blockers_count", 0),
        "priority_moscow":       input_data.get("priority_moscow", ""),
        "requirement_changes":   input_data.get("requirement_changes", 0),
        "communication_volume":  input_data.get("communication_volume", 0),
        "override_requested":    input_data.get("override_requested", 0),
    }

    df = pd.DataFrame([row])

    # Engineered features — must match what the Colab training script computed
    
    df["risk_score"] = (df["dependencies_count"]
                        + df["blockers_count"]
                        + df["requirement_changes"])

    for c in _FEATURE_COLUMNS:
        if c not in df.columns:
            df[c] = 0
    df = df[_FEATURE_COLUMNS]

    for c in df.columns:
        if c in _CAT_COLS:
            df[c] = df[c].astype(str)
        else:
            df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)

    proba = float(_MODEL.predict_proba(df)[0][1])
    pred  = int(proba >= _THRESHOLD)

    return {
        "prediction":          pred,
        "success_probability": proba,
        "threshold":           _THRESHOLD,
        "input_used":          row,
    }


# CLI entry point (for Node.js child_process)
# Command:
#   predict  '<json_object>'  [--models-dir=<path>]

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "error": "Usage: python sprintpilot.py predict '<json>' [--models-dir=./models]"
        }))
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "predict":
        raw_json   = sys.argv[2]
        models_dir = None
        for arg in sys.argv[3:]:
            if arg.startswith("--models-dir="):
                models_dir = arg.split("=", 1)[1]
        try:
            input_data = json.loads(raw_json)
            result     = fr05_predict(input_data, models_dir=models_dir)
            print(json.dumps(result, indent=2))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)

    else:
        print(json.dumps({"error": f"Unknown command '{command}'. Only 'predict' is supported now. Sprint planning has moved to Gemini in sprintpilot.js."}))
        sys.exit(1)