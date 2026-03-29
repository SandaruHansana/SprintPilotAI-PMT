/**
 * SprintPilotAI – Node.js wrapper
 * ================================
 * pipeline()  → calls Groq API directly (no Python needed)
 * predict()   → still calls sprintpilot.py via child_process (FR05 joblib model)
 *
 * Setup
 * -----
 *   1. npm install groq-sdk
 *   2. Set GROQ_API_KEY in your .env file.
 *      Get a free key at: https://console.groq.com
 *   3. For predict() only: keep sprintpilot.py next to this file
 *      with Python ≥3.9 + joblib + pandas installed.
 *
 * Usage
 * -----
 *   const sp = require('./sprintpilot');
 *
 *   // Full pipeline (FR01 → FR02 → FR03) via Groq
 *   const result = await sp.pipeline("Build a food delivery app within 8 weeks");
 *   console.log(result.fr01);  // parsed goal
 *   console.log(result.fr02);  // task decomposition
 *   console.log(result.fr03);  // sprint plan
 *
 *   // FR05 task success prediction (still uses Python/joblib)
 *   const pred = await sp.predict({ task_type: "backend", assignee_role: "senior_dev", ... });
 *   console.log(pred.prediction);          // 0 or 1
 *   console.log(pred.success_probability); // e.g. 0.82
 */

"use strict";

const { execFile } = require("child_process");
const path = require("path");
const Groq = require("groq-sdk");

// ── Config ────────────────────────────────────────────────────────────────────

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL   = process.env.GROQ_MODEL   || "llama-3.3-70b-versatile";

// FR05 Python config (unchanged)
const PY_BIN     = process.env.SPRINTPILOT_PYTHON     || "python";
const PY_SCRIPT  = process.env.SPRINTPILOT_PY_PATH    || path.join(__dirname, "sprintpilot.py");
const MODELS_DIR = process.env.SPRINTPILOT_MODELS_DIR || path.join(__dirname, "models");
const TIMEOUT_MS = parseInt(process.env.SPRINTPILOT_TIMEOUT_MS || "300000", 10);

// ── Groq helper ───────────────────────────────────────────────────────────────

function getGroqClient() {
  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Get a free key at https://console.groq.com " +
      "and add it to your .env: GROQ_API_KEY=your_key_here"
    );
  }
  return new Groq({ apiKey: GROQ_API_KEY });
}

async function callGroq(prompt) {
  const groq = getGroqClient();
  const res = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: GROQ_MODEL,
  });
  return res.choices[0].message.content.replace(/```json\s*|```/g, "").trim();
}

// ── Goal validation helper ────────────────────────────────────────────────────

// Single words / greetings that are clearly not project goals
const INVALID_GOAL_PATTERNS = [
  /^(help|hi|hello|hey|test|ok|okay|yes|no|thanks|bye|quit|exit|start|go|run)$/i,
];

function validateGoalText(goalText) {
  const cleaned = goalText.trim();

  if (cleaned.length < 10) {
    throw new TypeError(
      `"${cleaned}" is not a valid project goal. ` +
      `Please describe what you want to build (e.g. "Build a food delivery app in 8 weeks").`
    );
  }

  for (const pattern of INVALID_GOAL_PATTERNS) {
    if (pattern.test(cleaned)) {
      throw new TypeError(
        `"${cleaned}" is not a valid project goal. ` +
        `Please describe what you want to build (e.g. "Build a login portal for a web app").`
      );
    }
  }

  return cleaned;
}

// ── FR01: Parse goal ──────────────────────────────────────────────────────────

