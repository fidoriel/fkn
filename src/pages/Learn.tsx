import { useEffect, useState, useMemo } from "react";
import { questionData } from "../data/questions";
import QuestionCard from "../components/QuestionCard";
import { loadState, saveState, AIConfig } from "../lib/storage";
import { evaluateTextAnswer } from "../lib/ai";

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

  // counts for progress bar
  const total = questions.length;
  const correctSoFar = Object.values(state.progress || {}).reduce(
    (acc, p: any) => acc + (p.correctCount || 0),
    0,
  );
  const wrongSoFar = Object.values(state.progress || {}).reduce(
    (acc, p: any) => acc + (p.wrongCount || 0),
    0,
  );

  async function handleAnswer(correct: boolean, _text?: string) {
    if (!currentQ) return;
    const progress = state.progress || {};
    const prev = progress[currentQ.number] || {
      correctCount: 0,
      wrongCount: 0,
      lastStatus: null,
    };
    const next = {
      ...prev,
      lastStatus: correct ? ("correct" as const) : ("wrong" as const),
      lastAt: new Date().toISOString(),
    };
    if (correct) next.correctCount = (prev.correctCount || 0) + 1;
    else next.wrongCount = (prev.wrongCount || 0) + 1;
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
    return { correct: (res.score || 0) > 0.7, message: res.message };
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
            Richtig: {correctSoFar} • Falsch: {wrongSoFar}
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
      </div>

      {currentQ ? (
        <QuestionCard
          q={currentQ as any}
          onAnswer={handleAnswer}
          onNext={handleNext}
          evaluateWithAI={aiConfig ? (ans) => evaluateWithAI(ans) : undefined}
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
                Frage {k}: {v.lastStatus} ({v.correctCount} / {v.wrongCount})
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
