export interface Quiz {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  theory: string;
  starterCode: string;
  validationType: "stdout" | "eval" | "none";
  validationCode?: string;
  expectedOutput?: string;
  hint?: string;
  quiz?: Quiz;
}

export interface Module {
  id: string;
  title: string;
  summary: string;
  xpReward: number;
  lessons: Lesson[];
}

export interface CodeTemplate {
  id: string;
  title: string;
  desc: string;
  code: string;
}

export interface CheatSheetItem {
  category: string;
  title: string;
  desc: string;
  code: string;
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  completedLessons: string[]; // lessonId or quiz_lessonId
  completedModules: string[];
  lessonCodes: Record<string, string>;
}
