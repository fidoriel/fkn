import { useEffect, useState, useMemo } from "react";
import { questionData } from "../data/questions";
import QuestionCard from "../components/QuestionCard";
import { loadState, saveState, AIConfig } from "../lib/storage";
import { evaluateTextAnswer } from "../lib/ai";

const SESSION_MINUTES = 30;

export default function Learn() {
  const [state, setState] = useState(() => loadState());
  const [setName, setSetName] = useState<string | undefined>(state.selectedSet);
  const [index, setIndex] = useState(0);
  const [questions, setQuestions] = useState<number[]>([]);

  useEffect(() => {
    if (!setName) return;
    const s = questionData.questionsets.find((s) => s.name === setName);
    if (!s) return;
    setQuestions(s.questions);
    setIndex(0);

    // ensure session start timestamp is set when user picks a set
    const st = loadState();
    if (!st.selectedSetStartAt || st.selectedSet !== setName) {
      st.selectedSet = setName;
      st.selectedSetStartAt = new Date().toISOString();
      saveState(st);
      setState(loadState());
    }
  }, [setName]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const aiConfig = state.aiConfig as AIConfig | undefined;

  const currentQ = useMemo(() => {
    const num = questions[index];
    if (!num) return null;
    return questionData.questions.find((q) => q.number === num) || null;
  }, [questions, index]);

  // session handling
  const sessionStart = state.selectedSetStartAt
    ? new Date(state.selectedSetStartAt)
    : null;
  const now = Date.now();
  const remainingMs = sessionStart
    ? Math.max(0, sessionStart.getTime() + SESSION_MINUTES * 60 * 1000 - now)
    : 0;
  const sessionActive = remainingMs > 0;

  // counts for progress bar and points
  const total = questions.length;
  const correctSoFar = Object.values(state.progress || {}).reduce(
    (acc, p: any) => acc + (p.correctCount || 0),
    0,
  );
  const partialSoFar = Object.values(state.progress || {}).reduce(
    (acc, p: any) => acc + (p.partialCount || 0),
    0,
  );
  const wrongSoFar = Object.values(state.progress || {}).reduce(
    (acc, p: any) => acc + (p.wrongCount || 0),
    0,
  );
  const totalPoints = Object.values(state.progress || {}).reduce(
    (acc, p: any) => acc + (p.totalPoints || 0),
    0,
  );

  async function handleAnswer(
    correct: boolean,
    _text?: string,
    confidence?: number,
  ) {
    if (!currentQ) return;

    // If session expired, do not record points — just ignore
    if (!sessionActive) return;

    const progress = state.progress || {};
    const prev = progress[currentQ.number] || {
      correctCount: 0,
      partialCount: 0,
      wrongCount: 0,
      totalPoints: 0,
      lastStatus: null,
    };

    // Determine points: 2 = full, 1 = partial, 0 = wrong
    let points = 0;
    let status: "correct" | "partial" | "wrong" = "wrong";

    // Choice question scoring
    const isChoice = (currentQ as any).answer_options !== undefined;
    if (isChoice) {
      const selected = (_text || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const corrects: string[] = (currentQ as any).correct_answers || [];
      if (corrects.length <= 1) {
        if (selected.length === 1 && selected[0] === corrects[0]) {
          points = 2;
          status = "correct";
        } else {
          points = 0;
          status = "wrong";
        }
      } else {
        // multiple-correct: exact match => 2, non-empty subset => 1, else 0
        if (
          selected.length === corrects.length &&
          corrects.every((c) => selected.includes(c))
        ) {
          points = 2;
          status = "correct";
        } else if (
          selected.length > 0 &&
          selected.every((s) => corrects.includes(s))
        ) {
          points = 1;
          status = "partial";
        } else {
          points = 0;
          status = "wrong";
        }
      }
    } else {
      // Text question scoring using AI confidence when available
      if (typeof confidence === "number") {
        if (confidence > 0.85) {
          points = 2;
          status = "correct";
        } else if (confidence >= 0.6) {
          points = 1;
          status = "partial";
        } else {
          points = 0;
          status = "wrong";
        }
      } else {
        // fallback: use boolean correct flag
        if (correct) {
          points = 2;
          status = "correct";
        } else {
          points = 0;
          status = "wrong";
        }
      }
    }

    const next = {
      ...prev,
      lastStatus: status,
      lastAt: new Date().toISOString(),
      correctCount: prev.correctCount + (points === 2 ? 1 : 0),
      partialCount: (prev.partialCount || 0) + (points === 1 ? 1 : 0),
      wrongCount: prev.wrongCount + (points === 0 ? 1 : 0),
      totalPoints: (prev.totalPoints || 0) + points,
    } as any;

    progress[currentQ.number] = next;
    const s = { ...state, progress };
    setState(s);
    saveState(s);
  }

  async function evaluateWithAI(answer: string) {
    if (!aiConfig) return { correct: false, message: "No AI configured" };
    const q = currentQ as any;
    const res = await evaluateTextAnswer(
      aiConfig,
      q.question,
      q.correct_answer,
      answer,
    );
    // map to fields expected by QuestionCard
    return {
      correct: (res.confidence || 0) > 0.7,
      confidence: res.confidence,
      message: res.message,
    };
  }

  function handleNext() {
    setIndex((i) => {
      const ni = i + 1;
      if (ni >= questions.length) return 0;
      return ni;
    });
  }

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Lernen</h2>

      <div className="mb-4">
        <label className="block mb-1">Fragebogen wählen</label>
        <select
          value={setName || ""}
          onChange={(e) => {
            const val = e.target.value;
            setSetName(val || undefined);
            const s = loadState();
            s.selectedSet = val || undefined;
            saveState(s);
            setState(loadState());
          }}
        >
          <option value="">-- auswählen --</option>
          {questionData.questionsets.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm">
            Frage {index + 1} / {total || 0}
          </div>
          <div className="text-sm">
            Richtig: {correctSoFar} • Teilweise: {partialSoFar} • Falsch:{" "}
            {wrongSoFar} • Punkte: {totalPoints}
          </div>
        </div>
        <div className="h-2 bg-border rounded overflow-hidden">
          <div
            className="h-2 bg-primary"
            style={{
              width: total
                ? `${Math.round(((index + 1) / total) * 100)}%`
                : "0%",
            }}
          />
        </div>
        {!sessionActive ? (
          <div className="mt-2 text-sm text-red-600">
            Zeit abgelaufen: Antworten werden nicht mehr bewertet (30 Minuten
            vorbei).
          </div>
        ) : (
          <div className="mt-2 text-sm text-muted-foreground">
            Verbleibende Zeit: {Math.ceil(remainingMs / 1000)}s
          </div>
        )}
      </div>

      {currentQ ? (
        <QuestionCard
          q={currentQ as any}
          onAnswer={handleAnswer}
          onNext={handleNext}
          evaluateWithAI={aiConfig ? (ans) => evaluateWithAI(ans) : undefined}
          sessionActive={sessionActive}
          remainingMs={remainingMs}
        />
      ) : (
        <p>Wähle einen Fragebogen um zu starten.</p>
      )}

      <div className="mt-4">
        <h3 className="font-semibold">Fortschritt</h3>
        <ul>
          {Object.entries(state.progress || {})
            .slice(0, 50)
            .map(([k, v]) => (
              <li key={k}>
                Frage {k}: {v.lastStatus} ({v.correctCount} / {v.wrongCount} /{" "}
                {v.partialCount}) • Punkte: {v.totalPoints}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
