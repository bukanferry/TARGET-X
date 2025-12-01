
export enum GameMode {
  MENU = 'MENU',
  INFINITY = 'INFINITY',
  POINT = 'POINT',
  RACE = 'RACE',
}

export enum Difficulty {
  EASY = 'EASY',     // Mudah
  MEDIUM = 'MEDIUM', // Sedang
  HARD = 'HARD',     // Sulit
  CUSTOM = 'CUSTOM', // Custom
}

export type Operator = '+' | '−' | '×' | '÷' | '^' | '√' | '!' | '(' | ')';

export interface CardItem {
  id: string;
  type: 'NUMBER' | 'OPERATOR';
  value: number | string;
  display: string;
  points?: number;
}

export interface GameState {
  mode: GameMode;
  difficulty: Difficulty;
  level: number;
  score: number;
  timer: number;
  isPlaying: boolean;
  isInputtingTarget: boolean; // For Custom mode
  isGameOver: boolean; // New Game Over state
  target: number;
  deck: Record<number, number>; // number -> count remaining
  expression: CardItem[];
  history: string[]; // For showing last solved equations
  message: string | null;
  messageType: 'info' | 'error' | 'success';
}
