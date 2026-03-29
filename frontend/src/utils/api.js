export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Core fetch helpers ────────────────────────────────────────────────────────

async function request(method, path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include", // sends the auth cookie on every request
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.detail || data?.message || `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

export const postJSON = (path, payload) => request("POST", path, payload);
export const getJSON  = (path)          => request("GET",  path);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  register : (data)  => postJSON("/api/auth/register", data),
  login    : (data)  => postJSON("/api/auth/login",    data),
  logout   : ()      => postJSON("/api/auth/logout"),
  me       : ()      => getJSON("/api/auth/me"),
};

// ── SprintPilot ───────────────────────────────────────────────────────────────
//
// The Express backend exposes a single /api/sprintpilot/pipeline endpoint that
// runs FR01 → FR02 → FR03 and returns { result: { fr01, fr02, fr03 } }.
// The FR05 predict endpoint returns { result: { prediction, success_probability, ... } }.

export const sprintpilot = {
  /**
   * Run the full pipeline (FR01 → FR02 → FR03).
   * @param {string}  goalText
   * @param {object}  [opts]  { sprintDays?, velocity?, enrich? }
   * @returns {Promise<{ fr01, fr02, fr03 }>}
   */
  pipeline: async (goalText, opts = {}) => {
    const data = await postJSON("/api/sprintpilot/pipeline", {
      goal_text:    goalText,
      sprint_days:  opts.sprintDays,
      velocity:     opts.velocity,
      enrich:       opts.enrich,
    });
    return data.result; // { fr01, fr02, fr03 }
  },

  /**
   * FR05: predict task success probability.
   * @param {object} inputData  Feature object.
   * @returns {Promise<{ prediction, success_probability, threshold, input_used }>}
   */
  predict: async (inputData) => {
    const data = await postJSON("/api/sprintpilot/predict", inputData);
    return data.result; // { prediction, success_probability, ... }
  },

  /**
   * Check if FR05 model files exist on the server.
   * @returns {Promise<{ model_exists, meta_exists }>}
   */
  fr05Status: async () => {
    const data = await getJSON("/api/sprintpilot/fr05/status");
    return data.result;
  },
};
