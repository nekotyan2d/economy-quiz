export type OnlineStatus = "online" | "offline";

export type GamePhase =
    | "lobby"
    | "quiz-stage-1"
    | "quiz-stage-2"
    | "quiz-stage-3"
    | "stage-break-1"
    | "stage-break-2"
    | "stage-break-3"
    | "crossword"
    | "finished";

export interface Participant {
    sessionId: string;
    name: string;
    registeredAt: Date;
    quizScores: {
        stage1: number;
        stage2: number;
        stage3: number;
    };
    onlineStatus: OnlineStatus;
    lastPongAt: Date;
    answers: Record<string, string>;
    crosswordProgress: {
        solvedWords: string[];
        wordTimes: Record<string, number>;
        totalTime: number;
    };
}

export interface GameState {
    phase: GamePhase;
    currentQuestionIndex: number;
    stageStartedAt: Date | null;
    crosswordStartedAt: Date | null;
}

export interface Question {
    id: string;
    stage: 1 | 2 | 3;
    text: string;
    options: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
    timeLimitSeconds: number;
}

export interface CrosswordWord {
    id: string;
    answer: string;
    hint: string;
    row: number;
    col: number;
    direction: "across" | "down";
}

export interface ServerEvent {
    event: string;
    data: Record<string, unknown>;
}
