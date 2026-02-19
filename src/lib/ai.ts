import { AIConfig } from "./storage";

type AIResponse = {
  ok: boolean;
  score?: number; // 0..1 where >threshold is correct
  message?: string;
};

const DEFAULT_TIMEOUT = 15000;

// Stricter evaluator: instruct model to be conservative and return a single JSON object
export async function evaluateTextAnswer(
  config: AIConfig | undefined,
  question: string,
  correctAnswer: string,
  userAnswer: string,
): Promise<AIResponse> {
  if (!config) return { ok: false, message: "No AI configured" };

  // Strong, conservative instruction: prefer false when unsure
  const systemMessage =
    'Du bist ein Bewertungsassistent. Antworte NUR mit einem gültigen JSON-Objekt ohne zusätzlichen Text. Verwende strenge Kriterien: Wenn du nicht sehr sicher bist, setze "correct": false. Das Objekt muss die Felder haben: "correct" (boolean), "confidence" (number zwischen 0.0 und 1.0), "explanation" (kurzer String). Antworte kurz und präzise.';

  const userPrompt = `Beurteile streng, ob die folgende Antwort korrekt ist. Wenn die Antwort nur teilweise stimmt oder unsicher ist, markiere sie als falsch (correct=false).
Frage: "${question}"
Musterlösung: "${correctAnswer}"
Antwort des Lernenden: "${userAnswer}"
Gib die Bewertung IMMER als JSON zurück mit den Feldern: correct, confidence, explanation.`;

  try {
    const body = {
      model: config.model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.0,
      max_tokens: 200,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    const res = await fetch(config.basePath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: `AI request failed: ${res.status} ${text}` };
    }

    const data = await res.json();

    // Extract textual model output for common provider shapes
    let text = "";
    if (data.choices && data.choices[0] && data.choices[0].message) {
      text = data.choices[0].message.content || "";
    } else if (data.choices && data.choices[0] && data.choices[0].text) {
      text = data.choices[0].text || "";
    } else if (
      data.output &&
      Array.isArray(data.output) &&
      data.output[0] &&
      data.output[0].content
    ) {
      const content = data.output[0].content;
      if (typeof content === "string") text = content;
      else if (
        Array.isArray(content) &&
        content[0] &&
        typeof content[0].text === "string"
      )
        text = content[0].text;
    } else if (typeof data === "string") {
      text = data;
    } else {
      text = JSON.stringify(data);
    }

    // Try to extract first JSON object in the reply
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let parsed: any = null;
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // continue to fallback
      }
    }

    function asBool(v: any) {
      if (typeof v === "boolean") return v;
      if (typeof v === "string")
        return (
          v.toLowerCase() === "true" ||
          v.toLowerCase() === "ja" ||
          v.toLowerCase() === "richtig" ||
          v.toLowerCase() === "yes"
        );
      return Boolean(v);
    }

    if (
      parsed &&
      (typeof parsed.correct === "boolean" ||
        typeof parsed.correct === "string")
    ) {
      const correct = asBool(parsed.correct);
      let confidence = 0;
      if (typeof parsed.confidence === "number") confidence = parsed.confidence;
      else if (typeof parsed.confidence === "string")
        confidence = parseFloat(parsed.confidence) || (correct ? 1 : 0);
      else confidence = correct ? 1 : 0;
      const explanation =
        parsed.explanation || parsed.reason || JSON.stringify(parsed);

      // Enforce bounds
      if (confidence > 1) confidence = 1;
      if (confidence < 0) confidence = 0;

      return { ok: true, score: confidence, message: explanation };
    }

    // Fallback: much stricter keyword-based heuristic
    const lower = text.toLowerCase();
    const positive =
      (lower.includes("true") ||
        lower.includes("richtig") ||
        lower.includes("yes") ||
        lower.includes("ja")) &&
      !/vielleicht|maybe|teilweise|unsicher|uncertain|kann sein|could|might/.test(
        lower,
      );

    const score = positive ? 0.95 : 0.05;
    return { ok: true, score, message: text };
  } catch (e: any) {
    if (e.name === "AbortError")
      return { ok: false, message: "AI request timed out" };
    return { ok: false, message: e.message };
  }
}
