import { useMemo, useState } from "react";
import { questionData } from "@/data/questions";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { ChoiceQuestion, TextQuestion } from "@/types";

function isChoice(q: ChoiceQuestion | TextQuestion): q is ChoiceQuestion {
  return (q as ChoiceQuestion).answer_options !== undefined;
}

export default function Catalog() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return questionData.questions;
    return questionData.questions.filter((item) => {
      const inNumber = String(item.number).includes(term);
      const inQuestion = item.question.toLowerCase().includes(term);
      const inCorrectAnswer =
        !isChoice(item) && item.correct_answer
          ? item.correct_answer.toLowerCase().includes(term)
          : false;
      const inOptions =
        isChoice(item) && item.answer_options
          ? item.answer_options.join(" ").toLowerCase().includes(term)
          : false;
      return inNumber || inQuestion || inCorrectAnswer || inOptions;
    });
  }, [q]);

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Fragenkatalog</h1>

      <div className="mb-4">
        <Input
          placeholder="Suche Fragen, Nummern oder Antworten..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <Card key={item.number}>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-2">
                #{item.number}
              </div>
              <div className="font-medium mb-2">{item.question}</div>

              {isChoice(item) ? (
                <ul className="text-sm text-muted-foreground list-disc pl-5">
                  {item.answer_options.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              ) : null}

              {!isChoice(item) && item.correct_answer ? (
                <div className="mt-2 text-sm text-muted-foreground">
                  Antwort: {item.correct_answer}
                </div>
              ) : null}

              {isChoice(item) && item.correct_answers ? (
                <div className="mt-2 text-sm text-muted-foreground">
                  Antwort(en): {item.correct_answers.join(", ")}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