async function fr01ParseGoal(goalText) {
  const prompt = `
You are a sprint planning assistant. Parse this project goal into structured data.
Return ONLY raw JSON — no markdown, no backticks, no explanation.

Goal: "${goalText}"

Required JSON structure:
{
  "problem_summary": "one sentence summary of what is being built",
  "domain": "one of: Web Application | Mobile App | API/Backend | Desktop Application | ML/AI System | Other",
  "deliverables": ["deliverable1", "deliverable2", "deliverable3"],
  "features": ["feature1", "feature2", "feature3", "feature4", "feature5"],
  "stakeholders": ["stakeholder1", "stakeholder2"],
  "non_functional": ["requirement1", "requirement2"],
  "assumptions": ["assumption1", "assumption2"],
  "time_text": null,
  "time_days_approx": 30,
  "budget_text": null,
  "platform_hints": ["web"],
  "confidence": 0.85
}

Rules:
- time_text: Extract the exact duration string from the goal (e.g. "8 weeks", "3 months").
  If no timeline is mentioned in the goal, you MUST set time_text to null. Do NOT invent or estimate a timeline.
- time_days_approx: Convert time_text to days (e.g. "8 weeks" → 56, "3 months" → 90).
  If time_text is null, use a reasonable default based on scope (typically 30–60 days).
- budget_text: Extract the exact budget string from the goal (e.g. "$5000", "£10k").
  If no budget is mentioned in the goal, you MUST set budget_text to null. Do NOT invent or estimate a budget.
- NEVER hallucinate or guess values for time_text or budget_text. Only populate them from explicit text in the goal.
- domain must be exactly one of the listed options.
- confidence must be a float between 0.0 and 1.0.
  Set confidence >= 0.7 for any clear build/create/develop goal, even if short.
  Only set confidence below 0.6 for completely meaningless input (single words, greetings).
- deliverables must always contain at least 1 item if the goal mentions something to build.
- If the goal is truly nonsensical (not a software project at all), set confidence to 0.3 and deliverables to [].
`.trim();

  const raw = await callGroq(prompt);
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`FR01 (Groq) returned invalid JSON: ${raw.slice(0, 300)}`);
  }
}

// ── FR02: Decompose into tasks ────────────────────────────────────────────────

async function fr02DecomposeTasks(fr01) {
  const prompt = `
You are a sprint planning assistant. Decompose this project into development tasks.
Return ONLY a raw JSON array — no markdown, no backticks, no explanation.

Goal: "${fr01.problem_summary}"
Domain: ${fr01.domain}
Features: ${(fr01.features || []).join(", ")}
Timeline: ${fr01.time_text || "not specified"}

Return a JSON array of tasks:
[
  {
    "id": "T-001",
    "title": "Task title",
    "estimate_days": 3,
    "depends_on": [],
    "type": "task",
    "notes": "brief description of this task"
  }
]

Rules:
- Generate 10 to 16 tasks.
- estimate_days must be an integer between 1 and 8.
- depends_on is an array of other task titles (strings), or empty [].
- Always include tasks for: Requirements, Design/Wireframes, core Development, Testing, Deployment.
- Tailor tasks to the domain (e.g. for Mobile App include: iOS build, Android build, etc.).
`.trim();

  const raw = await callGroq(prompt);
  let tasks;
  try {
    tasks = JSON.parse(raw);
  } catch (e) {
    throw new Error(`FR02 (Groq) returned invalid JSON: ${raw.slice(0, 300)}`);
  }

  // Re-assign sequential IDs and build id→title map for resolution
  const reindexed = tasks.map((t, i) => ({
    ...t,
    id: `T-${String(i + 1).padStart(3, "0")}`,
    estimate_days: Math.max(1, Math.min(8, parseInt(t.estimate_days) || 3)),
  }));

  // If Groq ignored the "use titles" rule and returned IDs, resolve them back to titles
  const idToTitle = {};
  reindexed.forEach(t => { idToTitle[t.id] = t.title; });

  return reindexed.map(t => ({
    ...t,
    depends_on: Array.isArray(t.depends_on)
      ? t.depends_on.map(dep => idToTitle[dep] || dep)
      : [],
  }));
}

// ── FR03: Schedule sprints (pure JS — no LLM needed) ─────────────────────────

function fr03GenerateSprintPlan(tasks, fr01, { sprintDays = 14, velocity = 14 } = {}) {
  const scheduled = new Set();
  const remaining = [...tasks];
  const sprints   = [];
  let safety = 0;

  while (remaining.length > 0 && safety++ < 300) {
    const sprintTasks = [];
    let capacity = velocity;
    let progress = true;

    while (progress) {
      progress = false;
      for (let i = remaining.length - 1; i >= 0; i--) {
        const task    = remaining[i];
        const depsOk  = task.depends_on.every(dep => scheduled.has(dep));
        if (depsOk && task.estimate_days <= capacity) {
          sprintTasks.push(task);
          capacity -= task.estimate_days;
          scheduled.add(task.title);
          remaining.splice(i, 1);
          progress = true;
        }
      }
    }

    // Force-schedule if all remaining tasks are blocked (avoid infinite loop)
    if (sprintTasks.length === 0 && remaining.length > 0) {
      const forced = remaining.shift();
      sprintTasks.push(forced);
      scheduled.add(forced.title);
    }

    if (sprintTasks.length > 0) {
      sprints.push({
        sprint_id:               `SPRINT-${String(sprints.length + 1).padStart(2, "0")}`,
        sprint_length_days:      sprintDays,
        capacity_days:           velocity,
        used_days:               sprintTasks.reduce((s, t) => s + t.estimate_days, 0),
        remaining_capacity_days: Math.max(0, capacity),
        tasks:                   sprintTasks,
      });
    }
  }

  const totalDays = sprints.reduce((s, sp) => s + sp.used_days, 0);

  return {
    sprint_plan_id: `PLAN-${Date.now()}`,
    timestamp_utc:  new Date().toISOString(),
    original_goal:  fr01.problem_summary,
    domain:         fr01.domain,
    assumptions: {
      sprint_length_days:       sprintDays,
      velocity_days_per_sprint: velocity,
      planning_method:          "topological + greedy packing",
      notes: `Dependencies are respected. Sprint velocity: ${velocity} person-days.`,
    },
    summary: {
      num_sprints:          sprints.length,
      total_estimated_days: totalDays,
      avg_days_per_sprint:  Math.round(totalDays / Math.max(1, sprints.length) * 10) / 10,
    },
    sprints,
  };
}

