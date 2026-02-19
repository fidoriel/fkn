export type AIConfig = {
  basePath: string;
  model: string;
  apiKey: string;
};

export type QuestionProgress = {
  correctCount: number;
  partialCount?: number;
  wrongCount: number;
  totalPoints?: number;
  lastStatus: "correct" | "partial" | "wrong" | null;
  lastAt?: string;
};

export type PersistedState = {
  aiConfig?: AIConfig;
  progress: Record<number, QuestionProgress>;
  selectedSet?: string;
  selectedSetStartAt?: string; // ISO timestamp when the user started this questionnaire
};

const STORAGE_KEY = "fkn_learn_state_v1";

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { progress: {} };
    return JSON.parse(raw) as PersistedState;
  } catch (e) {
    console.error("Failed to load state", e);
    return { progress: {} };
  }
}

export function saveState(s: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (e) {
    console.error("Failed to save state", e);
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportState(): string {
  return JSON.stringify(loadState(), null, 2);
}

export function importState(json: string) {
  try {
    const parsed = JSON.parse(json) as PersistedState;
    // basic validation
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON");
    saveState(parsed);
    return true;
  } catch (e) {
    console.error("Failed to import state", e);
    return false;
  }
}

export { STORAGE_KEY };
