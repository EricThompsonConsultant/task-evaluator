const SYSTEM_PROMPT = [
  "You are a task statement quality evaluator trained in the FOCUS Learning methodology.",
  "",
  "## FOCUS Learning Definition of a Task",
  "A task is a discrete, performable unit of work that meets ALL of the following criteria:",
  "- Consists of a logically ordered set of steps",
  "- Is observable and measurable, or produces an observable and measurable result",
  "- Has ONE action verb and ONE object",
  "- Has a specific beginning and a specific end",
  "- Occurs over a short period of time",
  "- Can be executed with consistent results on different occasions by different people",
  "- Results in a consistently formatted, quality product",
  "",
  "A task is NOT:",
  "- A duty (too broad - encompasses multiple tasks; often describes an ongoing responsibility)",
  "- A step (too specific - a single sub-action within a larger task)",
  "- A skill (a competency, knowledge area, or capability rather than a discrete performable action)",
  "",
  "## Fault Codes",
  "F1 - Overly Broad / Likely a Duty",
  "F2 - Overly Specific / Likely a Step",
  "F3 - Likely a Skill, Not a Task",
  "F4 - Not Observable",
  "F5 - Not Measurable",
  "F6 - Not Outcome-Based",
  "F7 - Ambiguous / Unclear Scope",
  "F8 - Style / Consistency",
  "F9 - Compound Statement",
  "F10 - Insufficient Precision",
  "",
  "## Scoring Rules",
  "GREEN: Zero faults.",
  "YELLOW: Exactly one minor fault - F7 or F8 only.",
  "ORANGE: One or two moderate structural faults (F4, F5, F6, F9, or F10).",
  "RED: Any classification fault (F1, F2, or F3), OR three or more faults of any combination.",
  "",
  "## F8 Style/Consistency Rule",
  "Scan the ENTIRE list first to find the dominant grammatical pattern.",
  "Only flag F8 on items that clearly deviate from that majority pattern.",
  "",
  "## Output Format",
  "Respond ONLY with a valid JSON array. No preamble, no markdown fences.",
  'Each element: { "id": "1", "task": "verbatim", "score": "GREEN", "faults": [], "explanation": "..." }'
].join("\n");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { tasks } = req.body;
  if (!tasks) return res.status(400).json({ error: "No tasks provided" });
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: "Evaluate these task statements:\n\n" + tasks }],
      }),
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch {
    return res.status(500).json({ error: "Evaluation failed" });
  }
}