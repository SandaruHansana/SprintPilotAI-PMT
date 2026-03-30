"use strict";

// Imports: child_process to call Python, path for file resolution, Groq SDK for LLM calls
const { execFile } = require("child_process");
const path = require("path");
const Groq = require("groq-sdk");

// Environment config
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL   = process.env.GROQ_MODEL   || "llama-3.3-70b-versatile";


const PY_BIN     = process.env.SPRINTPILOT_PYTHON     || "python";
const PY_SCRIPT  = process.env.SPRINTPILOT_PY_PATH    || path.join(__dirname, "sprintpilot.py");
const MODELS_DIR = process.env.SPRINTPILOT_MODELS_DIR || path.join(__dirname, "models");
const TIMEOUT_MS = parseInt(process.env.SPRINTPILOT_TIMEOUT_MS || "300000", 10);

// Creates and returns a Groq client 
function getGroqClient() {
  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Get a free key at https://console.groq.com " +
      "and add it to your .env: GROQ_API_KEY=your_key_here"
    );
  }
  return new Groq({ apiKey: GROQ_API_KEY });
}

// Sends a prompt to the Groq API and returns the plain text 
async function callGroq(prompt) {
  const groq = getGroqClient();
  const res = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: GROQ_MODEL,
  });
  return res.choices[0].message.content.replace(/```json\s*|```/g, "").trim();
}

// List of single-word or greeting inputs that are not valid project goals
const INVALID_GOAL_PATTERNS = [
  /^(help|hi|hello|hey|test|ok|okay|yes|no|thanks|bye|quit|exit|start|go|run)$/i,
];

// Validates the raw goal text: rejects inputs that are too short or match known non-goal patterns
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

// FR01

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

// FR02

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

  // Give each task a clean sequential ID and clamp estimate_days to the allowed 1-8 range
  const reindexed = tasks.map((t, i) => ({
    ...t,
    id: `T-${String(i + 1).padStart(3, "0")}`,
    estimate_days: Math.max(1, Math.min(8, parseInt(t.estimate_days) || 3)),
  }));

  // Build a map of ID to title so dependency references can be resolved to readable names
  const idToTitle = {};
  reindexed.forEach(t => { idToTitle[t.id] = t.title; });

  return reindexed.map(t => ({
    ...t,
    depends_on: Array.isArray(t.depends_on)
      ? t.depends_on.map(dep => idToTitle[dep] || dep)
      : [],
  }));
}

// FR03

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

    // Force-schedule the next blocked task to avoid getting stuck in an infinite loop
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

// Spawns sprintpilot.py 

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

// Validates the velocity value 

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

//  validates and parses the goal text via FR01

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

//  takes the fr01 result and user-supplied velocity

async function pipelineComplete(fr01, velocityInput, { sprintDays = 14 } = {}) {
  if (!fr01 || typeof fr01 !== "object") {
    throw new TypeError("fr01 must be the parsed goal object returned by pipelineParseGoal().");
  }

  const velocity = validateVelocity(velocityInput);
  const tasks    = await fr02DecomposeTasks(fr01);
  const fr03     = fr03GenerateSprintPlan(tasks, fr01, { sprintDays, velocity });

  return { fr01, fr02: { tasks }, fr03 };
}

// Runs the full  pipeline 

async function pipeline(goalText, { sprintDays = 14, velocity } = {}) {
  if (!goalText || typeof goalText !== "string") {
    throw new TypeError("goalText must be a non-empty string.");
  }

  const velocity_validated = validateVelocity(velocity);
  const { fr01 }           = await pipelineParseGoal(goalText);

  return pipelineComplete(fr01, velocity_validated, { sprintDays });
}

// FR05

async function predict(inputData, { modelsDir } = {}) {
  if (!inputData || typeof inputData !== "object") {
    throw new TypeError("inputData must be a plain object.");
  }
  const dir  = modelsDir || MODELS_DIR;
  const args = ["predict", JSON.stringify(inputData), `--models-dir=${dir}`];
  return runPython(args);
}

// Express route handlers

const expressHandlers = {
  pipeline: async (req, res) => {
    const { goal_text, sprint_days, velocity, fr01: fr01Body } = req.body || {};

    if (!goal_text) {
      return res.status(400).json({ error: "goal_text is required." });
    }

    try {
      if (fr01Body && velocity !== undefined && velocity !== null && velocity !== "") {
        const result = await pipelineComplete(fr01Body, velocity, { sprintDays: sprint_days });
        return res.json(result);
      }

      if (velocity === undefined || velocity === null || velocity === "") {
        const { fr01, velocity_prompt } = await pipelineParseGoal(goal_text);
        return res.json({ step: "needs_velocity", fr01, velocity_prompt });
      }

      const result = await pipeline(goal_text, { sprintDays: sprint_days, velocity });
      res.json(result);

    } catch (err) {
      const status = err instanceof TypeError ? 400 : 500;
      res.status(status).json({ error: err.message });
    }
  },

  predict: async (req, res) => {
    try {
      const result = await predict(req.body || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

// Export public functions and Express handlers for use by other modules
module.exports = { pipeline, pipelineParseGoal, pipelineComplete, predict, expressHandlers };