const BASE = import.meta.env.VITE_API_URL || "/api";

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function startInterview({ interviewType, subject, difficulty, numQuestions }) {
  const res = await fetch(`${BASE}/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interviewType, subject, difficulty, numQuestions }),
  });
  return handle(res);
}

export async function submitAnswer(sessionId, answer) {
  const res = await fetch(`${BASE}/interview/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, answer }),
  });
  return handle(res);
}

export async function endInterview(sessionId) {
  const res = await fetch(`${BASE}/interview/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  return handle(res);
}