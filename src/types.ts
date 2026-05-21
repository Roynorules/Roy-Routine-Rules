export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface MetricCard {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  category: string;
  completed: boolean;
}

export interface PlannerSection {
  id: string;
  title: string;
  category: "study" | "health" | "dopamine" | "life";
  targetText: string;
  completed: boolean;
  notes: string;
}

export interface AppState {
  apiKey: string;
  isConnected: boolean;
  metrics: {
    studyHours: MetricCard;
    mcqsSolved: MetricCard;
    runningKm: MetricCard;
    pushupsCount: MetricCard;
    sleepHours: MetricCard;
    waterLitres: MetricCard;
    dopamineScore: MetricCard; // represented as tasks avoided or focus checklist items checked
    youtubeWork: MetricCard; // uploads/script/edit work (0 to 1 done is complete)
    consistencyStreak: MetricCard;
  };
  planner: PlannerSection[];
  chatHistory: ChatMessage[];
  deepWorkActive: boolean;
  deepWorkDuration: number; // in seconds
  timerSecondsRemaining: number;
  timerMode: "focus" | "break";
  timerRunning: boolean;
}
