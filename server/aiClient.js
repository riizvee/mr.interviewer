import "dotenv/config";

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/**
 * Calls Groq (OpenAI-compatible chat completions) and forces a JSON-only response.
 * `system` sets behavior, `user` is the actual request payload/context.
 * Returns the parsed JSON object.
 */
export async function askAIForJSON({ system, user, maxTokens = 1000 }) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Copy server/.env.example to server/.env and add your key."
    );
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${system}\n\nCRITICAL: Respond with ONLY a raw JSON object. No markdown code fences, no preamble, no explanation before or after. Just the JSON.`,
        },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Groq API error (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "";

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    throw new Error(`Failed to parse AI JSON response: ${raw.slice(0, 300)}`);
  }
}
