import { useState } from "react";
import { ChoiceQuestion, TextQuestion } from "../types";

type Props = {
  q: ChoiceQuestion | TextQuestion;
  onAnswer: (correct: boolean, text?: string, confidence?: number) => void; // records the answer (but doesn't advance)
  onNext: () => void; // advance to next question
  evaluateWithAI?: (
    text: string,
  ) => Promise<{ correct: boolean; confidence?: number; message?: string }>;
  sessionActive?: boolean;
  remainingMs?: number;
};

export default function QuestionCard({
  q,
  onAnswer,
  onNext,
  evaluateWithAI,
  sessionActive = true,
  remainingMs = 0,
}: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | undefined>(undefined);
  const isChoice = (q as ChoiceQuestion).answer_options !== undefined;

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null);

  async function submitText() {
    if (sessionActive === false) return;
    setAiMessage(undefined);
    if (!evaluateWithAI) {
      const expected = (q as TextQuestion).correct_answer.toLowerCase();
      const got = text.toLowerCase();
      const ok = got.includes(expected) || expected.includes(got);
      setResultCorrect(ok);
      setChecked(true);
      onAnswer(ok, text, ok ? 1 : 0);
      return;
    }

    setLoading(true);
    try {
      const res = await evaluateWithAI(text);
      if (res.message) setAiMessage(res.message);
      setResultCorrect(res.correct);
      setChecked(true);
      onAnswer(res.correct, text, res.confidence);
    } finally {
      setLoading(false);
    }
  }

  function toggleOption(opt: string) {
    if (checked) return;
    const corrects = (q as ChoiceQuestion).correct_answers;
    // if only one correct answer, behave like radio (single select)
    if (corrects.length <= 1) {
      setSelectedOptions([opt]);
      return;
    }
    // multiple answers allowed -> toggle
    setSelectedOptions((prev) => {
      if (prev.includes(opt)) return prev.filter((p) => p !== opt);
      return [...prev, opt];
    });
  }

  function checkChoice() {
    const selected = selectedOptions;
    const corrects = (q as ChoiceQuestion).correct_answers;
    let ok = false;
    if (corrects.length <= 1) {
      ok = selected.length === 1 && selected[0] === corrects[0];
    } else {
      // check that selected contains exactly all correct answers
      if (selected.length === corrects.length) {
        ok = corrects.every((c) => selected.includes(c));
      } else ok = false;
    }
    setResultCorrect(ok);
    setChecked(true);
    onAnswer(ok, selected.join(", ") || undefined, ok ? 1 : 0);
  }

  function skip() {
    setResultCorrect(false);
    setChecked(true);
    onAnswer(
      false,
      isChoice ? selectedOptions.join(", ") || undefined : text || undefined,
      0,
    );
  }

  return (
    <div className="p-4 bg-card rounded-md shadow-sm">
      <h3 className="font-semibold mb-2">Frage {q.number}</h3>
      <p className="mb-4">{q.question}</p>

      {!sessionActive ? (
        <div className="mb-3 p-2 rounded bg-red-50 text-red-700">
          Zeit abgelaufen — Antworten werden nicht bewertet.
        </div>
      ) : (
        <div className="mb-3 text-sm text-muted-foreground">
          Verbleibende Zeit: {Math.ceil(remainingMs / 1000)}s
        </div>
      )}

      {isChoice ? (
        <div className="flex flex-col gap-2">
          {(q as ChoiceQuestion).answer_options.map((opt) => {
            const corrects = (q as ChoiceQuestion).correct_answers;
            const isCorrect = corrects.includes(opt);
            const isSelected = selectedOptions.includes(opt);

            let classes = "px-3 py-2 rounded border text-left transition-all";
            if (!checked) classes += " hover:bg-primary/5";
            if (checked) {
              if (isCorrect)
                classes +=
                  " bg-green-200 border-green-600 text-green-800 ring-1 ring-green-300";
              else if (isSelected && !isCorrect)
                classes +=
                  " bg-red-200 border-red-600 text-red-800 ring-1 ring-red-300";
              else classes += " bg-muted/80 text-muted-foreground";
            } else if (isSelected) {
              classes += " bg-primary/20 ring-1 ring-primary/50 font-medium";
            }

            return (
              <button
                key={opt}
                onClick={() => toggleOption(opt)}
                className={classes}
                disabled={checked}
              >
                <span className="inline-block w-full">{opt}</span>
              </button>
            );
          })}

          <div className="flex gap-2 mt-2">
            <button
              onClick={checkChoice}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
              disabled={loading || checked || selectedOptions.length === 0}
            >
              {loading ? "Prüfe..." : "Antwort prüfen"}
            </button>
            <button
              onClick={skip}
              className="px-4 py-2 border rounded"
              disabled={loading || checked}
            >
              Überspringen
            </button>
            {checked ? (
              <button
                onClick={() => {
                  // move to next
                  setChecked(false);
                  setSelectedOptions([]);
                  setText("");
                  setResultCorrect(null);
                  setAiMessage(undefined);
                  onNext();
                }}
                className="ml-auto px-4 py-2 bg-secondary text-secondary-foreground rounded"
              >
                Weiter
              </button>
            ) : null}
          </div>

          {checked ? (
            <div className="mt-3 p-3 rounded bg-muted">
              <div className="font-semibold">
                {resultCorrect ? "Richtig" : "Falsch"}
              </div>
              <div className="mt-2 text-sm">
                Richtige Antwort:{" "}
                {(q as ChoiceQuestion).correct_answers.join(", ")}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="p-2 border rounded"
            placeholder="Antwort eingeben..."
            disabled={checked}
          />
          <div className="flex gap-2">
            <button
              onClick={() => submitText()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
              disabled={loading || checked || !text}
            >
              {loading ? "Prüfe..." : "Antwort prüfen"}
            </button>
            <button
              onClick={skip}
              className="px-4 py-2 border rounded"
              disabled={loading || checked}
            >
              Überspringen
            </button>
            {checked ? (
              <button
                onClick={() => {
                  setChecked(false);
                  setSelectedOptions([]);
                  setText("");
                  setResultCorrect(null);
                  setAiMessage(undefined);
                  onNext();
                }}
                className="ml-auto px-4 py-2 bg-secondary text-secondary-foreground rounded"
              >
                Weiter
              </button>
            ) : null}
          </div>

          {checked ? (
            <div className="mt-3 p-3 rounded bg-muted">
              <div className="font-semibold">
                {resultCorrect ? "Richtig" : "Falsch"}
              </div>
              <div className="mt-2 text-sm">
                Musterlösung: {(q as TextQuestion).correct_answer}
              </div>
              {aiMessage ? (
                <div className="mt-2 text-sm">
                  <strong>KI-Begründung:</strong>
                  <div>{aiMessage}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
