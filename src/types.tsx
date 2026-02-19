export interface ChoiceQuestion {
  number: number;
  question: string;
  answer_options: string[];
  correct_answers: string[];
}

export interface TextQuestion {
  number: number;
  question: string;
  correct_answer: string;
}

export interface QuestionSet {
  name: string;
  questions: number[];
}

export interface QuestionData {
  questions: (ChoiceQuestion | TextQuestion)[];
  questionsets: QuestionSet[];
}