// ── Python helper (FR05 only) ─────────────────────────────────────────────────

function runPython(args) {
  return new Promise((resolve, reject) => {
    execFile(
      PY_BIN,
      [PY_SCRIPT, ...args],
      { timeout: TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          let pyError = null;
          try { pyError = JSON.parse(stdout); } catch (_) {}
          if (pyError && pyError.error) {
            return reject(new Error(`SprintPilotAI: ${pyError.error}`));
          }
          return reject(new Error(`SprintPilotAI process failed:\n${stderr || err.message}`));
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (parseErr) {
          reject(new Error(`SprintPilotAI returned invalid JSON:\n${stdout.slice(0, 500)}`));
        }
      }
    );
  });
}

// ── Velocity validation helper ────────────────────────────────────────────────

/**
 * Parse and validate a user-supplied velocity value.
 * Accepts numbers or numeric strings. Must be an integer in [1, 999].
 *
 * @param {number|string} raw
 * @returns {number} validated integer velocity
 * @throws {TypeError} if the value is missing, non-numeric, or out of range
 */
function validateVelocity(raw) {
  if (raw === undefined || raw === null || raw === "") {
    throw new TypeError(
      "velocity is required. Please enter the number of person-days your team " +
      "can complete per sprint (e.g. 10, 14, 20)."
    );
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || isNaN(parsed)) {
    throw new TypeError(
      `"${raw}" is not a valid velocity. Please enter a whole number (e.g. 10, 14, 20).`
    );
  }

  const int = Math.round(parsed);

  if (int < 1 || int > 999) {
    throw new TypeError(
      `Velocity must be between 1 and 999 person-days per sprint (got ${int}).`
    );
  }

  return int;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * STAGE 1 — Parse the goal only (FR01).
 * Call this first, then prompt the user for velocity, then call pipelineComplete().
 *
 * @param {string} goalText  Natural-language project goal.
 * @returns {Promise<{fr01: object, velocity_prompt: string}>}
 */
async function pipelineParseGoal(goalText) {
  if (!goalText || typeof goalText !== "string") {
    throw new TypeError("goalText must be a non-empty string.");
  }

  const cleaned = validateGoalText(goalText);
  const fr01    = await fr01ParseGoal(cleaned);

  if (fr01.confidence < 0.6 && fr01.deliverables.length === 0) {
    throw new TypeError(
      `"${cleaned}" does not appear to be a valid project goal. ` +
      `Please describe what you want to build (e.g. "Build a food delivery app in 8 weeks").`
    );
  }

  return {
    fr01,
    velocity_prompt:
      "How many person-days can your team complete per sprint? " +
      "(e.g. 10 for a small team, 14 for a standard two-week sprint, 20 for a larger team)",
  };
}

/**
 * STAGE 2 — Complete the pipeline (FR02 + FR03) using the fr01 result and user-supplied velocity.
 *
 * @param {object} fr01                  Result object from pipelineParseGoal().fr01
 * @param {number|string} velocityInput  Velocity entered by the user (person-days per sprint).
 * @param {object} [opts]
 * @param {number} [opts.sprintDays=14]  Sprint length in calendar days.
 * @returns {Promise<{fr01: object, fr02: object, fr03: object}>}
 */
async function pipelineComplete(fr01, velocityInput, { sprintDays = 14 } = {}) {
  if (!fr01 || typeof fr01 !== "object") {
    throw new TypeError("fr01 must be the parsed goal object returned by pipelineParseGoal().");
  }

  const velocity = validateVelocity(velocityInput);
  const tasks    = await fr02DecomposeTasks(fr01);
  const fr03     = fr03GenerateSprintPlan(tasks, fr01, { sprintDays, velocity });

  return { fr01, fr02: { tasks }, fr03 };
}

/**
 * Run the full FR01 → FR02 → FR03 pipeline in one call.
 * velocity is now REQUIRED — no silent default is applied.
 *
 * @param {string}        goalText              Natural-language project goal.
 * @param {object}        opts
 * @param {number|string} opts.velocity         Team velocity in person-days per sprint (required).
 * @param {number}        [opts.sprintDays=14]  Sprint length in calendar days.
 * @returns {Promise<{fr01: object, fr02: object, fr03: object}>}
 */
async function pipeline(goalText, { sprintDays = 14, velocity } = {}) {
  if (!goalText || typeof goalText !== "string") {
    throw new TypeError("goalText must be a non-empty string.");
  }

  const velocity_validated = validateVelocity(velocity);
  const { fr01 }           = await pipelineParseGoal(goalText);

  return pipelineComplete(fr01, velocity_validated, { sprintDays });
}

/**
 * FR05: Predict task success probability (unchanged — uses Python/joblib).
 *
 * @param {object} inputData  Feature object.
 * @param {object} [opts]
 * @param {string} [opts.modelsDir]  Path to folder containing .joblib + .json files.
 * @returns {Promise<{prediction: number, success_probability: number, threshold: number, input_used: object}>}
 *
 * Required fields:
 *   task_type, assignee_role, experience_years,
 *   sprint_length_days, story_points,
 *   dependencies_count, blockers_count, priority_moscow,
 *   requirement_changes, communication_volume, sentiment_score,
 *   override_requested (optional)
 */
async function predict(inputData, { modelsDir } = {}) {
  if (!inputData || typeof inputData !== "object") {
    throw new TypeError("inputData must be a plain object.");
  }
  const dir  = modelsDir || MODELS_DIR;
  const args = ["predict", JSON.stringify(inputData), `--models-dir=${dir}`];
  return runPython(args);
}

// ── Express route helpers ─────────────────────────────────────────────────────

const expressHandlers = {
  /**
   * POST /api/pipeline
   *
   * Two-step flow (recommended — prompts user for velocity between steps):
   *
   *   Step 1 — send goal only (no velocity):
   *     Body:    { goal_text, sprint_days? }
   *     Returns: { step: "needs_velocity", fr01: {...}, velocity_prompt: "..." }
   *             → Show velocity_prompt to the user, collect their answer, then call Step 2.
   *
   *   Step 2 — send goal + fr01 + user-supplied velocity:
   *     Body:    { goal_text, sprint_days?, velocity: <number>, fr01: <fr01 from step 1> }
   *     Returns: { fr01: {...}, fr02: {...}, fr03: {...} }
   *
   * Single-step (programmatic / CLI callers) — supply velocity upfront:
   *     Body:    { goal_text, sprint_days?, velocity: 14 }
   *     Returns: { fr01: {...}, fr02: {...}, fr03: {...} }
   */
  pipeline: async (req, res) => {
    const { goal_text, sprint_days, velocity, fr01: fr01Body } = req.body || {};

    if (!goal_text) {
      return res.status(400).json({ error: "goal_text is required." });
    }

    try {
      // Step 2: fr01 already parsed client-side, velocity now provided by user
      if (fr01Body && velocity !== undefined && velocity !== null && velocity !== "") {
        const result = await pipelineComplete(fr01Body, velocity, { sprintDays: sprint_days });
        return res.json(result);
      }

      // Step 1: parse goal only, return prompt asking for velocity
      if (velocity === undefined || velocity === null || velocity === "") {
        const { fr01, velocity_prompt } = await pipelineParseGoal(goal_text);
        return res.json({ step: "needs_velocity", fr01, velocity_prompt });
      }

      // Single-step: velocity was supplied upfront
      const result = await pipeline(goal_text, { sprintDays: sprint_days, velocity });
      res.json(result);

    } catch (err) {
      const status = err instanceof TypeError ? 400 : 500;
      res.status(status).json({ error: err.message });
    }
  },

  /**
   * POST /api/predict
   * Body: FR05 feature object
   */
  predict: async (req, res) => {
    try {
      const result = await predict(req.body || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = { pipeline, pipelineParseGoal, pipelineComplete, predict, expressHandlers };